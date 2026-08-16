NEXUS WALLET -A blockchain smart contrcat wallet


````markdown
# ⚡ NEXUS WALLET

### Programmable Multi-Signature Smart Contract Wallet

Nexus Wallet is a programmable Web3 smart contract wallet built on Ethereum. It combines **multi-signature authorization** with programmable security policies such as spending limits, timelocks, high-value transaction protection, recipient whitelisting, and emergency freezing.

Unlike a traditional Externally Owned Account (EOA), where a single private key controls the wallet, Nexus uses a **Solidity smart contract** to enforce authorization rules directly on-chain.

---

## 🚀 Overview

Traditional Ethereum wallets rely on a single private key:

```text
Private Key
     ↓
EOA Address
     ↓
Full Wallet Control
````

Nexus Wallet uses multiple owners and a configurable approval threshold:

```text
Owner 1 ──────┐
              │
Owner 2 ──────┼──→ NEXUS Smart Contract Wallet
              │           │
Owner 3 ──────┘           ↓
                       2-of-3
                    Approval Required
```

For example, with 3 owners and a threshold of 2, any transaction requires approval from at least 2 authorized owners before execution.

---

## ✨ Features

### 🔐 Multi-Signature Authorization

Supports configurable owner thresholds such as:

* 1-of-1
* 2-of-3
* 3-of-5
* 4-of-7

Transactions cannot be executed until the required approval threshold is reached.

### 👥 Dynamic Owners

Owners can be configured during wallet creation.

The contract validates:

* Valid Ethereum addresses
* No zero addresses
* No duplicate owners
* Valid approval thresholds

### 💰 Daily Spending Limits

Configurable spending limits can be used to control lower-value transactions and reduce unnecessary authorization overhead.

### 🛡️ High-Value Transaction Protection

Transactions exceeding configured value thresholds are subject to stricter authorization rules.

### ⏳ Timelocks

Sensitive transactions can be delayed for a configurable period before execution, providing owners with additional time to review suspicious activity.

### 🚨 Emergency Freeze

Owners can activate an emergency freeze to halt wallet activity when suspicious behavior or a potential compromise is detected.

### ✅ Recipient Whitelisting

Transactions can be restricted to approved recipient addresses.

### 📊 Transaction Approval Tracking

The dashboard provides a visual representation of:

* Pending transactions
* Required approvals
* Current approval count
* Approval timeline
* Transaction status

### 🦊 MetaMask Integration

MetaMask is used for:

* Connecting user accounts
* Signing transactions
* Deploying the wallet
* Approving multisig transactions
* Executing authorized transactions

Private keys remain inside MetaMask and are never stored by the application.

---

# 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │     NEXUS WALLET     │
                    │      Frontend        │
                    │                      │
                    │ Next.js + React + TS │
                    └──────────┬───────────┘
                               │
                               │ ethers.js
                               ▼
                    ┌──────────────────────┐
                    │       MetaMask       │
                    │                      │
                    │ Transaction Signing │
                    └──────────┬───────────┘
                               │
                               │ Signed Transaction
                               ▼
              ┌─────────────────────────────────┐
              │       Ethereum Sepolia          │
              │                                 │
              │  ProgrammableMultiSigWallet    │
              │                                 │
              │  ┌───────────────────────────┐  │
              │  │ Multi-Signature           │  │
              │  │ Owners & Thresholds       │  │
              │  │ Spending Limits           │  │
              │  │ High-Value Protection     │  │
              │  │ Timelocks                  │  │
              │  │ Emergency Freeze           │  │
              │  │ Recipient Whitelist        │  │
              │  └───────────────────────────┘  │
              └─────────────────────────────────┘
```

---

# 🔄 Transaction Flow

```text
User
 │
 ▼
Connect MetaMask
 │
 ▼
Create Transaction
 │
 ▼
Smart Contract Proposal
 │
 ▼
Owner 1 Approves
 │
 ▼
Owner 2 Approves
 │
 ▼
Approval Threshold Reached
 │
 ▼
Security Rules Checked
 │
 ├── Timelock
 ├── Spending Limit
 ├── High-Value Protection
 ├── Recipient Validation
 └── Emergency Freeze
 │
 ▼
Transaction Executed
 │
 ▼
Ethereum Blockchain Updated
```

---

# 🔑 Ownership Model

Nexus Wallet does not store private keys.

The user's MetaMask wallet contains the private key.

```text
                 MetaMask
                    │
             Private Key 🔐
             stays in wallet
                    │
                    ▼
              Public Address
                 0xABC...
                    │
                    │ Registered as Owner
                    ▼
          NEXUS Smart Contract
                 0xDEF...
```

The public Ethereum address is stored as an owner inside the smart contract.

When the owner performs an action, MetaMask signs the transaction and the blockchain verifies that the signature belongs to the registered owner.

**Private keys are never stored in the frontend or smart contract.**

---

# 🧠 Smart Contract

Core contract:

```text
contracts/ProgrammableMultiSigWallet.sol
```

The smart contract is responsible for enforcing the wallet's security rules.

### Core responsibilities

* Owner management
* Signature threshold management
* Transaction proposals
* Transaction approvals
* Transaction execution
* Spending limits
* High-value transaction protection
* Timelocks
* Recipient whitelisting
* Emergency freeze
* Event logging

The frontend provides the user interface, but **the Solidity smart contract is the final authority for security and authorization.**

---

# 🛠️ Technology Stack

### Blockchain

* Solidity `^0.8.20`
* Ethereum Sepolia
* Hardhat
* OpenZeppelin
* ethers.js v6

### Frontend

* Next.js
* React
* TypeScript
* ethers.js
* MetaMask
* Vanilla CSS

### Development

* Hardhat
* TypeScript
* Git
* GitHub

---

# 📁 Project Structure

```text
nexus-wallet/
│
├── app/
│   ├── page.tsx
│   └── ...
│
├── contracts/
│   └── ProgrammableMultiSigWallet.sol
│
├── lib/
│   └── services/
│       └── wallet.ts
│
├── scripts/
│   └── deploy.ts
│
├── test/
│   └── ProgrammableMultiSigWallet.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── SEPOLIA.md
│
├── hardhat.config.ts
├── package.json
├── .env.example
└── README.md
```

---

# ⚙️ Installation

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd nexus-wallet
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
NEXT_PUBLIC_USE_DEMO_MODE=false
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_WALLET_CONTRACT_ADDRESS=

SEPOLIA_RPC_URL=https://rpc.sepolia.org
DEPLOYER_PRIVATE_KEY=
ETHERSCAN_API_KEY=
```

> ⚠️ Never commit `.env` or expose private keys in the repository.

---

# ▶️ Run the Application

Start the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

---

# 🧪 Smart Contract Testing

Compile the contract:

```bash
npx hardhat compile
```

Run tests:

```bash
npx hardhat test
```

The test suite covers important security scenarios including:

* Owner validation
* Duplicate owner prevention
* Zero-address prevention
* Threshold validation
* Transaction submission
* Transaction approval
* Duplicate approval prevention
* Multisig execution
* Timelock enforcement
* High-value transaction protection
* Emergency freeze
* Recipient restrictions

---

# 🌐 Sepolia Deployment

Nexus Wallet is designed for deployment on:

```text
Network: Ethereum Sepolia
Chain ID: 11155111
```

### MetaMask Deployment

The recommended deployment flow is:

```text
Connect MetaMask
       ↓
Select Sepolia
       ↓
Configure Owners
       ↓
Set Approval Threshold
       ↓
Validate Configuration
       ↓
Deploy Wallet
       ↓
MetaMask Confirmation
       ↓
Smart Contract Deployed
```

The frontend uses:

```text
ethers.BrowserProvider
        ↓
provider.getSigner()
        ↓
ethers.ContractFactory
        ↓
MetaMask
```

`ethers.ContractFactory` is a JavaScript deployment helper. It is **not a separate factory smart contract**.

---

# 🔐 Security

Nexus Wallet follows a defense-in-depth security model.

### Private Key Protection

Private keys are never stored in:

* React code
* Next.js frontend
* Solidity contracts
* GitHub
* Public environment variables

### Smart Contract Security

Security rules are enforced on-chain rather than relying only on frontend validation.

### Important

This project is currently intended for **educational, testing, and demonstration purposes**.

It has not undergone a professional smart-contract security audit and should not be used to protect real-world funds without a thorough audit.

---

# 🎨 UI/UX

Nexus Wallet provides a premium Web3 interface featuring:

* Dark Web3 aesthetic
* Glassmorphism
* Animated blockchain particles
* Responsive dashboard
* Desktop sidebar
* Mobile navigation
* Wallet balance
* Transaction dashboard
* Multisig approval timeline
* Owner management
* Security controls
* Wallet deployment wizard
* Reduced-motion accessibility support

---

# 📈 Development Progress

### Phase 1 — Frontend

* [x] Premium Web3 dashboard
* [x] Responsive UI
* [x] Wallet dashboard
* [x] Send / Receive interface
* [x] Transaction interface
* [x] Approval timeline
* [x] Deployment wizard
* [x] Animated background

### Phase 2 — Smart Contract

* [x] Programmable multisig
* [x] Dynamic owners
* [x] Configurable threshold
* [x] Daily spending limits
* [x] High-value protection
* [x] Timelocks
* [x] Emergency freeze
* [x] Recipient whitelist
* [x] Hardhat test suite

### Phase 3 — Web3 Integration

* [x] ethers.js integration
* [x] MetaMask integration
* [x] Sepolia configuration
* [x] Wallet deployment flow
* [x] Blockchain state reading
* [x] Transaction interaction

### Phase 4 — Testnet Validation

* [ ] Deploy to Sepolia
* [ ] Verify contract
* [ ] Fund wallet
* [ ] Submit transaction
* [ ] Test multisig approval
* [ ] Execute transaction
* [ ] Test timelock
* [ ] Test spending limits
* [ ] Test emergency freeze

### Future Enhancements

* [ ] Safe SDK integration
* [ ] WalletConnect
* [ ] ERC-20 support
* [ ] NFT support
* [ ] Account Abstraction / ERC-4337
* [ ] Hardware wallet support
* [ ] Social recovery
* [ ] Batch transactions
* [ ] Advanced analytics
* [ ] Transaction simulation
* [ ] ENS integration

---

# 📌 Future Vision

Nexus Wallet aims to evolve from a programmable multisignature wallet into a complete Web3 treasury and asset-management platform.

Potential applications include:

* DAO treasury management
* Organization funds
* Startup treasury
* Development team wallets
* Shared digital asset management
* Community-managed funds

---

# ⚠️ Disclaimer

Nexus Wallet is an educational and experimental blockchain project.

The current version is intended for Ethereum Sepolia testnet usage and development purposes.

Do not use the system to store real funds without professional security auditing and appropriate production-grade key management.

---

# 👩‍💻 Author

**Shree Nithi**

### Nexus Wallet

Programmable Multi-Signature Smart Contract Wallet

---

## ⭐ Project Highlights

```text
🔐 Programmable Security
👥 Multi-Signature Authorization
⏳ Timelocked Transactions
💰 Spending Controls
🚨 Emergency Freeze
✅ Recipient Whitelisting
🦊 MetaMask Integration
⛓️ Ethereum Sepolia
⚡ Next.js + Solidity
```

If you find this project useful, consider giving the repository a ⭐.

````

### One thing to change before pushing

Replace:

```text
<YOUR_REPOSITORY_URL>
````

with your actual GitHub repository URL.

And **after you successfully deploy to Sepolia**, add a small section such as:

```markdown
# 🌐 Live Testnet Deployment

Network: Ethereum Sepolia

Contract Address: `0x...`

Deployment Transaction: `0x...`
```

