'use client'

import { useEffect, useState, useMemo } from 'react'
import { ArrowDownLeft, ArrowUpRight, Bell, Check, ChevronRight, CircleHelp, Copy, ExternalLink, Fingerprint, Gauge, GitBranch, KeyRound, LayoutDashboard, LockKeyhole, Menu, MoreHorizontal, Network, Plus, QrCode, ReceiptText, Send, Settings, ShieldCheck, Sparkles, Users, WalletCards, X, Loader2, Search, Filter, LogOut, ChevronDown } from 'lucide-react'
import { DEMO_MODE, DEMO_MODE_NOTICE, walletService, type WalletOwner, type WalletTransaction, SEPOLIA_CHAIN_ID } from '@/lib/services/wallet'
import { ethers } from 'ethers'

const nav = [
  ['Dashboard', LayoutDashboard], 
  ['Wallet', WalletCards], 
  ['Send', Send], 
  ['Receive', ArrowDownLeft], 
  ['Transactions', ReceiptText], 
  ['Owners', Users]
] as const

function Logo() { return <div className="flex items-center gap-3"><div className="logo-mark"><GitBranch size={18} /></div><div><div className="text-sm font-semibold tracking-[0.22em] text-foreground">NEXUS</div><div className="text-[9px] font-medium tracking-[0.28em] text-muted-foreground">WALLET</div></div></div> }
function NetworkStatus({ chainId }: { chainId: number | null }) { 
  if (chainId === null) return null;
  const isSepolia = chainId === SEPOLIA_CHAIN_ID || DEMO_MODE;
  return (
    <div className={`network-pill ${!isSepolia ? 'bg-destructive/20 text-destructive' : ''}`}>
      <span className={`status-dot ${!isSepolia ? 'bg-destructive' : ''}`} /> 
      <span>{isSepolia ? 'Ethereum Sepolia' : 'Wrong Network'}</span>
      <ChevronRight size={14} className="text-muted-foreground" />
    </div>
  ) 
}
function ParticleBackground() { return <div aria-hidden="true" className="particle-bg"><span className="particle p1" /><span className="particle p2" /><span className="particle p3" /><span className="particle p4" /></div> }
function CopyButton({ value }: { value: string }) { const [copied, setCopied] = useState(false); return <button className="icon-button" aria-label="Copy address" onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1400) }}>{copied ? <Check size={15} /> : <Copy size={15} />}</button> }
function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'destructive' }) { return <span className={`badge badge-${tone}`}>{children}</span> }
function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="section-title"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>{action}</div> }

// DASHBOARD COMPONENTS
function DashboardCard({ label, value, hint, loading = false, highlight = false }: { label: string; value: string; hint?: string; loading?: boolean; highlight?: boolean }) { 
  return (
    <div className={`p-5 rounded-xl border border-border ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-card'} shadow-sm`}>
      <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{loading ? <Loader2 size={16} className="animate-spin" /> : value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
    </div>
  ) 
}

function PendingApprovalsWidget({ tx, owners, contractAddress, reload, onNotice }: any) {
  if (!tx || (tx.status !== 'Awaiting Approval' && tx.status !== 'Pending')) return null;
  
  const [loading, setLoading] = useState(false);
  const handleAction = async (action: 'approve'|'execute') => {
    setLoading(true);
    let res;
    const txIdNum = parseInt(tx.id.replace('#', ''));
    if (action === 'approve') res = await walletService.approveTransaction(contractAddress, txIdNum);
    else res = await walletService.executeTransaction(contractAddress, txIdNum);
    
    if (res.error) onNotice(res.error);
    else { onNotice(res.message); reload(); }
    setLoading(false);
  }

  return (
    <div className="p-5 rounded-xl border border-warning/30 bg-warning/5 mb-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Check size={64} /></div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <div className="text-xs font-semibold text-warning tracking-wider uppercase mb-1">Action Required</div>
          <div className="font-medium text-lg">Transaction {tx.id}</div>
          <div className="text-sm text-muted-foreground mt-1">Send {tx.amount} to {tx.recipient.slice(0,6)}...{tx.recipient.slice(-4)}</div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm font-semibold">{tx.approvals} / {tx.threshold} Approvals</div>
            <div className="text-xs text-muted-foreground mt-1">Status: {tx.status}</div>
          </div>
          
          <div className="flex gap-2">
            {tx.status === 'Awaiting Approval' && <button className="primary-button" onClick={() => handleAction('approve')} disabled={loading}>{loading ? <Loader2 size={15} className="animate-spin" /> : 'Approve'}</button>}
            {tx.status === 'Pending' && <button className="primary-button" onClick={() => handleAction('execute')} disabled={loading}>{loading ? <Loader2 size={15} className="animate-spin" /> : 'Execute'}</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ contractAddress, balance, owners, threshold, dailyLimit, events, featuredTx, loading, onNotice, reload, onWizard }: any) {
  if (!contractAddress) return <EmptyState title="Wallet not deployed" message="Deploy a smart contract wallet to view your dashboard." action="Launch Deployment Wizard" onAction={onWizard} />;
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PendingApprovalsWidget tx={featuredTx} owners={owners} contractAddress={contractAddress} reload={reload} onNotice={onNotice} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard label="Total Balance" value={`${balance} ETH`} highlight loading={loading} />
        <DashboardCard label="Smart Contract" value={contractAddress ? `${contractAddress.slice(0,6)}...${contractAddress.slice(-4)}` : '--'} hint="Ethereum Sepolia" loading={loading} />
        <DashboardCard label="Multisig Status" value={`${threshold} / ${owners.length}`} hint="Signatures required" loading={loading} />
        <DashboardCard label="Security" value="Secure" hint={`Daily limit: ${dailyLimit} ETH`} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel">
          <SectionTitle eyebrow="ACTIVITY" title="Recent Transactions" />
          <div className="divide-y divide-border">
            {events.length === 0 ? <div className="py-8 text-center text-muted-foreground text-sm">No recent transactions.</div> : events.slice(0, 5).map((row: any, i: number) => (
              <div className="py-4 flex justify-between items-center" key={i}>
                <div>
                  <div className="font-medium text-sm">{row.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">Block {row.blockNumber}</div>
                </div>
                <a href={`https://sepolia.etherscan.io/tx/${row.transactionHash}`} target="_blank" rel="noreferrer" className="text-xs font-mono text-primary hover:underline">{row.transactionHash.slice(0,10)}... <ExternalLink size={10} className="inline"/></a>
              </div>
            ))}
          </div>
        </div>

        <div className="panel bg-card">
          <SectionTitle eyebrow="OVERVIEW" title="Wallet Info" />
          <div className="space-y-4 text-sm mt-6">
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">Ethereum Sepolia</span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Contract Type</span>
              <span className="font-medium">Nexus MultiSig</span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Owners</span>
              <span className="font-medium">{owners.length} Active Signers</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily Limit</span>
              <span className="font-medium">{dailyLimit} ETH</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ title, message, action, onAction }: { title: string, message: string, action?: string, onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl bg-card/50">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 text-muted-foreground">
        <Sparkles size={24} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{message}</p>
      {action && <button className="primary-button" onClick={onAction}>{action}</button>}
    </div>
  )
}

// WALLET PAGE
function WalletPage({ contractAddress, balance, owners, threshold, dailyLimit, highValue, timelock, loading }: any) {
  if (!contractAddress) return <EmptyState title="Wallet not deployed" message="Deploy a smart contract wallet to access this page." />;
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="panel flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="eyebrow mb-2">SMART CONTRACT ADDRESS</div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-mono tracking-tight">{contractAddress.slice(0,8)}...{contractAddress.slice(-8)}</div>
            <CopyButton value={contractAddress} />
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            <a href={`https://sepolia.etherscan.io/address/${contractAddress}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
              View on Sepolia Explorer <ExternalLink size={14} />
            </a>
          </div>
        </div>
        <div className="text-right">
          <div className="eyebrow mb-2">CURRENT BALANCE</div>
          <div className="text-3xl font-bold text-primary">{loading ? <Loader2 size={16} className="animate-spin inline" /> : balance} <span className="text-sm text-muted-foreground">ETH</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="panel">
          <SectionTitle eyebrow="CONFIGURATION" title="Multisig Settings" />
          <div className="space-y-4 mt-6 text-sm">
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground flex items-center gap-2"><Users size={16}/> Owners</span>
              <span className="font-semibold">{owners.length} Active</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground flex items-center gap-2"><Check size={16}/> Required Approvals</span>
              <span className="font-semibold">{threshold} of {owners.length}</span>
            </div>
          </div>
        </div>
        <div className="panel">
          <SectionTitle eyebrow="PROTECTION" title="Security Policies" />
          <div className="space-y-4 mt-6 text-sm">
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground flex items-center gap-2"><Gauge size={16}/> Daily Spending Limit</span>
              <span className="font-semibold">{dailyLimit} ETH</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground flex items-center gap-2"><LockKeyhole size={16}/> Timelock Duration</span>
              <span className="font-semibold">{timelock} seconds</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground flex items-center gap-2"><Fingerprint size={16}/> High Value Threshold</span>
              <span className="font-semibold">{highValue} ETH</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground flex items-center gap-2"><ShieldCheck size={16}/> Emergency Freeze</span>
              <Badge tone="success">Inactive</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// SEND PAGE
function SendPage({ onNotice, contractAddress, balance, reload }: any) {
  if (!contractAddress) return <EmptyState title="Wallet not deployed" message="Deploy a smart contract wallet to send assets." />;
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-2xl mx-auto panel animate-in fade-in duration-500">
      <SectionTitle eyebrow="TRANSFER" title="Send Assets" />
      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Recipient Address</label>
          <input className="w-full p-4 bg-background border border-border rounded-xl font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="0x..." value={recipient} onChange={e => setRecipient(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex justify-between">
            <span>Amount (ETH)</span>
            <span>Available: {balance} ETH</span>
          </label>
          <div className="relative">
            <input className="w-full p-4 bg-background border border-border rounded-xl text-lg font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">ETH</div>
          </div>
        </div>
        
        <div className="p-4 bg-muted/30 border border-border rounded-xl text-sm space-y-3 mt-8">
          <div className="flex justify-between"><span className="text-muted-foreground">Network Fee</span><span>Estimated</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-semibold">{amount || '0.00'} ETH</span></div>
        </div>

        <button className="primary-button w-full justify-center py-4 text-sm mt-4" disabled={loading || !contractAddress || !recipient || !amount} onClick={async () => { 
          setLoading(true);
          const res = await walletService.submitTransaction(contractAddress, { recipient, amount });
          if (res.error) onNotice(res.error);
          else { onNotice(res.message); setRecipient(''); setAmount(''); reload(); }
          setLoading(false);
        }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Submit Proposal
        </button>
      </div>
    </div>
  )
}

// RECEIVE PAGE
function ReceivePage({ contractAddress }: any) {
  if (!contractAddress) return <EmptyState title="Wallet not deployed" message="Deploy a smart contract wallet to receive assets." />;
  return (
    <div className="max-w-md mx-auto panel text-center animate-in fade-in duration-500 py-10">
      <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-6">
        <ArrowDownLeft size={32} />
      </div>
      <h2 className="text-2xl font-bold mb-2">Receive ETH</h2>
      <p className="text-sm text-muted-foreground mb-10">Send assets only to this smart contract address on the Ethereum Sepolia network.</p>
      
      <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-8 shadow-sm">
        <QrCode size={180} strokeWidth={1.5} className="text-black" />
      </div>

      <div className="bg-background border border-border p-4 rounded-xl flex items-center justify-between gap-4 text-left">
        <div className="overflow-hidden">
          <div className="text-xs text-muted-foreground mb-1 font-medium">Contract Address</div>
          <div className="font-mono text-sm truncate">{contractAddress}</div>
        </div>
        <div className="shrink-0"><CopyButton value={contractAddress} /></div>
      </div>
    </div>
  )
}

// TRANSACTIONS PAGE
function TransactionsPage({ events, contractAddress, featuredTx }: any) {
  if (!contractAddress) return <EmptyState title="Wallet not deployed" message="Deploy a smart contract wallet to view transactions." />;
  const [filter, setFilter] = useState('All');
  
  // Mix in featuredTx if it exists and isn't just an event, for demonstration.
  // In a real app we'd fetch all transactions from the contract, not just events.
  // The current walletService mostly returns events, we will rely on events for history.

  return (
    <div className="panel animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <SectionTitle eyebrow="HISTORY" title="Transactions" />
        <div className="flex items-center gap-2">
          {['All', 'Pending', 'Executed'].map(f => (
            <button key={f} className={`px-4 py-2 rounded-full text-xs font-medium border ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground'}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {featuredTx && filter !== 'Executed' && (
        <div className="mb-8">
          <div className="text-sm font-semibold text-muted-foreground mb-4">Pending Proposal</div>
          <div className="p-4 border border-border rounded-xl flex justify-between items-center bg-card">
            <div>
              <div className="font-medium">Tx {featuredTx.id} - Send {featuredTx.amount}</div>
              <div className="text-xs text-muted-foreground mt-1">To: {featuredTx.recipient}</div>
            </div>
            <Badge tone="warning">{featuredTx.status}</Badge>
          </div>
        </div>
      )}

      <div className="text-sm font-semibold text-muted-foreground mb-4">Past Events</div>
      {events.length === 0 ? <EmptyState title="No transactions yet" message="There is no transaction history for this wallet." /> : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 bg-muted/30 p-4 text-xs font-semibold text-muted-foreground tracking-wider uppercase border-b border-border">
            <div className="col-span-2">Event / Type</div>
            <div>Block</div>
            <div className="text-right">Transaction Hash</div>
          </div>
          <div className="divide-y divide-border">
            {events.map((e: any, i: number) => (
              <div key={i} className="grid grid-cols-4 p-4 items-center text-sm hover:bg-muted/10 transition-colors">
                <div className="col-span-2 font-medium">{e.name}</div>
                <div className="text-muted-foreground">{e.blockNumber}</div>
                <div className="text-right font-mono"><a href={`https://sepolia.etherscan.io/tx/${e.transactionHash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{e.transactionHash.slice(0,10)}... <ExternalLink size={10} className="inline"/></a></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// OWNERS PAGE
function OwnersPage({ owners, threshold, contractAddress, account }: any) {
  if (!contractAddress) return <EmptyState title="Wallet not deployed" message="Deploy a smart contract wallet to view owners." />;
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="eyebrow mb-2">ACCESS CONTROL</div>
          <h2 className="text-3xl font-bold">NEXUS Owners</h2>
          <p className="text-muted-foreground mt-2">Requires {threshold} of {owners.length} signatures to execute transactions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {owners.map((owner: any) => {
          const isMe = account?.toLowerCase() === owner.address.toLowerCase();
          return (
            <div key={owner.id} className={`p-6 rounded-xl border ${isMe ? 'bg-primary/5 border-primary/30 shadow-[0_0_20px_rgba(91,224,187,0.1)]' : 'bg-card border-border shadow-sm'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg text-primary">{owner.id}</div>
                {isMe && <Badge tone="success">Connected</Badge>}
              </div>
              <div className="font-semibold text-lg">{isMe ? 'YOU' : owner.label}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="font-mono text-sm text-muted-foreground truncate">{owner.address}</div>
                <CopyButton value={owner.address} />
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-success">
                <span className="w-2 h-2 rounded-full bg-success"></span> Active Signer
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


function Wizard({ onClose, onDeploySuccess }: { onClose: () => void, onDeploySuccess: (address: string) => void }) { 
  const [step, setStep] = useState(1); 
  const [owners, setOwners] = useState<string[]>(['']);
  const [threshold, setThreshold] = useState('1');
  const [loading, setLoading] = useState(false);
  const [deployRes, setDeployRes] = useState<any>(null);

  const steps = [
    'Connect EOA', 
    'Verify Network', 
    'Configure Owners', 
    'Configure Threshold', 
    'Security Policies', 
    'Deployment Summary', 
    'Deploy Wallet', 
    'Sign & Confirm', 
    'Wait for Confirmation', 
    'Retrieve Address', 
    'Success',
    'Save Configuration'
  ]; 

  const activeStepGroup = Math.min(Math.floor((step - 1) / 2) + 1, 6);

  const uiSteps = [
    'Connect & Network',
    'Owners & Threshold',
    'Security Policies',
    'Summary',
    'Deploy & Confirm',
    'Success'
  ];

  const updateOwner = (index: number, val: string) => {
    const newOwners = [...owners];
    newOwners[index] = val;
    setOwners(newOwners);
  }

  const addOwnerRow = () => setOwners([...owners, '']);
  const removeOwnerRow = (index: number) => setOwners(owners.filter((_, i) => i !== index));

  const validateOwners = () => {
    const valid = owners.filter(o => o.trim() !== '');
    if (valid.length === 0) return 'At least one owner is required.';
    for (let o of valid) {
      if (!ethers.isAddress(o)) return `Invalid address: ${o}`;
      if (o === ethers.ZeroAddress) return 'Cannot use zero address.';
    }
    const unique = new Set(valid);
    if (unique.size !== valid.length) return 'Duplicate owners are not allowed.';
    const t = parseInt(threshold);
    if (isNaN(t) || t < 1 || t > valid.length) return `Threshold cannot exceed the number of owners (${valid.length}). Please add more owners.`;
    return null;
  }

  const handleNext = async () => {
    if (step === 1) {
      const res = await walletService.connectWallet();
      if (res.error) { alert(res.error); return; }
      setStep(3); // skip 2 as connection checks network implicitly usually, but we can enforce it.
    } else if (step === 3 || step === 4) {
      const err = validateOwners();
      if (err) { alert(err); return; }
      setStep(step + 1);
    } else if (step === 7) {
      setStep(8);
      setLoading(true);
      const validOwners = owners.filter(o => o.trim() !== '');
      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '';
      const res = await walletService.deployWallet(factoryAddress, validOwners, parseInt(threshold), "0.5", "1.0", 60);
      setLoading(false);
      
      if (res.error) {
        alert("Deploy failed: " + res.error);
        setStep(6);
        return;
      }
      setDeployRes(res);
      setStep(9);
      setTimeout(() => { setStep(11); }, 2000); 
    } else if (step === 11) {
      onDeploySuccess(deployRes?.address || '');
      onClose();
    } else {
      setStep(step + 1);
    }
  }

  return (
    <div className="modal-backdrop"><div className="wizard max-h-[90vh] overflow-y-auto">
      <button className="modal-close" onClick={onClose}><X size={18} /></button>
      <div className="eyebrow text-primary">WALLET DEPLOYMENT</div>
      <h2>Create your smart wallet</h2>
      <p className="text-muted-foreground">A programmable account controlled by your trusted signers.</p>
      
      <div className="wizard-layout">
        <div className="wizard-steps">
          {uiSteps.map((item, i) => <div className={`wizard-step ${i + 1 === activeStepGroup ? 'active' : ''} ${i + 1 < activeStepGroup ? 'done' : ''}`} key={item}><span>{i + 1 < activeStepGroup ? <Check size={12} /> : i + 1}</span>{item}</div>)}
        </div>
        <div className="wizard-body">
          <div className="deployment-orb"><div className="orb-core"><GitBranch size={27} /></div></div>
          <div className="eyebrow">STEP {step} / 12</div>
          <h3>{steps[step - 1]}</h3>
          
          {step === 1 && <p className="mt-4">Connect your MetaMask to begin the deployment process on Ethereum Sepolia.</p>}
          
          {step === 3 && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Enter the public Ethereum addresses of the wallet owners.</p>
              {owners.map((owner, i) => (
                <div key={i} className="flex gap-2">
                  <input className="flex-1 p-2 bg-background border border-border rounded" placeholder="0x..." value={owner} onChange={e => updateOwner(i, e.target.value)} />
                  {owners.length > 1 && <button className="p-2 border border-border rounded text-destructive hover:bg-destructive/10" onClick={() => removeOwnerRow(i)}><X size={16}/></button>}
                </div>
              ))}
              <button className="secondary-button text-sm w-full justify-center" onClick={addOwnerRow}><Plus size={14} /> Add another owner</button>
            </div>
          )}

          {step === 4 && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Signature Threshold</label>
              <input className="w-full p-2 bg-background border border-border rounded" type="number" min="1" max={owners.filter(o=>o.trim()!=='').length} value={threshold} onChange={e => setThreshold(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-2">Requires {threshold} out of {owners.filter(o=>o.trim()!=='').length} signatures to execute transactions.</p>
            </div>
          )}

          {step === 5 && <p className="mt-4 text-sm text-muted-foreground border border-border p-4 rounded bg-muted/20">Using recommended defaults:<br/><br/>• 0.5 ETH daily limit<br/>• 1.0 ETH high-value limit<br/>• 60s timelock duration.</p>}
          
          {step === 6 && (
            <div className="mt-4 p-4 border border-border rounded bg-muted/10 text-sm">
              <h4 className="font-semibold mb-2">Deployment Summary</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><strong>Network:</strong> Sepolia</li>
                <li><strong>Owners:</strong> {owners.filter(o=>o.trim()!=='').length}</li>
                <li><strong>Threshold:</strong> {threshold}</li>
                <li><strong>Daily Limit:</strong> 0.5 ETH</li>
              </ul>
              <p className="mt-4 text-xs">Proceeding will prompt MetaMask for signature.</p>
            </div>
          )}

          {step === 8 && <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-primary mb-4" size={32}/> Please sign the transaction in MetaMask...</div>}
          {step === 9 && <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-primary mb-4" size={32}/> Waiting for blockchain confirmation...</div>}
          
          {step === 11 && <div className="mt-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/20 text-success mb-4"><Check size={24} /></div>
            <h3 className="text-xl font-bold mb-2">Smart Contract Wallet Created</h3>
            <div className="text-left bg-muted/20 p-4 rounded border border-border mt-4">
              <div className="mb-2"><span className="text-xs text-muted-foreground">Contract Address:</span><br/><strong className="text-primary break-all">{deployRes?.address}</strong> <CopyButton value={deployRes?.address || ''} /></div>
              <div><span className="text-xs text-muted-foreground">Transaction Hash:</span><br/><a href={`https://sepolia.etherscan.io/tx/${deployRes?.hash}`} target="_blank" rel="noreferrer" className="link-button px-0 font-mono text-xs">{deployRes?.hash?.slice(0,16)}... <ExternalLink size={10} className="inline"/></a></div>
              <div className="mt-2"><span className="text-xs text-muted-foreground">Network:</span><br/><strong>Ethereum Sepolia</strong></div>
            </div>
          </div>}

          {step === 12 && <div className="mt-4 p-4 border border-primary/30 bg-primary/5 rounded">
            <h4 className="font-semibold text-primary mb-2">Final Step: Save Configuration</h4>
            <p className="text-sm mb-4">To use your newly deployed wallet, copy the address below and paste it into your local <code className="bg-muted px-1 rounded">.env</code> file as the value for <code className="bg-muted px-1 rounded">NEXT_PUBLIC_WALLET_CONTRACT_ADDRESS</code>.</p>
            <div className="flex gap-2 items-center">
              <input className="flex-1 p-2 bg-background border border-border rounded font-mono text-sm" readOnly value={deployRes?.address || ''} />
              <CopyButton value={deployRes?.address || ''} />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Once saved, restart your development server to begin using the wallet dashboard.</p>
          </div>}
          
          {step !== 8 && step !== 9 && step !== 11 && step !== 12 && (
            <button className="primary-button mt-6 w-full justify-center" onClick={handleNext} disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : step === 6 ? 'Deploy Wallet' : step === 7 ? 'Proceed to MetaMask' : 'Continue'} <ChevronRight size={15} />
            </button>
          )}
          {step === 11 && <button className="primary-button mt-6 w-full justify-center" onClick={handleNext}>Finish & Use Wallet <ChevronRight size={15}/></button>}
        </div>
      </div>
    </div></div>
  ) 
}

// MAIN PAGE COMPONENT
export default function Page() { 
  const [active, setActive] = useState('Dashboard'); 
  const [notice, setNotice] = useState(''); 
  const [wizard, setWizard] = useState(false); 
  const [connected, setConnected] = useState(false); 
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState<number | null>(null);
  
  // Blockchain State
  const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '';
  const [userWallets, setUserWallets] = useState<string[]>([]);
  const [contractAddress, setContractAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [owners, setOwners] = useState<WalletOwner[]>([]);
  const [threshold, setThreshold] = useState(1);
  const [dailyLimit, setDailyLimit] = useState('0');
  const [highValue, setHighValue] = useState('0');
  const [timelock, setTimelock] = useState('0');
  const [txCount, setTxCount] = useState(0);
  const [featuredTx, setFeaturedTx] = useState<WalletTransaction | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const showNotice = (message: string) => { setNotice(message); setTimeout(() => setNotice(''), 3800) }; 

  const connect = async () => {
    const res = await walletService.connectWallet();
    if (res.error) showNotice(res.error);
    else {
      setConnected(true);
      setAccount(res.address);
      setChainId(res.chainId);
      if (DEMO_MODE) showNotice('Demo wallet connected.');
      else showNotice('Connected to Sepolia.');
    }
  }

  const disconnect = () => {
    setConnected(false);
    setAccount('');
    setChainId(null);
    showNotice('Wallet disconnected.');
  }

  const switchNetwork = async () => {
    try {
      if ((window as any).ethereum) {
        await (window as any).ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
        connect();
      }
    } catch (e) {
      showNotice('Failed to switch network');
    }
  }

  const loadData = async () => {
    setLoading(true);
    if (contractAddress) {
      const bal = await walletService.getWalletBalance(contractAddress);
      setBalance(bal.eth);
      setOwners(await walletService.getOwners(contractAddress));
      setThreshold(await walletService.getThreshold(contractAddress));
      setDailyLimit(await walletService.getDailyLimit(contractAddress));
      setHighValue(await walletService.getHighValueThreshold(contractAddress));
      setTimelock(await walletService.getTimelockDuration(contractAddress));
      
      const count = await walletService.getTransactionCount(contractAddress);
      setTxCount(count);
      if (count > 0) {
        setFeaturedTx(await walletService.getTransaction(contractAddress, count - 1));
      }
      setEvents(await walletService.getHistoryEvents(contractAddress));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (connected && (chainId === SEPOLIA_CHAIN_ID || DEMO_MODE)) {
      if (account && factoryAddress) {
        walletService.getUserWallets(factoryAddress, account).then(wallets => {
          setUserWallets(wallets);
          if (wallets.length > 0 && !contractAddress) {
            setContractAddress(wallets[0]);
          }
        });
      }
      loadData();
      const interval = setInterval(loadData, 15000); 
      return () => clearInterval(interval);
    }
  }, [connected, chainId, contractAddress, account, factoryAddress]);

  const title = active === 'Dashboard' ? 'Dashboard' : active; 

  return (
    <main className="app-shell flex text-foreground font-sans">
      <ParticleBackground />
      <aside className="w-64 border-r border-border bg-background/80 backdrop-blur-xl h-screen flex flex-col fixed left-0 top-0 z-20">
        <div className="p-6 border-b border-border"><Logo /></div>
        <div className="px-6 py-4 text-[10px] font-bold tracking-widest text-muted-foreground">MAIN MENU</div>
        <nav className="flex-1 px-4 space-y-1">
          {nav.map(([label, Icon]) => (
            <button key={label} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active === label ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`} onClick={() => setActive(label)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border bg-muted/10">
          <div className="text-xs text-muted-foreground mb-3 text-center">Network: Sepolia</div>
          {connected ? (
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl relative group">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">S1</div>
              <div className="overflow-hidden text-left flex-1">
                <div className="text-xs font-semibold">Connected</div>
                <div className="text-xs text-muted-foreground truncate">{account.slice(0,6)}...{account.slice(-4)}</div>
              </div>
              <button onClick={disconnect} className="absolute right-3 p-2 bg-destructive/10 text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground" title="Disconnect">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button className="primary-button w-full justify-center" onClick={connect}>Connect Wallet</button>
          )}
        </div>
      </aside>

      <div className="flex-1 ml-0 md:ml-64 min-h-screen relative z-10 flex flex-col">
        <header className="h-20 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <div className="flex items-center gap-4">
            {userWallets.length > 1 && (
              <select 
                className="bg-card border border-border text-sm font-medium rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-primary transition-colors"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
              >
                {userWallets.map((w, i) => (
                  <option key={w} value={w}>Wallet {i + 1} ({w.slice(0,6)}...{w.slice(-4)})</option>
                ))}
              </select>
            )}
            <NetworkStatus chainId={chainId} />
            <button className="demo-card text-xs flex items-center gap-2 p-2 border border-primary/20 bg-primary/5 rounded-lg text-primary hover:bg-primary/10 transition-colors" onClick={() => { setWizard(true); }}>
              <Sparkles size={14} /> Deploy Wizard
            </button>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full flex-1">
          {chainId !== null && chainId !== SEPOLIA_CHAIN_ID && !DEMO_MODE && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg flex items-center justify-between mb-8 shadow-sm">
              <div><strong className="block mb-1">Wrong Network Detected</strong><p className="text-sm opacity-90">Please switch to Ethereum Sepolia to use Nexus Wallet.</p></div>
              <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium text-sm hover:brightness-110 transition-all" onClick={switchNetwork}>Switch to Sepolia</button>
            </div>
          )}

          {active === 'Dashboard' && <Dashboard contractAddress={contractAddress} balance={balance} owners={owners} threshold={threshold} dailyLimit={dailyLimit} events={events} featuredTx={featuredTx} loading={loading} reload={loadData} onNotice={showNotice} onWizard={() => setWizard(true)} />}
          {active === 'Wallet' && <WalletPage contractAddress={contractAddress} balance={balance} owners={owners} threshold={threshold} dailyLimit={dailyLimit} highValue={highValue} timelock={timelock} loading={loading} />}
          {active === 'Send' && <SendPage onNotice={showNotice} contractAddress={contractAddress} balance={balance} reload={loadData} />}
          {active === 'Receive' && <ReceivePage contractAddress={contractAddress} />}
          {active === 'Transactions' && <TransactionsPage events={events} contractAddress={contractAddress} featuredTx={featuredTx} />}
          {active === 'Owners' && <OwnersPage owners={owners} threshold={threshold} contractAddress={contractAddress} account={account} />}
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border flex justify-around p-2 z-20 pb-safe">
        {nav.map(([label, Icon]) => (
          <button key={label} className={`flex flex-col items-center p-2 text-[10px] ${active === label ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => setActive(label)}>
            <Icon size={20} className="mb-1" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {notice && <div className="fixed bottom-24 md:bottom-8 right-8 flex items-center gap-2 bg-card border border-primary/30 text-primary px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-5"><Check size={16} /> {notice}</div>}
      
      {wizard && <Wizard onClose={() => setWizard(false)} onDeploySuccess={(address) => { 
        setContractAddress(address); 
        if (account && factoryAddress) {
          walletService.getUserWallets(factoryAddress, account).then(setUserWallets);
        }
        loadData(); 
      }} />}
    </main>
  )
}
