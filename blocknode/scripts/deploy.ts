import { ethers, network } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("❌ No deployer account found! You MUST paste your MetaMask Private Key into blocknode/.env under DEPLOYER_PRIVATE_KEY to deploy.");
  }
  const deployer = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Implementation
  console.log("Deploying ProgrammableMultiSigWallet implementation...");
  const Wallet = await ethers.getContractFactory("ProgrammableMultiSigWallet");
  const walletImpl = await Wallet.deploy();
  await walletImpl.waitForDeployment();
  const implAddress = await walletImpl.getAddress();
  console.log("Implementation deployed to:", implAddress);

  // 2. Deploy Factory
  console.log("Deploying WalletFactory...");
  const Factory = await ethers.getContractFactory("WalletFactory");
  const factory = await Factory.deploy(implAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("WalletFactory deployed to:", factoryAddress);

  console.log("=========================================");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  console.log("Implementation Address:", implAddress);
  console.log("Factory Address:", factoryAddress);
  console.log("=========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
