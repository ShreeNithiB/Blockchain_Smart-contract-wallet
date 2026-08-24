import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Configuration for deployment
  // In a real scenario, these might be read from a JSON file or env
  const owners = [deployer.address]; 
  const threshold = 1; 
  const dailyLimit = ethers.parseEther("0.5");
  const highValueThreshold = ethers.parseEther("1.0");
  const timelockDuration = 60; // 60 seconds

  const Wallet = await ethers.getContractFactory("ProgrammableMultiSigWallet");
  const wallet = await Wallet.deploy(
    owners,
    threshold,
    dailyLimit,
    highValueThreshold,
    timelockDuration
  );

  await wallet.waitForDeployment();

  const address = await wallet.getAddress();
  const txHash = wallet.deploymentTransaction()?.hash;

  console.log("=========================================");
  console.log("Contract deployed to:", address);
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  console.log("Deployment transaction hash:", txHash);
  console.log("Initial owners:", owners);
  console.log("Initial threshold:", threshold);
  console.log("=========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
