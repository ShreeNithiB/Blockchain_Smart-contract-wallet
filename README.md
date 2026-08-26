# Smart Contract Wallet [Wallentra]

## Overview
Nexus is a production-ready, highly programmable Smart Contract Wallet designed to provide a secure and flexible multi-signature experience. It enables users to deploy their own personal smart contract wallets directly from a seamless web interface. The project uses an advanced Factory + Proxy architecture (EIP-1167) to ensure gas-efficient deployments for every user.

## Features
- **Multi-Signature Approvals:** Configure custom thresholds (M of N owners).
- **Time-Locks & Expiry:** Ensure delayed execution for high-security transactions and automatic expiration of stale proposals.
- **Daily Limits:** Pre-approved spending limits to allow rapid small transactions without full consensus.
- **Dynamic User Wallets:** A global Factory contract manages and registers all user wallets automatically.
- **Emergency Freeze:** Owners can freeze the wallet to prevent malicious activity in case of a compromise.
- **Modern Next.js Frontend:** A glassmorphism, fully responsive dashboard and deployment wizard.

## Architecture
The application is split into two perfectly isolated responsibilities:
```text
Frontend (Next.js / ethers.js)
   ↓
WalletFactory (Sepolia)
   ↓
ProgrammableMultiSigWallet Proxy (User's Wallet)
   ↓
Blockchain
```

### Factory Pattern
To minimize gas costs, a single `ProgrammableMultiSigWallet` logic contract is deployed once. When a user creates a wallet, the `WalletFactory` deploys a lightweight EIP-1167 Minimal Proxy pointing to the logic contract. The Factory maps user addresses to their newly created proxies, allowing the frontend to dynamically discover any user's wallets upon connection.

## Tech Stack
- **Smart Contracts:** Solidity 0.8.20, Hardhat, OpenZeppelin
- **Frontend:** Next.js 14, React, TailwindCSS, ethers.js v6
- **Network:** Ethereum Sepolia Testnet

## Project Structure
```text
nexus-wallet/
├── blocknode/       # All blockchain code (Contracts, Tests, Scripts, Hardhat config)
├── frontend/        # Next.js Application
├── .gitignore
├── .env.example
└── README.md
```

## Prerequisites
- Node.js (v18+)
- pnpm or npm
- MetaMask Extension (configured for Sepolia testnet)
- Test Sepolia ETH

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ShreeNithiB/Blockchain_Smart-contract-wallet.git
   cd Blockchain_Smart-contract-wallet
   ```

2. **Install Root Dependencies**
   ```bash
   npm install
   ```

3. **Install Blockchain & Frontend Dependencies**
   ```bash
   cd blocknode && npm install
   cd ../frontend && npm install
   cd ..
   ```

## Environment Variables
Security is paramount. Never commit `.env` files or private keys.

1. Copy `.env.example` to create your active `.env` file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and fill in your actual private key and RPC URLs.
3. The `.env` file covers both the frontend configuration (`NEXT_PUBLIC_*`) and the blocknode deployment configuration.

## Smart Contract Deployment

To deploy the Master Factory to the Sepolia testnet:

1. Ensure `DEPLOYER_PRIVATE_KEY` has Sepolia ETH in your `.env`.
2. Run the deployment script from the `blocknode` directory:
   ```bash
   cd blocknode
   npx hardhat compile
   npx hardhat run scripts/deploy.ts --network sepolia
   ```
3. The terminal will print a **Factory Address**. Copy this address.

## Frontend Setup

1. Open your `.env` file at the root of the project (or inside `frontend/.env` depending on your setup).
2. Paste the Factory Address:
   ```env
   NEXT_PUBLIC_FACTORY_ADDRESS=0xYourFactoryAddressHere
   ```
3. Start the Next.js development server:
   ```bash
   cd frontend
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

## Testing
Comprehensive unit tests cover the Factory and Wallet logic. To run them:
```bash
cd blocknode
npx hardhat test
```

## Build
To build the frontend for production deployment (e.g. Vercel):
```bash
cd frontend
npm run build
```

## Security Notice
🚨 **CRITICAL:** Private keys, seed phrases, wallet passwords, and environment secrets must NEVER be committed to GitHub. This repository is configured with a strict `.gitignore` to prevent `.env` files from being committed, but always double-check your commits before pushing.

## License
MIT License
