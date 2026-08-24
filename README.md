# Nexus Wallet

Nexus Wallet is a next-generation programmable multisig smart contract wallet built on Ethereum. It provides a highly secure, non-custodial, and user-friendly interface for managing shared funds, executing transactions, and enforcing programmable security policies.

## Features

- **Multi-Signature Access Control:** Require M-of-N signatures to execute standard transactions, ensuring no single point of failure.
- **Programmable Security Policies:**
  - **Daily Spending Limits:** Automatically approve smaller transactions up to a predefined limit without requiring full consensus.
  - **High-Value Thresholds & Timelocks:** Enforce mandatory waiting periods (timelocks) for large transactions, giving owners time to review or cancel suspicious activity.
  - **Emergency Freeze:** (Upcoming) Instantly halt all non-essential contract operations in case of a security breach.
- **Modern User Interface:** Built with Next.js, React, and Tailwind CSS, providing a sleek, responsive, and intuitive dashboard.
- **Sepolia Testnet Support:** Fully configured for deployment and testing on the Ethereum Sepolia network.

## Architecture

This project is structured as a `pnpm` monorepo containing two main workspaces:

- `frontend/`: The Next.js web application and UI.
- `blocknode/`: The Hardhat environment containing the Solidity smart contracts and deployment scripts.

## Prerequisites

- Node.js (v18+)
- `pnpm` package manager
- MetaMask (or another injected web3 wallet)

## Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Setup**
   Ensure you have a `.env` file in both `frontend/` and `blocknode/` directories with your configuration.
   
   Example:
   ```env
   NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org
   NEXT_PUBLIC_CHAIN_ID=11155111
   NEXT_PUBLIC_USE_DEMO_MODE=false
   
   # After deployment, add:
   NEXT_PUBLIC_WALLET_CONTRACT_ADDRESS=0xYourContractAddress...
   ```

3. **Start the Development Server**
   From the root directory, run:
   ```bash
   pnpm run dev
   ```
   This will start the Next.js frontend at `http://localhost:3000`.

4. **Deploy a Wallet**
   - Connect your MetaMask to the Sepolia Testnet.
   - Click the "Deploy Wizard" button in the dashboard.
   - Follow the steps to configure your owners, signature threshold, and daily limits.
   - Confirm the deployment transaction.
   - Copy the generated contract address into your `.env` file under `NEXT_PUBLIC_WALLET_CONTRACT_ADDRESS` and restart your server.

## Smart Contract Details

The core logic is implemented in `ProgrammableMultiSigWallet.sol`, which leverages advanced Solidity patterns to provide a secure and gas-efficient wallet solution. 

To manually compile contracts, run:
```bash
pnpm --filter nexus-blocknode run compile
```

## License

This project is licensed under the MIT License.
