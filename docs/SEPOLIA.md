# Sepolia Integration Guide

The Nexus Wallet frontend is fully integrated with the Ethereum Sepolia Testnet.

## Real vs Demo Mode
The application uses the `NEXT_PUBLIC_USE_DEMO_MODE` environment variable:
- `true`: Loads static mock data, no MetaMask required. Used for UI development.
- `false`: Connects directly to the blockchain via MetaMask.

## Multisig Workflow on Sepolia
1. **Connect EOA**: Connect MetaMask on Sepolia.
2. **Submit**: Create a new transaction to a destination. The `submitTransaction` function is executed on the smart contract. Wait for confirmation.
3. **Approve**: Other owners connect and click "Approve". Wait for confirmation.
4. **Timelock**: Once the threshold is met, the timelock begins. 
5. **Execute**: Any owner executes the transaction via `executeTransaction`. The smart contract dispatches the value to the recipient.

## Event Tracking
Transaction history is populated via `ethers.js` `queryFilter` against the contract logs. Events like `TransactionSubmitted`, `TransactionApproved`, and `TransactionExecuted` are decoded and mapped to the History panel.
