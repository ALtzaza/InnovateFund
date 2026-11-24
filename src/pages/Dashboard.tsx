import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Flag, Layers, Vote, Wallet } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useCampaigns, useMyPositions } from '../hooks/useCampaigns';
import { useTransactions } from '../hooks/useTransactions';
import { eq, fmtEth, formatDate, shortAddr } from '../utils/format';
import { txUrl } from '../config/contract';
import { SidebarLayout } from '../components/layout/Sidebar';
import StatCard from '../components/ui/StatCard';
import CampaignCard from '../components/campaigns/CampaignCard';
import ConnectWallet from '../components/wallet/ConnectWallet';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/LoadingSpinner';

export default function Dashboard() {
  const { address } = useWallet();
  const { campaigns, loading, error, refresh } = useCampaigns();
  const pos = useMyPositions(campaigns, address);
  const txs = useTransactions();

  const created = useMemo(() => campaigns.filter((c) => eq(c.owner, address)), [campaigns, address]);
  const funded = useMemo(() => campaigns.filter((c) => (pos.contributions.get(c.id) ?? 0n) > 0n), [campaigns, pos.contributions]);
  const totalContributed = useMemo(() => funded.reduce((s, c) => s + (pos.contributions.get(c.id) ?? 0n), 0n), [funded, pos.contributions]);

  const recent = useMemo(() => {
    if (!address) return [];
    const owned = new Set(created.map((c) => c.id));
    return txs.all.filter((r) => eq(r.address, address) || (r.type === 'MilestoneRequest' && owned.has(r.campaignId))).slice(0, 10);
  }, [txs.all, address, created]);

  if (!address) {
    return (
      <SidebarLayout>
        <EmptyState icon={<Wallet className="h-7 w-7" />} title="Connect your wallet" description="Your dashboard is built from the wallet you connect — campaigns you created, funded and votes waiting for you." action={<ConnectWallet />} />
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 to-electric px-6 py-7 text-white shadow-card sm:px-8">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Portfolio overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight !text-white sm:text-3xl">My Dashboard</h1>
          <p className="mt-2 break-all font-mono text-xs text-blue-100/80 sm:text-sm">{address}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={<Layers className="h-5 w-5" />} label="My Campaigns" value={String(created.length)} loading={loading} />
        <StatCard icon={<Flag className="h-5 w-5" />} label="My Contributions" value={String(funded.length)} hint="Campaigns funded" loading={loading || pos.loading} />
        <StatCard icon={<Coins className="h-5 w-5" />} label="Total ETH Contributed" value={`${fmtEth(totalContributed)} ETH`} hint="Active balance in contract" loading={loading || pos.loading} />
        <StatCard icon={<Vote className="h-5 w-5" />} label="Pending Votes" value={String(pos.pendingVotes.length)} loading={loading || pos.loading} />
      </div>

      {error && <ErrorState message={error} onRetry={() => void refresh()} />}

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-800">Pending Approvals</h2>
        {pos.pendingVotes.length === 0 ? (
          <EmptyState icon={<Vote className="h-7 w-7" />} title="No votes waiting" description="When an owner requests a milestone release on a campaign you funded, it shows up here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pos.pendingVotes.map((p) => (
              <div key={`${p.campaign.id}-${p.milestone.index}`} className="glass p-5">
                <p className="text-xs text-slate-500">Campaign #{p.campaign.id}</p>
                <p className="font-bold text-slate-800">{p.campaign.title}</p>
                <p className="mt-1 text-sm text-slate-500">Milestone {p.milestone.index + 1}: {p.milestone.title} · {fmtEth(p.milestone.amount)} ETH</p>
                <Link to={`/campaigns/${p.campaign.id}/milestones`} className="btn-primary mt-4">Review &amp; Vote</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-800">Campaigns I Created</h2>
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>
        ) : created.length === 0 ? (
          <EmptyState title="You haven't created a campaign" action={<Link to="/create" className="btn-primary">Start a Campaign</Link>} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">{created.map((c) => <CampaignCard key={c.id} campaign={c} />)}</div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-800">Campaigns I Funded</h2>
        {funded.length === 0 ? (
          <EmptyState title="No active contributions" action={<Link to="/campaigns" className="btn-primary">Explore Campaigns</Link>} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">{funded.map((c) => <CampaignCard key={c.id} campaign={c} />)}</div>
        )}
      </section>

      <section className="glass overflow-hidden">
        <h2 className="p-6 pb-3 text-xl font-bold text-slate-800">Recent Transactions</h2>
        {txs.error ? (
          <p className="p-6 text-sm text-red-600">{txs.error}</p>
        ) : recent.length === 0 ? (
          <p className="p-6 pt-0 text-sm text-slate-500">{txs.loading ? 'Reading contract events…' : 'No on-chain activity for this wallet yet.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead><tr><th className="th">Type</th><th className="th">Campaign</th><th className="th">Amount</th><th className="th">Date</th><th className="th">Tx</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className="td">{r.type}</td>
                    <td className="td"><Link className="text-electric hover:underline" to={`/campaigns/${r.campaignId}`}>#{r.campaignId}</Link></td>
                    <td className="td">{r.amount !== undefined ? `${fmtEth(r.amount)} ETH` : '—'}</td>
                    <td className="td text-slate-500">{formatDate(r.timestamp)}</td>
                    <td className="td"><a className="text-electric hover:underline" href={txUrl(r.txHash)} target="_blank" rel="noopener noreferrer">{shortAddr(r.txHash)}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </SidebarLayout>
  );
}
