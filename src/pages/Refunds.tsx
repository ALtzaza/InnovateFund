import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatEther } from 'ethers';
import toast from 'react-hot-toast';
import { Undo2, Wallet } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useTxFlow } from '../hooks/useTxFlow';
import { useCampaigns, useMyPositions } from '../hooks/useCampaigns';
import { useTransactions } from '../hooks/useTransactions';
import { fetchCampaign, fetchContribution, getWriteContract } from '../services/blockchain';
import { CampaignStatus } from '../types';
import type { Campaign } from '../types';
import { fmtEth, timeLeft } from '../utils/format';
import { SidebarLayout } from '../components/layout/Sidebar';
import ConnectWallet from '../components/wallet/ConnectWallet';
import TransactionModal from '../components/ui/TransactionModal';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Refunds() {
  const wallet = useWallet();
  const flow = useTxFlow();
  const { campaigns, loading, error, refresh } = useCampaigns();
  const pos = useMyPositions(campaigns, wallet.address);
  const myTxs = useTransactions({ address: wallet.address });

  const refunded = useMemo(() => new Set(myTxs.records.filter((r) => r.type === 'Refund').map((r) => r.campaignId)), [myTxs.records]);

  const items = useMemo(
    () =>
      campaigns
        .map((c) => ({ c, amount: pos.contributions.get(c.id) ?? 0n }))
        .filter(({ c, amount }) => amount > 0n || (c.status === CampaignStatus.Failed && refunded.has(c.id))),
    [campaigns, pos.contributions, refunded],
  );

  const stateOf = (c: Campaign, amount: bigint) => {
    if (c.status === CampaignStatus.Failed) return amount > 0n ? ('eligible' as const) : ('refunded' as const);
    if (c.status === CampaignStatus.Funding) return 'active' as const;
    return 'locked' as const;
  };

  const requestRefund = async (c: Campaign) => {
    if (!wallet.address) return;
    if (!wallet.isCorrectNetwork) return void toast.error('Switch MetaMask to Sepolia first.');
    try {
      // Re-check eligibility against the contract right before asking MetaMask.
      const [fresh, amount] = await Promise.all([fetchCampaign(c.id), fetchContribution(c.id, wallet.address)]);
      if (fresh.status !== CampaignStatus.Failed) return void toast.error('This campaign is not in a failed state.');
      if (amount === 0n) return void toast.error('Nothing to refund for this wallet.');
      flow.open({
        title: 'Request refund',
        description: 'You will receive back exactly what you contributed. Other contributors are not affected.',
        details: [
          { label: 'Campaign', value: `#${c.id} · ${c.title}` },
          { label: 'Refund amount', value: `${formatEther(amount)} ETH` },
        ],
        confirmLabel: 'Request Refund',
        send: async () => getWriteContract(await wallet.getSigner()).refund(c.id),
        onConfirmed: async () => {
          await refresh();
          pos.refresh();
          void myTxs.refresh();
        },
      });
    } catch {
      toast.error('Could not verify refund eligibility. Try again.');
    }
  };

  if (!wallet.address) {
    return (
      <SidebarLayout>
        <EmptyState icon={<Wallet className="h-7 w-7" />} title="Connect your wallet" description="Connect to see which campaigns you can claim a refund from." action={<ConnectWallet />} />
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div>
        <h1 className="section-title">Refunds</h1>
        <p className="mt-1 text-slate-500">Refunds are available only when a campaign&apos;s deadline has passed without reaching its goal.</p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : loading || pos.loading ? (
        <LoadingSpinner label="Checking your contributions on-chain…" />
      ) : items.length === 0 ? (
        <EmptyState icon={<Undo2 className="h-7 w-7" />} title="No contributions found" description="Campaigns you fund will be listed here with their refund eligibility." action={<Link to="/campaigns" className="btn-primary">Explore Campaigns</Link>} />
      ) : (
        <div className="space-y-4">
          {items.map(({ c, amount }) => {
            const st = stateOf(c, amount);
            return (
              <div key={c.id} className="glass flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <Link to={`/campaigns/${c.id}`} className="font-bold text-slate-800 hover:text-electric">#{c.id} · {c.title}</Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {st === 'refunded' ? 'Refund already received.' : <>Your contribution: <b className="text-slate-800">{fmtEth(amount)} ETH</b></>}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Raised {fmtEth(c.raised)} / {fmtEth(c.goal)} ETH{st === 'active' ? ` · ${timeLeft(c.deadline)}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  {st === 'eligible' && <span className="badge border-emerald-500/30 bg-emerald-500/10 text-emerald-700">Eligible</span>}
                  {st === 'refunded' && <span className="badge border-blue-600/30 bg-blue-600/10 text-blue-800">Refunded</span>}
                  {st === 'active' && <span className="badge border-emerald-500/30 bg-emerald-500/10 text-emerald-700">Not eligible — still funding</span>}
                  {st === 'locked' && <span className="badge border-slate-500/30 bg-slate-500/10 text-slate-600">Not eligible — campaign funded</span>}
                  {st === 'eligible' && (
                    <button className="btn-primary" disabled={flow.isBusy} onClick={() => void requestRefund(c)}>
                      <Undo2 className="h-4 w-4" /> Request Refund
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <TransactionModal flow={flow} />
    </SidebarLayout>
  );
}
