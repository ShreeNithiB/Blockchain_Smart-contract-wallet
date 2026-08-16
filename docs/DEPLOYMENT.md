# Deployment Guide

To deploy the Nexus Wallet smart contract to Ethereum Sepolia, follow these steps.

## Prerequisites
1. Ensure your `.env` contains:
   ```
   SEPOLIA_RPC_URL=https://rpc.sepolia.org
   DEPLOYER_PRIVATE_KEY=your_private_key
   ETHERSCAN_API_KEY=your_etherscan_key_optional
   ```
2. You must have Sepolia test ETH in the `DEPLOYER_PRIVATE_KEY` wallet.

## Hardhat Deployment
Run the Hardhat deploy script:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

This will deploy the `ProgrammableMultiSigWallet.sol` using default parameters defined in the script. The console will output:
- Contract Address
- Deployment Transaction Hash
- Network details

## In-App Deployment (Wallet Wizard)
You can also deploy a new smart contract directly from the Web UI:
1. Connect MetaMask to Ethereum Sepolia.
2. Click the "Launch deployment wizard" button in the sidebar.
3. Configure your owners and threshold.
4. Sign the contract deployment transaction in MetaMask.
5. The UI will wait for confirmation and automatically load your new wallet address.
