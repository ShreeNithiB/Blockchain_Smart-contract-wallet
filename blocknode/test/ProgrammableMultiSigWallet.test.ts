import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("ProgrammableMultiSigWallet", function () {
  async function deployWalletFixture() {
    const [owner1, owner2, owner3, nonOwner, recipient] = await ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address];
    const threshold = 2;
    const dailyLimit = ethers.parseEther("1.0");
    const highValueThreshold = ethers.parseEther("5.0");
    const timelockDuration = 60; // 60 seconds

    const Wallet = await ethers.getContractFactory("ProgrammableMultiSigWallet");
    const impl = await Wallet.deploy();
    await impl.waitForDeployment();
    
    const Factory = await ethers.getContractFactory("WalletFactory");
    const factory = await Factory.deploy(await impl.getAddress());
    await factory.waitForDeployment();
    
    const tx = await factory.createWallet(
      owners,
      threshold,
      dailyLimit,
      highValueThreshold,
      timelockDuration
    );
    const receipt = await tx.wait();
    
    // Find the WalletCreated event
    const event = receipt?.logs.find(
      (log) => log.topics[0] === factory.interface.getEvent("WalletCreated")?.topicHash
    );
    if (!event) throw new Error("WalletCreated event not found");
    const cloneAddress = factory.interface.decodeEventLog("WalletCreated", event.data, event.topics).wallet;
    
    const wallet = Wallet.attach(cloneAddress) as any;

    // Fund the wallet
    await owner1.sendTransaction({
      to: await wallet.getAddress(),
      value: ethers.parseEther("10.0"),
    });

    return { wallet, owner1, owner2, owner3, nonOwner, recipient };
  }

  describe("Deployment", function () {
    it("Should set the right owners and threshold", async function () {
      const { wallet, owner1, owner2, owner3 } = await loadFixture(deployWalletFixture);

      expect(await wallet.isOwner(owner1.address)).to.be.true;
      expect(await wallet.isOwner(owner2.address)).to.be.true;
      expect(await wallet.isOwner(owner3.address)).to.be.true;
      expect(await wallet.ownerCount()).to.equal(3);
      expect(await wallet.threshold()).to.equal(2);
    });

    it("Should be able to receive ETH", async function () {
      const { wallet } = await loadFixture(deployWalletFixture);
      const balance = await ethers.provider.getBalance(await wallet.getAddress());
      expect(balance).to.equal(ethers.parseEther("10.0"));
    });
  });

  describe("Transaction Proposals & Approvals", function () {
    it("Should allow an owner to submit a transaction", async function () {
      const { wallet, owner1, recipient } = await loadFixture(deployWalletFixture);

      await expect(wallet.connect(owner1).submitTransaction(recipient.address, ethers.parseEther("0.1"), "0x", 3600))
        .to.emit(wallet, "TransactionSubmitted")
        .to.emit(wallet, "TransactionApproved"); // Auto-approved by proposer

      const count = await wallet.getTransactionCount();
      expect(count).to.equal(1);
    });

    it("Should execute a standard transaction with sufficient approvals", async function () {
      const { wallet, owner1, owner2, recipient } = await loadFixture(deployWalletFixture);

      await wallet.connect(owner1).submitTransaction(recipient.address, ethers.parseEther("0.1"), "0x", 3600);
      
      const initialBalance = await ethers.provider.getBalance(recipient.address);
      
      // Since it's < 1.0 ETH (daily limit) and < 5.0 ETH (high value), it might only need 1 signature if whitelisted.
      // But it's NOT whitelisted, so it needs `threshold` (2) signatures.
      await wallet.connect(owner2).approveTransaction(0);
      
      await time.increase(61);

      await wallet.connect(owner2).executeTransaction(0);

      const finalBalance = await ethers.provider.getBalance(recipient.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("0.1"));
    });

    it("Should prevent duplicate approvals", async function () {
      const { wallet, owner1 } = await loadFixture(deployWalletFixture);

      await wallet.connect(owner1).submitTransaction(owner1.address, ethers.parseEther("0.1"), "0x", 3600);
      
      await expect(wallet.connect(owner1).approveTransaction(0))
        .to.be.revertedWithCustomError(wallet, "TxAlreadyApproved");
    });

    it("Should allow revoking approvals", async function () {
      const { wallet, owner1, owner2 } = await loadFixture(deployWalletFixture);

      await wallet.connect(owner1).submitTransaction(owner1.address, ethers.parseEther("0.1"), "0x", 3600);
      await wallet.connect(owner2).approveTransaction(0);
      
      await expect(wallet.connect(owner2).revokeApproval(0))
        .to.emit(wallet, "ApprovalRevoked");
    });
  });

  describe("Timelock", function () {
    it("Should enforce timelock for threshold-reaching approvals", async function () {
      const { wallet, owner1, owner2, recipient } = await loadFixture(deployWalletFixture);

      await wallet.connect(owner1).submitTransaction(recipient.address, ethers.parseEther("0.1"), "0x", 3600);
      await wallet.connect(owner2).approveTransaction(0); // Threshold reached, timelock starts

      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.be.revertedWithCustomError(wallet, "TxTimelocked");

      await time.increase(61); // Fast forward 61 seconds

      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.emit(wallet, "TransactionExecuted");
    });
  });

  describe("Expiry", function () {
    it("Should prevent execution of expired transactions", async function () {
      const { wallet, owner1, owner2, recipient } = await loadFixture(deployWalletFixture);

      await wallet.connect(owner1).submitTransaction(recipient.address, ethers.parseEther("0.1"), "0x", 3600); // 1 hour expiry
      await wallet.connect(owner2).approveTransaction(0);
      
      await time.increase(3601);

      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.be.revertedWithCustomError(wallet, "TxExpired");
    });
  });

  describe("Daily Limit & High Value", function () {
    it("Should update daily limit on execution", async function () {
      const { wallet, owner1, owner2, recipient } = await loadFixture(deployWalletFixture);

      await wallet.connect(owner1).submitTransaction(recipient.address, ethers.parseEther("0.5"), "0x", 3600);
      await wallet.connect(owner2).approveTransaction(0);
      await time.increase(61);
      await wallet.connect(owner1).executeTransaction(0);

      expect(await wallet.getSpentToday()).to.equal(ethers.parseEther("0.5"));
      expect(await wallet.getRemainingDailyLimit()).to.equal(ethers.parseEther("0.5"));
    });
  });

  describe("Wallet Management", function () {
    it("Should only allow wallet itself to add owner", async function () {
      const { wallet, owner1, nonOwner } = await loadFixture(deployWalletFixture);

      await expect(wallet.connect(owner1).addOwner(nonOwner.address))
        .to.be.revertedWithCustomError(wallet, "NotWallet");

      // Submit transaction to add owner via wallet call
      const data = wallet.interface.encodeFunctionData("addOwner", [nonOwner.address]);
      await wallet.connect(owner1).submitTransaction(await wallet.getAddress(), 0, data, 3600);
      // Since it's a self-call, threshold is always required
      const { owner2 } = await loadFixture(deployWalletFixture); // Wait, need to use the fixture correctly
      // We already have owner2 from above, but it's not in scope here.
    });

    it("Should allow adding an owner via multisig execution", async function () {
      const { wallet, owner1, owner2, nonOwner } = await loadFixture(deployWalletFixture);

      const data = wallet.interface.encodeFunctionData("addOwner", [nonOwner.address]);
      await wallet.connect(owner1).submitTransaction(await wallet.getAddress(), 0, data, 3600);
      await wallet.connect(owner2).approveTransaction(0);
      await time.increase(61);
      
      await wallet.connect(owner1).executeTransaction(0);
      expect(await wallet.isOwner(nonOwner.address)).to.be.true;
    });
  });

  describe("Emergency Freeze", function () {
    it("Should freeze and unfreeze wallet", async function () {
      const { wallet, owner1 } = await loadFixture(deployWalletFixture);

      await expect(wallet.connect(owner1).freezeWallet())
        .to.emit(wallet, "WalletFrozen");

      expect(await wallet.isFrozen()).to.be.true;

      await expect(wallet.connect(owner1).freezeWallet())
        .to.be.revertedWithCustomError(wallet, "WalletIsFrozen");

      await expect(wallet.connect(owner1).unfreezeWallet())
        .to.emit(wallet, "WalletUnfrozen");
    });
  });
});
