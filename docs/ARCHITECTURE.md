# Architecture

Nexus Wallet operates on a straightforward two-tier architecture:

## 1. Smart Contract Tier
`contracts/ProgrammableMultiSigWallet.sol`
- **Language**: Solidity `0.8.20`
- **Dependencies**: OpenZeppelin (`ReentrancyGuard`)
- **Key Concepts**:
  - `owners` array maps signers.
  - Transactions require an `approvalCount` $\geq$ `threshold`.
  - Limits (`dailyLimit`, `highValueThreshold`) dictate required logic.
  - Transactions are `timelocked` when thresholds are reached.
  
## 2. Frontend Application Tier
`app/page.tsx`
- **Framework**: Next.js App Router
- **Styling**: Pure CSS (`index.css`)
- **Web3 Layer**: `ethers.js` via `lib/services/wallet.ts`
- **State Management**: React Hooks (`useState`, `useEffect`) fetch async data from the contract through `ethers.Provider` and `ethers.Signer`.

## 3. Communication
- User signs payloads via MetaMask injected `window.ethereum`.
- `ethers.js` bridges the frontend and the smart contract via RPC (`https://rpc.sepolia.org`).
