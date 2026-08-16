'use client'

import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Bell, Check, ChevronRight, CircleHelp, Copy, ExternalLink, Fingerprint, Gauge, GitBranch, KeyRound, LayoutDashboard, LockKeyhole, Menu, MoreHorizontal, Network, Plus, QrCode, ReceiptText, Send, Settings, ShieldCheck, Sparkles, Users, WalletCards, X, Loader2 } from 'lucide-react'
import { DEMO_MODE, DEMO_MODE_NOTICE, walletService, type WalletOwner, type WalletTransaction, SEPOLIA_CHAIN_ID } from '@/lib/services/wallet'
import { ethers } from 'ethers'

const nav = [
  ['Dashboard', LayoutDashboard], ['Wallet', WalletCards], ['Send', Send], ['Receive', ArrowDownLeft], ['Transactions', ReceiptText], ['Approvals', Check], ['Security', ShieldCheck], ['Owners', Users], ['Settings', Settings],
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
function StatCard({ label, value, hint, icon: Icon, loading = false }: { label: string; value: string; hint: string; icon: typeof Users; loading?: boolean }) { return <div className="stat-card"><div className="stat-icon"><Icon size={17} /></div><div className="eyebrow">{label}</div><div className="stat-value">{loading ? <Loader2 size={16} className="animate-spin" /> : value}</div><div className="stat-hint">{hint}</div></div> }
function WalletBalance({ onSend, address, balance, loading }: { onSend: () => void, address: string, balance: string, loading: boolean }) { 
  return (
    <section className="hero-card"><div className="hero-grid" /><div className="hero-content">
      <div className="flex items-center justify-between gap-4">
        <div className="eyebrow text-primary">SMART CONTRACT WALLET</div>
        <Badge tone="success"><span className="status-dot" /> SECURE</Badge>
      </div>
      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <div className="address-row">
            <span>{address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Not Deployed'}</span>
            {address && <CopyButton value={address} />}
          </div>
          <div className="text-xs text-muted-foreground">Wallet address · Sepolia test network</div>
        </div>
        {address && <a href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noreferrer" className="link-button hidden sm:flex">View on Explorer <ExternalLink size={14} /></a>}
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="balance-label">TOTAL BALANCE</div>
          <div className="balance-value">{loading ? <Loader2 className="animate-spin mt-2" /> : balance} <span>ETH</span></div>
          <div className="text-sm text-muted-foreground">≈ $-- USD</div>
        </div>
        <button className="primary-button" onClick={onSend} disabled={!address}><Send size={15} /> Send assets</button>
      </div>
    </div></section>
  )
}
function MultisigProgress({ current, total }: { current: number, total: number }) { const pct = total > 0 ? (current / total) * 100 : 0; return <div className="progress-wrap"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Approval progress</span><strong>{current} / {total}</strong></div><div className="progress-track"><div className="progress-fill" style={{width: `${pct}%`}} /></div></div> }
function ApprovalTimeline({ status }: { status: WalletTransaction['status'] }) { 
  const steps = ['Created', 'Approvals', 'Timelock', 'Executable', 'Executed'];
  let activeIndex = 0;
  if (status === 'Awaiting Approval') activeIndex = 1;
  if (status === 'Timelocked') activeIndex = 2;
  if (status === 'Pending') activeIndex = 3;
  if (status === 'Executed') activeIndex = 4;

  return <div className="timeline">{steps.map((step, i) => <div className={`timeline-step ${i < activeIndex ? 'complete' : i === activeIndex ? 'current' : ''}`} key={step}><div className="timeline-node">{i < activeIndex ? <Check size={12} /> : i === activeIndex ? <span /> : null}</div><span>{step}</span>{i < steps.length - 1 && <div className="timeline-line" />}</div>)}</div> 
}

function TransactionCard({ onNotice, tx, owners, contractAddress, reload }: { onNotice: (m: string) => void, tx: WalletTransaction | null, owners: WalletOwner[], contractAddress: string, reload: () => void }) { 
  if (!tx) return <section className="panel approval-card opacity-50"><div className="text-center py-10"><ReceiptText size={32} className="mx-auto mb-4 text-muted-foreground"/>No pending transactions.</div></section>
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'approve'|'revoke'|'execute') => {
    setLoading(true);
    let res;
    const txIdNum = parseInt(tx.id.replace('#', ''));
    if (action === 'approve') res = await walletService.approveTransaction(contractAddress, txIdNum);
    else if (action === 'revoke') res = await walletService.revokeApproval(contractAddress, txIdNum);
    else res = await walletService.executeTransaction(contractAddress, txIdNum);
    
    if (res.error) onNotice(res.error);
    else { onNotice(res.message); reload(); }
    setLoading(false);
  }

  return (
    <section className="panel approval-card">
      <div className="flex items-start justify-between gap-3">
        <div><div className="eyebrow">FEATURED APPROVAL</div><h3>Transaction {tx.id}</h3></div>
        <Badge tone={tx.status === 'Executed' ? 'success' : tx.status === 'Cancelled' ? 'destructive' : 'warning'}>{tx.status}</Badge>
      </div>
      <div className="transaction-main">
        <div>
          <div className="text-sm text-muted-foreground">{tx.type}</div>
          <div className="amount">{tx.amount.split(' ')[0]} <span>ETH</span></div>
          <div className="text-sm text-muted-foreground">To: <strong className="text-foreground">{tx.recipient.slice(0,8)}...{tx.recipient.slice(-6)}</strong></div>
        </div>
        <div className="approval-count"><div className="text-2xl font-semibold">{tx.approvals}<span className="text-muted-foreground">/{tx.threshold}</span></div><div className="text-xs text-muted-foreground">APPROVALS</div></div>
      </div>
      <MultisigProgress current={tx.approvals} total={tx.threshold} />
      <div className="owner-approvals">
        {owners.map((owner) => (
          <div className="owner-approval" key={owner.id}>
            <div className={`owner-avatar ${owner.approved ? 'approved' : ''}`}>{owner.id}</div>
            <div>
              <div className="text-sm font-medium">{owner.label}</div>
              <div className={`text-xs ${owner.approved ? 'text-primary' : 'text-muted-foreground'}`}>{owner.approved ? '✓ Approved' : 'Waiting'}</div>
            </div>
          </div>
        ))}
      </div>
      <ApprovalTimeline status={tx.status} />
      <div className="action-row">
        {tx.status === 'Awaiting Approval' && <button className="primary-button" onClick={() => handleAction('approve')} disabled={loading}>{loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Approve</button>}
        {tx.status === 'Awaiting Approval' && <button className="secondary-button" onClick={() => handleAction('revoke')} disabled={loading}>Revoke</button>}
        {tx.status === 'Pending' && <button className="secondary-button" onClick={() => handleAction('execute')} disabled={loading}>Execute</button>}
      </div>
      {tx.hash && <div className="mt-4 text-xs text-center"><a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">View Transaction <ExternalLink size={10} className="inline"/></a></div>}
    </section>
  ) 
}

function SecuritySummary({ dailyLimit, highValue, timelock, loading }: any) { 
  return (
    <section className="panel">
      <SectionTitle eyebrow="POLICY STATUS" title="Security center" action={<button className="icon-button"><MoreHorizontal size={16} /></button>} />
      <div className="security-list">
        {[['Daily spending limit', loading ? '...' : `${dailyLimit} ETH`, Gauge], 
          ['High value threshold', loading ? '...' : `${highValue} ETH`, Fingerprint], 
          ['Transaction timelock', loading ? '...' : `${timelock} seconds`, LockKeyhole], 
          ['Whitelist mode', 'Enabled', ShieldCheck]
        ].map(([label, value, Icon]) => (
          <div className="security-row" key={label as string}>
            <div className="flex items-center gap-3"><div className="mini-icon"><Icon size={15} /></div><span>{label as string}</span></div>
            <strong>{value as string}</strong>
          </div>
        ))}
      </div>
    </section>
  ) 
}

function History({ events }: { events: any[] }) { 
  return (
    <section className="panel history-panel">
      <SectionTitle eyebrow="ACTIVITY" title="Recent events" action={<button className="link-button">View all <ChevronRight size={14} /></button>} />
      <div className="history-table">
        <div className="history-head"><span>Event</span><span>Block</span><span>Transaction Hash</span></div>
        {events.length === 0 ? <div className="py-8 text-center text-muted-foreground text-sm">No recent events found.</div> : events.map((row, i) => (
          <div className="history-row grid-cols-3" key={i}>
            <span className="font-medium text-foreground">{row.name}</span>
            <span>{row.blockNumber}</span>
            <a href={`https://sepolia.etherscan.io/tx/${row.transactionHash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{row.transactionHash.slice(0,10)}... <ExternalLink size={10} className="inline"/></a>
          </div>
        ))}
      </div>
    </section>
  ) 
}

function OwnersPanel({ onNotice, owners, threshold }: { onNotice: (m: string) => void, owners: WalletOwner[], threshold: number }) { 
  return (
    <section className="panel">
      <SectionTitle eyebrow="SIGNERS" title="Wallet owners" action={<button className="secondary-button" onClick={() => onNotice('Propose new owner functionality coming soon.')}> <Plus size={14} /> Add owner</button>} />
      <div className="owner-list">
        {owners.map(owner => (
          <div className="owner-list-row" key={owner.id}>
            <div className="owner-avatar approved">{owner.id}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{owner.label}</div>
              <div className="truncate text-xs text-muted-foreground">{owner.address}</div>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-xs text-muted-foreground">Role</div>
              <div className="text-sm">{owner.role}</div>
            </div>
            <Badge tone="success">Active</Badge>
          </div>
        ))}
      </div>
      <div className="threshold-row">
        <span>Required threshold</span><strong>{threshold} of {owners.length}</strong>
        <button className="link-button" onClick={() => onNotice('Propose threshold change coming soon.')}>Change threshold <ChevronRight size={14} /></button>
      </div>
    </section>
  ) 
}

function SendPanel({ onNotice, contractAddress, reload }: { onNotice: (m: string) => void, contractAddress: string, reload: () => void }) { 
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <section className="panel send-panel">
      <SectionTitle eyebrow="NEW PROPOSAL" title="Send transaction" />
      <div className="form-grid">
        <label>Recipient address<input placeholder="0x..." value={recipient} onChange={e => setRecipient(e.target.value)} /></label>
        <label>Amount (ETH)<input placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></label>
      </div>
      <div className="analysis-box">
        <div className="eyebrow">SECURITY ANALYSIS</div>
        {[['Recipient', 'Whitelisted ✓'], ['Daily limit', 'Available ✓'], ['Timelock', '60 seconds']].map(item => (
          <div className="analysis-row" key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></div>
        ))}
      </div>
      <button className="primary-button w-full justify-center" disabled={loading || !contractAddress || !recipient || !amount} onClick={async () => { 
        setLoading(true);
        const res = await walletService.submitTransaction(contractAddress, { recipient, amount });
        if (res.error) onNotice(res.error);
        else { onNotice(res.message); setRecipient(''); setAmount(''); reload(); }
        setLoading(false);
      }}>
        {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpRight size={15} />} Submit Proposal
      </button>
    </section>
  ) 
}

function ReceivePanel({ contractAddress }: { contractAddress: string }) { 
  return (
    <section className="panel receive-panel">
      <SectionTitle eyebrow="INBOUND ASSETS" title="Receive" />
      <div className="receive-content">
        <div className="qr-placeholder"><QrCode size={100} strokeWidth={1} /><span>QR CODE</span></div>
        <div>
          <div className="eyebrow">SMART CONTRACT WALLET ADDRESS</div>
          <div className="address-row large">{contractAddress || 'Not Deployed'} {contractAddress && <CopyButton value={contractAddress} />}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Network size={14} /> Ethereum Sepolia</div>
          <div className="warning-note">Only send assets compatible with this network.</div>
        </div>
      </div>
    </section>
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
    if (isNaN(t) || t < 1 || t > valid.length) return `Threshold must be between 1 and ${valid.length}.`;
    return null;
  }

  const handleNext = async () => {
    if (step === 1) {
      const res = await walletService.connectWallet();
      if (res.error) { alert(res.error); return; }
      setStep(3); // skip 2 as connection checks network implicitly usually, but we can enforce it.
    } else if (step === 3 || step === 4) {
      const err = validateOwners();
      if (err && step === 4) { alert(err); return; }
      setStep(step + 1);
    } else if (step === 7) {
      setStep(8);
      setLoading(true);
      const validOwners = owners.filter(o => o.trim() !== '');
      const res = await walletService.deployWallet(validOwners, parseInt(threshold), "0.5", "1.0", 60);
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
      setStep(12);
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
          {step === 11 && <button className="primary-button mt-6 w-full justify-center" onClick={handleNext}>Finish <ChevronRight size={15}/></button>}
          {step === 12 && <button className="primary-button mt-6 w-full justify-center" onClick={() => { onDeploySuccess(deployRes?.address || ''); onClose(); }}>Return to Dashboard</button>}
        </div>
      </div>
    </div></div>
  ) 
}

export default function Page() { 
  const [active, setActive] = useState('Dashboard'); 
  const [notice, setNotice] = useState(''); 
  const [wizard, setWizard] = useState(false); 
  const [connected, setConnected] = useState(false); 
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState<number | null>(null);
  
  // Blockchain State
  const [contractAddress, setContractAddress] = useState(process.env.NEXT_PUBLIC_WALLET_CONTRACT_ADDRESS || '');
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
      loadData();
      const interval = setInterval(loadData, 15000); // Refresh every 15s
      return () => clearInterval(interval);
    }
  }, [connected, chainId, contractAddress]);

  const title = active === 'Dashboard' ? 'Good morning, Signer' : active; 

  let content;
  if (active === 'Send') content = <SendPanel onNotice={showNotice} contractAddress={contractAddress} reload={loadData} />;
  else if (active === 'Receive') content = <ReceivePanel contractAddress={contractAddress} />;
  else if (active === 'Owners') content = <OwnersPanel onNotice={showNotice} owners={owners} threshold={threshold} />;
  else if (active === 'Security') content = <SecuritySummary dailyLimit={dailyLimit} highValue={highValue} timelock={timelock} loading={loading} />;
  else content = (
    <>
      {chainId !== null && chainId !== SEPOLIA_CHAIN_ID && !DEMO_MODE && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg flex items-center justify-between mb-6">
          <div><strong>Wrong Network Detected</strong><p className="text-sm opacity-80">Please switch to Ethereum Sepolia to use Nexus Wallet.</p></div>
          <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded font-medium" onClick={switchNetwork}>Switch to Sepolia</button>
        </div>
      )}
      <WalletBalance onSend={() => setActive('Send')} address={contractAddress} balance={balance} loading={loading} />
      <div className="stats-grid">
        <StatCard label="Owners" value={owners.length.toString()} hint="Active signers" icon={Users} loading={loading} />
        <StatCard label="Required approvals" value={`${threshold} / ${owners.length}`} hint="Signature threshold" icon={Check} loading={loading} />
        <StatCard label="Daily limit" value={`${dailyLimit} ETH`} hint="Remaining calculated" icon={Gauge} loading={loading} />
        <StatCard label="Pending transactions" value={featuredTx && featuredTx.status !== 'Executed' && featuredTx.status !== 'Cancelled' ? '1' : '0'} hint="Need your attention" icon={ReceiptText} loading={loading} />
      </div>
      <div className="content-grid">
        <TransactionCard onNotice={showNotice} tx={featuredTx} owners={owners} contractAddress={contractAddress} reload={loadData} />
        <SecuritySummary dailyLimit={dailyLimit} highValue={highValue} timelock={timelock} loading={loading} />
      </div>
      <OwnersPanel onNotice={showNotice} owners={owners} threshold={threshold} />
      <History events={events} />
    </>
  );

  return (
    <main className="app-shell">
      <ParticleBackground />
      <aside className="sidebar">
        <Logo />
        <div className="sidebar-label">WORKSPACE</div>
        <nav>
          {nav.map(([label, Icon]) => (
            <button key={label} className={active === label ? 'active' : ''} onClick={() => setActive(label)}>
              <Icon size={17} /><span>{label}</span>
              {label === 'Approvals' && featuredTx && featuredTx.status !== 'Executed' && <span className="nav-count">1</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="demo-card text-left" onClick={() => setWizard(true)}>
            <Sparkles size={16} /><div><strong>{DEMO_MODE ? 'Demo' : 'Live'} environment</strong><span>Launch deployment wizard</span></div>
          </button>
          <div className="profile">
            <div className="profile-avatar">S1</div>
            <div className="overflow-hidden">
              <strong>Signer</strong>
              <span className="truncate w-24 block">{account || 'Not connected'}</span>
            </div>
            <MoreHorizontal size={16} className="ml-auto text-muted-foreground flex-shrink-0" />
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button"><Menu size={19} /></button>
          <div className="topbar-heading"><div className="eyebrow">OVERVIEW</div><h1>{title}</h1></div>
          <div className="topbar-actions">
            <NetworkStatus chainId={chainId} />
            <button className="icon-button"><Bell size={17} /></button>
            {connected ? (
              <div className="wallet-chip"><span className="status-dot" /> {account.slice(0,6)}...{account.slice(-4)}</div>
            ) : (
              <button className="primary-button" onClick={connect}>Connect EOA</button>
            )}
          </div>
        </header>

        <div className="page-content">
          <div className="mobile-brand"><Logo /></div>
          <div className="mobile-network"><NetworkStatus chainId={chainId} /></div>
          <div className="notice-strip"><Sparkles size={14} /> {DEMO_MODE_NOTICE}</div>
          {content}
        </div>
      </div>

      <div className="bottom-nav">
        {nav.slice(0, 5).map(([label, Icon]) => (
          <button className={active === label ? 'active' : ''} key={label} onClick={() => setActive(label)}>
            <Icon size={17} /><span>{label}</span>
          </button>
        ))}
      </div>

      {notice && <div className="toast"><Check size={15} /> {notice}</div>}
      {wizard && <Wizard onClose={() => setWizard(false)} onDeploySuccess={(addr) => { setContractAddress(addr); setWizard(false); showNotice('Wallet active!') }} />}
    </main>
  )
}
