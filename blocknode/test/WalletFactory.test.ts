import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("WalletFactory and ProgrammableMultiSigWallet", function () {
  async function deployFactoryFixture() {
    const [deployer, userA, userB, userC] = await ethers.getSigners();

    const Wallet = await ethers.getContractFactory("ProgrammableMultiSigWallet");
    const impl = await Wallet.deploy();
    await impl.waitForDeployment();
    const implAddress = await impl.getAddress();

    const Factory = await ethers.getContractFactory("WalletFactory");
    const factory = await Factory.deploy(implAddress);
    await factory.waitForDeployment();

    return { factory, implAddress, deployer, userA, userB, userC };
  }

  describe("Deployment", function () {
    it("Should set the right implementation", async function () {
      const { factory, implAddress } = await loadFixture(deployFactoryFixture);
      expect(await factory.implementation()).to.equal(implAddress);
    });
  });

  describe("Wallet Creation", function () {
    it("Should deploy a clone, initialize it, and add to userWallets", async function () {
      const { factory, userA, userB } = await loadFixture(deployFactoryFixture);

      const owners = [userA.address, userB.address];
      const threshold = 2;
      const dailyLimit = ethers.parseEther("0.5");
      const highValueThreshold = ethers.parseEther("1.0");
      const timelockDuration = 60;

      const tx = await factory.connect(userA).createWallet(
        owners, threshold, dailyLimit, highValueThreshold, timelockDuration
      );
      await tx.wait();
      
      const wallets = await factory.getUserWallets(userA.address);
      expect(wallets.length).to.equal(1);

      const cloneAddress = wallets[0];
      
      const Wallet = await ethers.getContractFactory("ProgrammableMultiSigWallet");
      const clone = Wallet.attach(cloneAddress) as any;

      expect(await clone.ownerCount()).to.equal(2);
      expect(await clone.threshold()).to.equal(2);
      expect(await clone.dailyLimit()).to.equal(dailyLimit);
    });
    
    it("User isolation: User B does not see User A's wallet", async function () {
      const { factory, userA, userB } = await loadFixture(deployFactoryFixture);
      const dailyLimit = ethers.parseEther("0.5");
      
      await factory.connect(userA).createWallet([userA.address], 1, dailyLimit, dailyLimit, 60);
      
      const walletsA = await factory.getUserWallets(userA.address);
      const walletsB = await factory.getUserWallets(userB.address);
      
      expect(walletsA.length).to.equal(1);
      expect(walletsB.length).to.equal(0);
    });
    
    it("Cannot re-initialize a clone", async function () {
      const { factory, userA } = await loadFixture(deployFactoryFixture);
      
      await factory.connect(userA).createWallet([userA.address], 1, 0, 0, 0);
      const wallets = await factory.getUserWallets(userA.address);
      
      const Wallet = await ethers.getContractFactory("ProgrammableMultiSigWallet");
      const clone = Wallet.attach(wallets[0]) as any;
      
      await expect(
        clone.initialize([userA.address], 1, 0, 0, 0)
      ).to.be.revertedWithCustomError(clone, "InvalidInitialization");
    });
    
    it("Implementation contract itself cannot be initialized", async function () {
       const { implAddress, userA } = await loadFixture(deployFactoryFixture);
       const Wallet = await ethers.getContractFactory("ProgrammableMultiSigWallet");
       const impl = Wallet.attach(implAddress) as any;
       
       await expect(
         impl.initialize([userA.address], 1, 0, 0, 0)
       ).to.be.revertedWithCustomError(impl, "InvalidInitialization");
    });
  });
});
