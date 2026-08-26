import { ethers } from "ethers";
import type { ProgrammableMultiSigWallet } from "../../../blocknode/typechain-types";
import artifact from "../../../blocknode/artifacts/contracts/ProgrammableMultiSigWallet.sol/ProgrammableMultiSigWallet.json";

export type WalletOwner = { id: string; label: string; address: string; role: 'Signer'; status: 'Active'; added: string; approved: boolean }
export type WalletTransaction = { id: string; type: 'Send'; amount: string; recipient: string; approvals: number; threshold: number; status: 'Awaiting Approval' | 'Timelocked' | 'Executed' | 'Pending' | 'Cancelled'; date: string; hash?: string }

export type WalletService = {
  connectWallet: () => Promise<{ address: string; network: string; chainId: number; error?: string }>
  getUserWallets: (factoryAddress: string, userAddress: string) => Promise<string[]>
  getWalletBalance: (address?: string) => Promise<{ eth: string; usd: string }>
  getOwners: (contractAddress: string) => Promise<WalletOwner[]>
  getThreshold: (contractAddress: string) => Promise<number>
  getDailyLimit: (contractAddress: string) => Promise<string>
  getSpentToday: (contractAddress: string) => Promise<string>
  getRemainingDailyLimit: (contractAddress: string) => Promise<string>
  getHighValueThreshold: (contractAddress: string) => Promise<string>
  getTimelockDuration: (contractAddress: string) => Promise<string>
  isFrozen: (contractAddress: string) => Promise<boolean>
  getTransactionCount: (contractAddress: string) => Promise<number>
  getTransaction: (contractAddress: string, id: number) => Promise<WalletTransaction>
  getHistoryEvents: (contractAddress: string) => Promise<any[]>
  submitTransaction: (contractAddress: string, input: { recipient: string; amount: string; expiryDuration?: number }) => Promise<{ demo: boolean; message: string; hash?: string; error?: string }>
  approveTransaction: (contractAddress: string, id: number) => Promise<{ demo: boolean; message: string; hash?: string; error?: string }>
  revokeApproval: (contractAddress: string, id: number) => Promise<{ demo: boolean; message: string; hash?: string; error?: string }>
  executeTransaction: (contractAddress: string, id: number) => Promise<{ demo: boolean; message: string; hash?: string; error?: string }>
  deployWallet: (factoryAddress: string, owners: string[], threshold: number, dailyLimit: string, highValueThreshold: string, timelockDuration: number) => Promise<{ demo: boolean; address?: string; hash?: string; error?: string; message: string }>
}

const demoOwners: WalletOwner[] = [
  { id: '1', label: 'Owner 1', address: '0x71...A91', role: 'Signer', status: 'Active', added: 'Mar 12, 2024', approved: true },
  { id: '2', label: 'Owner 2', address: '0x92...C42', role: 'Signer', status: 'Active', added: 'Mar 12, 2024', approved: true },
  { id: '3', label: 'Owner 3', address: '0x31...F88', role: 'Signer', status: 'Active', added: 'Mar 12, 2024', approved: false },
]
const demoTransaction: WalletTransaction = { id: '#0042', type: 'Send', amount: '0.25 ETH', recipient: '0x83A2...91B2', approvals: 2, threshold: 3, status: 'Awaiting Approval', date: 'Today, 10:42 AM' }
const demoResponse = (message: string) => Promise.resolve({ demo: true, message })

// Environment variables
export const DEMO_MODE = false; // Forced Live Mode
export const SEPOLIA_CHAIN_ID = 11155111;

// Blockchain helpers
const getProvider = () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return null;
}

const getContract = async (contractAddress: string, providerOrSigner: ethers.Provider | ethers.Signer) => {
  if (!contractAddress) throw new Error("Contract address not provided");
  return new ethers.Contract(
    contractAddress,
    artifact.abi,
    providerOrSigner
  ) as unknown as ProgrammableMultiSigWallet;
}

const factoryAbi = [
  "function createWallet(address[] memory _owners, uint256 _threshold, uint256 _dailyLimit, uint256 _highValueThreshold, uint256 _timelockDuration) external returns (address)",
  "function getUserWallets(address user) external view returns (address[] memory)",
  "event WalletCreated(address indexed creator, address indexed wallet, address indexed implementation)"
];

const handleError = (e: any): string => {
  console.error(e);
  if (e.code === 'ACTION_REJECTED' || e.code === 4001) return 'User rejected transaction';
  if (e.message?.includes('insufficient funds')) return 'Insufficient ETH for gas/value';
  if (e.message?.includes('TxTimelocked')) return 'Transaction is timelocked';
  if (e.message?.includes('WalletIsFrozen')) return 'Wallet is currently frozen';
  if (e.message?.includes('TxExpired')) return 'Transaction has expired';
  if (e.message?.includes('InsufficientApprovals')) return 'Insufficient approvals';
  if (e.message?.includes('TxAlreadyApproved')) return 'You have already approved this transaction';
  if (e.message?.includes('NotOwner')) return 'Unauthorized: Not an owner';
  return e.shortMessage || e.message || 'An unknown blockchain error occurred';
}

export const walletService: WalletService = {
  connectWallet: async () => {
    if (DEMO_MODE) return { address: '0x7A...92F', network: 'Ethereum Sepolia', chainId: SEPOLIA_CHAIN_ID };
    
    const provider = getProvider();
    if (!provider) return { address: '', network: '', chainId: 0, error: 'MetaMask not installed' };
    
    try {
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      return { 
        address: await signer.getAddress(), 
        network: network.name, 
        chainId: Number(network.chainId)
      };
    } catch (e: any) {
      return { address: '', network: '', chainId: 0, error: handleError(e) };
    }
  },

  getUserWallets: async (factoryAddress: string, userAddress: string) => {
    if (DEMO_MODE) return ['0x1111111111111111111111111111111111111111'];
    const provider = getProvider();
    if (!provider || !factoryAddress || !userAddress) return [];
    try {
      const contract = new ethers.Contract(factoryAddress, factoryAbi, provider);
      const wallets = await contract.getUserWallets(userAddress);
      return Array.from(wallets) as string[];
    } catch (e) {
      console.error("Error fetching user wallets:", e);
      return [];
    }
  },

  getWalletBalance: async (address?: string) => {
    if (DEMO_MODE) return { eth: '2.348', usd: '$5,842.16' };
    
    const provider = getProvider();
    if (!provider || !address) return { eth: '0', usd: '$0' };
    
    try {
      const balance = await provider.getBalance(address);
      const eth = ethers.formatEther(balance);
      return { eth: parseFloat(eth).toFixed(4), usd: 'N/A' };
    } catch (e) {
      return { eth: '0', usd: '$0' };
    }
  },

  getOwners: async (contractAddress: string) => {
    if (DEMO_MODE) return demoOwners;

    const provider = getProvider();
    if (!provider || !contractAddress) return [];

    try {
      const contract = await getContract(contractAddress, provider);
      const ownerCount = Number(await contract.ownerCount());
      const owners: WalletOwner[] = [];
      
      for (let i = 0; i < ownerCount; i++) {
        const address = await contract.owners(i);
        owners.push({
          id: i.toString(),
          label: `Owner ${i + 1}`,
          address,
          role: 'Signer',
          status: 'Active',
          added: 'Unknown',
          approved: true
        });
      }
      return owners;
    } catch (e) {
      console.error("Error fetching owners:", e);
      return [];
    }
  },

  getThreshold: async (contractAddress: string) => {
    if (DEMO_MODE) return 2;
    const provider = getProvider();
    if (!provider || !contractAddress) return 1;
    try {
      const contract = await getContract(contractAddress, provider);
      return Number(await contract.threshold());
    } catch (e) { return 1; }
  },

  getDailyLimit: async (contractAddress: string) => {
    if (DEMO_MODE) return '0.5';
    const provider = getProvider();
    if (!provider || !contractAddress) return '0';
    try {
      const contract = await getContract(contractAddress, provider);
      return ethers.formatEther(await contract.getDailyLimit());
    } catch (e) { return '0'; }
  },

  getSpentToday: async (contractAddress: string) => {
    if (DEMO_MODE) return '0.1';
    const provider = getProvider();
    if (!provider || !contractAddress) return '0';
    try {
      const contract = await getContract(contractAddress, provider);
      return ethers.formatEther(await contract.getSpentToday());
    } catch (e) { return '0'; }
  },

  getRemainingDailyLimit: async (contractAddress: string) => {
    if (DEMO_MODE) return '0.4';
    const provider = getProvider();
    if (!provider || !contractAddress) return '0';
    try {
      const contract = await getContract(contractAddress, provider);
      return ethers.formatEther(await contract.getRemainingDailyLimit());
    } catch (e) { return '0'; }
  },

  getHighValueThreshold: async (contractAddress: string) => {
    if (DEMO_MODE) return '1.0';
    const provider = getProvider();
    if (!provider || !contractAddress) return '0';
    try {
      const contract = await getContract(contractAddress, provider);
      return ethers.formatEther(await contract.highValueThreshold());
    } catch (e) { return '0'; }
  },

  getTimelockDuration: async (contractAddress: string) => {
    if (DEMO_MODE) return '60';
    const provider = getProvider();
    if (!provider || !contractAddress) return '0';
    try {
      const contract = await getContract(contractAddress, provider);
      return (await contract.timelockDuration()).toString();
    } catch (e) { return '0'; }
  },

  isFrozen: async (contractAddress: string) => {
    if (DEMO_MODE) return false;
    const provider = getProvider();
    if (!provider || !contractAddress) return false;
    try {
      const contract = await getContract(contractAddress, provider);
      return await contract.isFrozen();
    } catch (e) { return false; }
  },

  getTransactionCount: async (contractAddress: string) => {
    if (DEMO_MODE) return 1;
    const provider = getProvider();
    if (!provider || !contractAddress) return 0;
    try {
      const contract = await getContract(contractAddress, provider);
      return Number(await contract.getTransactionCount());
    } catch (e) { return 0; }
  },

  getTransaction: async (contractAddress: string, id: number) => {
    if (DEMO_MODE) return demoTransaction;
    const provider = getProvider();
    if (!provider || !contractAddress) throw new Error("Not configured");
    const contract = await getContract(contractAddress, provider);
    const tx = await contract.transactions(id);
    const threshold = Number(await contract.threshold());
    
    let status: WalletTransaction['status'] = 'Pending';
    if (tx.executed) status = 'Executed';
    else if (tx.cancelled) status = 'Cancelled';
    else if (tx.executableAt > 0n) {
      if (Date.now() / 1000 >= Number(tx.executableAt)) status = 'Pending'; // ready to execute
      else status = 'Timelocked';
    } else if (Number(tx.approvalCount) < threshold) {
      status = 'Awaiting Approval';
    }

    return {
      id: `#${id}`,
      type: 'Send',
      amount: ethers.formatEther(tx.value) + ' ETH',
      recipient: tx.destination,
      approvals: Number(tx.approvalCount),
      threshold,
      status,
      date: new Date(Number(tx.timestamp) * 1000).toLocaleString(),
    };
  },

  getHistoryEvents: async (contractAddress: string) => {
    if (DEMO_MODE) return [];
    const provider = getProvider();
    if (!provider || !contractAddress) return [];
    try {
      const contract = await getContract(contractAddress, provider);
      const events = await contract.queryFilter('*', -5000); // Last 5000 blocks to avoid RPC limit
      return events.map((e: any) => ({ name: 'fragment' in e ? e.fragment.name : 'Unknown', transactionHash: e.transactionHash, blockNumber: e.blockNumber }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  submitTransaction: async (contractAddress, input) => {
    if (DEMO_MODE) return demoResponse('Demo only: transaction payload prepared, not broadcast.');
    try {
      const provider = getProvider();
      if (!provider) throw new Error("No web3 provider");
      const signer = await provider.getSigner();
      const contract = await getContract(contractAddress, signer);
      
      const value = ethers.parseEther(input.amount);
      const expiryDuration = input.expiryDuration || 86400; // 1 day default

      const tx = await contract.submitTransaction(input.recipient, value, "0x", expiryDuration);
      await tx.wait();
      
      return { demo: false, message: 'Transaction submitted successfully!', hash: tx.hash };
    } catch (e: any) {
      return { demo: false, message: '', error: handleError(e) };
    }
  },

  approveTransaction: async (contractAddress, id) => {
    if (DEMO_MODE) return demoResponse('Demo only: approval signature flow opened, not submitted.');
    try {
      const provider = getProvider();
      if (!provider) throw new Error("No web3 provider");
      const signer = await provider.getSigner();
      const contract = await getContract(contractAddress, signer);
      
      const tx = await contract.approveTransaction(id);
      await tx.wait();
      
      return { demo: false, message: 'Transaction approved!', hash: tx.hash };
    } catch (e: any) {
      return { demo: false, message: '', error: handleError(e) };
    }
  },

  revokeApproval: async (contractAddress, id) => {
    if (DEMO_MODE) return demoResponse('Demo only: revoke payload prepared, not broadcast.');
    try {
      const provider = getProvider();
      if (!provider) throw new Error("No web3 provider");
      const signer = await provider.getSigner();
      const contract = await getContract(contractAddress, signer);
      
      const tx = await contract.revokeApproval(id);
      await tx.wait();
      
      return { demo: false, message: 'Approval revoked!', hash: tx.hash };
    } catch (e: any) {
      return { demo: false, message: '', error: handleError(e) };
    }
  },

  executeTransaction: async (contractAddress, id) => {
    if (DEMO_MODE) return demoResponse('Demo only: execution payload prepared, not broadcast.');
    try {
      const provider = getProvider();
      if (!provider) throw new Error("No web3 provider");
      const signer = await provider.getSigner();
      const contract = await getContract(contractAddress, signer);
      
      const tx = await contract.executeTransaction(id);
      await tx.wait();
      
      return { demo: false, message: 'Transaction executed successfully!', hash: tx.hash };
    } catch (e: any) {
      return { demo: false, message: '', error: handleError(e) };
    }
  },

  deployWallet: async (factoryAddress, owners, threshold, dailyLimit, highValueThreshold, timelockDuration) => {
    if (DEMO_MODE) return demoResponse('Demo only: Wallet deployment simulated.');
    if (!factoryAddress || factoryAddress.trim() === '') {
      return { demo: false, message: '', error: 'WalletFactory address is missing! Please deploy the Factory and set NEXT_PUBLIC_FACTORY_ADDRESS in frontend/.env' };
    }
    try {
      const provider = getProvider();
      if (!provider) throw new Error("No web3 provider");
      const signer = await provider.getSigner();
      
      const factory = new ethers.Contract(factoryAddress, factoryAbi, signer);
      
      const tx = await factory.createWallet(
        owners,
        threshold,
        ethers.parseEther(dailyLimit),
        ethers.parseEther(highValueThreshold),
        timelockDuration
      );
      
      const receipt = await tx.wait();
      
      // Parse WalletCreated event to get the new wallet address
      let newAddress = '';
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsed?.name === 'WalletCreated') {
            newAddress = parsed.args.wallet;
            break;
          }
        } catch(e) {}
      }
      
      return { demo: false, message: 'Wallet deployed successfully!', address: newAddress, hash: tx.hash };
    } catch (e: any) {
      return { demo: false, message: '', error: handleError(e) };
    }
  }
}

export const DEMO_MODE_NOTICE = DEMO_MODE 
  ? 'Demo mode · blockchain actions are simulated for UI development.'
  : 'Live mode · Connected to Sepolia Testnet.';

export { demoOwners, demoTransaction }
