import { useMemo, useState } from 'react';
import { formatEther, parseEther } from 'ethers';
import toast from 'react-hot-toast';
import { Wallet } from 'lucide-react';
import type { Campaign } from '../../types';
import { CampaignStatus } from '../../types';
import { useWallet } from '../../hooks/useWallet';
import { useTxFlow } from '../../hooks/useTxFlow';
import { getWriteContract } from '../../services/blockchain';
import { eq, fmtEth } from '../../utils/format';
import TransactionModal from '../ui/TransactionModal';

const QUICK = ['0.001', '0.005', '0.01'];

export default function ContributionForm({ campaign, onDone }: { campaign: Campaign; onDone: () => void }) {
  const wallet = useWallet();
  const flow = useTxFlow();
  const [amount, setAmount] = useState('');
  const remaining = campaign.goal - campaign.raised;

  const parsed = useMemo<{ wei: bigint | null; error: string | null }>(() => {
    const v = amount.trim();
    if (!v) return { wei: null, error: null };
    try {
      const wei = parseEther(v);
      if (wei <= 0n) return { wei: null, error: 'Amount must be greater than 0.' };
      return { wei, error: null };
    } catch {
      return { wei: null, error: 'Enter a valid ETH amount (max 18 decimals).' };
    }
  }, [amount]);

  const blocker = (() => {
    if (!wallet.isConnected) return 'Connect your wallet to contribute.';
    if (!wallet.isCorrectNetwork) return 'Switch MetaMask to the Sepolia network.';
    if (campaign.status !== CampaignStatus.Funding) return 'This campaign is not accepting contributions.';
    if (eq(wallet.address, campaign.owner)) return 'Campaign owners cannot fund their own campaign.';
    if (parsed.error) return parsed.error;
    if (parsed.wei === null) return 'Enter an amount.';
    if (parsed.wei > remaining) return `Exceeds the remaining goal (${fmtEth(remaining)} ETH).`;
    if (wallet.balance !== null && parsed.wei > wallet.balance) return 'Amount exceeds your wallet balance.';
    return null;
  })();

  const submit = () => {
    if (blocker || parsed.wei === null) return;
    const wei = parsed.wei;
    flow.open({
      title: 'Confirm contribution',
      description: 'Your ETH is locked in the smart contract and can only be released through milestone approvals (or refunded if the campaign fails).',
      details: [
        { label: 'Campaign', value: `#${campaign.id} · ${campaign.title}` },
        { label: 'Amount', value: `${formatEther(wei)} ETH` },
      ],
      confirmLabel: 'Contribute',
      send: async () => {
        const signer = await wallet.getSigner();
        return getWriteContract(signer).contribute(campaign.id, { value: wei });
      },
      onConfirmed: () => {
        setAmount('');
        toast.success('Contribution recorded on-chain.');
        onDone();
      },
    });
  };

  const open = campaign.status === CampaignStatus.Funding;

  return (
    <div className="glass p-6">
      <h3 className="text-lg font-bold text-white">Contribute</h3>
      <p className="mt-1 text-sm text-slate-400">
        Wallet balance: <span className="font-semibold text-cyan-300">{wallet.balance !== null ? `${fmtEth(wallet.balance, 4)} ETH` : '—'}</span>
      </p>

      <label className="label mt-5" htmlFor="amount">Amount (ETH)</label>
      <input
        id="amount"
        className="input"
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        disabled={!open}
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button key={q} type="button" className="btn-ghost !px-3 !py-1.5 !text-xs" disabled={!open} onClick={() => setAmount(q)}>
            {q} ETH
          </button>
        ))}
        <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs" disabled={!open || remaining <= 0n} onClick={() => setAmount(formatEther(remaining))}>
          Remaining ({fmtEth(remaining)})
        </button>
      </div>

      {blocker && amount.trim() !== '' && <p className="mt-3 text-sm text-amber-300">{blocker}</p>}

      {!wallet.isConnected ? (
        <button className="btn-primary mt-5 w-full" onClick={() => void wallet.connect()}>
          <Wallet className="h-4 w-4" /> Connect Wallet
        </button>
      ) : !wallet.isCorrectNetwork ? (
        <button className="btn-primary mt-5 w-full" onClick={() => void wallet.switchToSepolia()}>Switch to Sepolia</button>
      ) : (
        <button className="btn-primary mt-5 w-full" disabled={!!blocker || flow.isBusy} onClick={submit}>
          Contribute
        </button>
      )}
      {wallet.isConnected && wallet.isCorrectNetwork && !open && <p className="mt-3 text-sm text-slate-400">{blocker}</p>}

      <TransactionModal flow={flow} />
    </div>
  );
}
