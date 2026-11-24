import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Flag, Undo2, Users } from 'lucide-react';
import { useCampaign } from '../hooks/useCampaigns';
import { useTransactions } from '../hooks/useTransactions';
import { useWallet } from '../hooks/useWallet';
import { CampaignStatus, MilestoneStatus } from '../types';
import { addressUrl, txUrl } from '../config/contract';
import { eq, fmtEth, formatDate, pct, shortAddr, timeLeft } from '../utils/format';
import FundingProgress from '../components/campaigns/FundingProgress';
import ContributionForm from '../components/campaigns/ContributionForm';
import { MilestoneBadge, StatusBadge } from '../components/campaigns/StatusBadge';
import LoadingSpinner, { Skeleton } from '../components/ui/LoadingSpinner';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';

const dot: Record<MilestoneStatus, string> = {
  [MilestoneStatus.NotRequested]: 'bg-slate-500',
  [MilestoneStatus.Pending]: 'bg-amber-500',
  [MilestoneStatus.Released]: 'bg-emerald-500',
  [MilestoneStatus.Rejected]: 'bg-red-500',
};

export default function CampaignDetails() {
  const { id } = useParams();
  const cid = Number(id);
  const { campaign: c, milestones, contributors, transparency, loading, error, refresh } = useCampaign(cid);
  const txs = useTransactions({ campaignId: cid });
  const { address } = useWallet();

  if (loading && !c) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <LoadingSpinner label="Loading campaign from the blockchain…" />
      </div>
    );
  }
  if (error || !c) return <ErrorState message={error ?? 'Campaign not found.'} onRetry={() => void refresh()} />;

  const isOwner = eq(address, c.owner);
  const mine = contributors.find((x) => eq(x.address, address));

  return (
    <div className="space-y-6">
      <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> All campaigns</Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <section className="glass p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={c.status} />
              <span className="text-xs text-slate-500">Campaign #{c.id}</span>
              {isOwner && <span className="badge border-electric/30 bg-electric/10 text-electric">You are the owner</span>}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold text-slate-800">{c.title}</h1>
            <p className="mt-3 whitespace-pre-line break-words text-slate-600">{c.description || 'No description provided.'}</p>
            <p className="mt-4 text-sm text-slate-500">
              Owner:{' '}
              <a href={addressUrl(c.owner)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-electric hover:underline">
                {c.owner} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
            <div className="mt-6"><FundingProgress raised={c.raised} goal={c.goal} large /></div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['Goal', `${fmtEth(c.goal)} ETH`],
                ['Raised', `${fmtEth(c.raised)} ETH`],
                ['Time', c.status === CampaignStatus.Funding ? timeLeft(c.deadline) : c.status === CampaignStatus.Failed ? 'Ended' : 'Funding closed'],
                ['Contributors', String(transparency?.contributorCount ?? contributors.length)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{k}</p>
                  <p className="mt-1 font-bold text-slate-800">{v}</p>
                </div>
              ))}
            </div>
            {transparency && (
              <p className="mt-4 text-sm text-slate-500">
                Released to owner: <b className="text-emerald-700">{fmtEth(transparency.totalReleased)} ETH</b> · Locked in contract: <b className="text-emerald-700">{fmtEth(transparency.balance)} ETH</b>
                {transparency.totalRefunded > 0n && <> · Refunded: <b className="text-red-600">{fmtEth(transparency.totalRefunded)} ETH</b></>}
              </p>
            )}
          </section>

          <section className="glass p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Milestone Timeline</h2>
              <Link to={`/campaigns/${c.id}/milestones`} className="btn-ghost !py-1.5 !text-xs"><Flag className="h-3.5 w-3.5" /> Manage / Vote</Link>
            </div>
            <ol className="relative space-y-5 border-l border-slate-200 pl-6">
              {milestones.map((m) => (
                <li key={m.index} className="relative">
                  <span className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${dot[m.status]}`} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800">{m.index + 1}. {m.title}</p>
                    <div className="flex items-center gap-3"><span className="text-sm font-semibold text-emerald-700">{fmtEth(m.amount)} ETH</span><MilestoneBadge status={m.status} /></div>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{m.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="glass p-6 sm:p-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800"><Users className="h-5 w-5 text-electric" /> Contributors</h2>
            {contributors.length === 0 ? (
              <EmptyState title="No contributors yet" description="Be the first to back this project." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {contributors.map((x) => (
                  <li key={x.address} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <a href={addressUrl(x.address)} target="_blank" rel="noopener noreferrer" className="font-mono text-slate-600 hover:text-electric">
                      {shortAddr(x.address)} {eq(x.address, address) && <span className="ml-1 text-xs text-emerald-700">(you)</span>}
                    </a>
                    <span className="text-slate-500">{pct(x.amount, c.raised).toFixed(1)}% · <b className="text-slate-800">{fmtEth(x.amount)} ETH</b></span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-500">Amounts show each wallet&apos;s current balance in the contract (refunded wallets drop to 0).</p>
          </section>

          <section className="glass overflow-hidden">
            <h2 className="p-6 pb-3 text-xl font-bold text-slate-800">Transaction History</h2>
            {txs.loading ? (
              <LoadingSpinner label="Reading contract events…" />
            ) : txs.error ? (
              <div className="p-6"><ErrorState message={txs.error} onRetry={() => void txs.refresh()} /></div>
            ) : txs.records.length === 0 ? (
              <div className="p-6"><EmptyState title="No on-chain events yet" description="Events appear here after the first transaction." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead><tr><th className="th">Type</th><th className="th">Wallet</th><th className="th">Amount</th><th className="th">Date</th><th className="th">Tx</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {txs.records.slice(0, 25).map((r) => (
                      <tr key={r.id}>
                        <td className="td">{r.type}{r.detail ? <span className="block text-xs text-slate-500">{r.detail}</span> : null}</td>
                        <td className="td font-mono text-xs">{shortAddr(r.address)}</td>
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
        </div>

        <aside className="space-y-6">
          <div className="xl:sticky lg:top-24 space-y-6">
            <ContributionForm campaign={c} onDone={() => { void refresh(); void txs.refresh(); }} />
            {mine && mine.amount > 0n && (
              <div className="glass p-5 text-sm text-slate-600">
                Your contribution: <b className="text-slate-800">{fmtEth(mine.amount)} ETH</b> ({pct(mine.amount, c.raised).toFixed(1)}% voting weight)
              </div>
            )}
            {c.status === CampaignStatus.Failed && (
              <div className="glass border-red-500/30 p-5">
                <p className="text-sm text-slate-600">This campaign missed its goal. Contributors can reclaim their ETH.</p>
                <Link to="/refunds" className="btn-danger mt-3 w-full"><Undo2 className="h-4 w-4" /> Go to Refunds</Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
