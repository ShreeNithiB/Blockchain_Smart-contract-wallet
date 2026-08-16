# Nexus Wallet - Phase 3

Nexus Wallet is a Web3 multi-signature smart contract wallet, featuring dynamic owners, threshold voting, timelocks, daily limits, high-value transaction whitelisting, and an emergency freeze mode.

## Features
- **Programmable Multi-Signature Backend**: Solidity `0.8.x` smart contract backend on Sepolia.
- **Frontend Dashboard**: Built with Next.js App Router and React.
- **Web3 Integration**: Native support for MetaMask and `ethers.js`.
- **Demo Mode vs Real Mode**: UI toggle for simulated or real Sepolia contract interactions.

## Quick Start
1. `pnpm install`
2. Create `.env` based on `.env.example`.
3. Set `NEXT_PUBLIC_USE_DEMO_MODE=true` to view the UI in demo mode.
4. Set `NEXT_PUBLIC_USE_DEMO_MODE=false` to use MetaMask and connect to real Ethereum Sepolia networks.
5. `pnpm dev` to start.

## Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Sepolia Integration](docs/SEPOLIA.md)
