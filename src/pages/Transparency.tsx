import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatEther } from 'ethers';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Coins, ExternalLink, Lock, Send, Undo2 } from 'lucide-react';
import { useCampaigns, useFinancials } from '../hooks/useCampaigns';
import { useTransactions } from '../hooks/useTransactions';
import { txUrl } from '../config/contract';
import { fmtEth, formatDate, pct, shortAddr } from '../utils/format';
import type { TxType } from '../types';
import { SidebarLayout } from '../components/layout/Sidebar';
import StatCard from '../components/ui/StatCard';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const num = (v: bigint) => Number(formatEther(v));
const tip = { contentStyle: { background: '#0f1830', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0' } };
const axis = { stroke: '#64748b', fontSize: 12 };

const TABS: { key: string; label: string; types: TxType[] | null }[] = [
  { key: 'all', label: 'All', types: null },
  { key: 'in', label: 'Funding', types: ['Contribution'] },
  { key: 'rel', label: 'Milestone Releases', types: ['Release', 'MilestoneRequest', 'Vote'] },
  { key: 'ref', label: 'Refunds', types: ['Refund'] },
];

export default function Transparency() {
  const { campaigns, loading, error, refresh } = useCampaigns();
  const { rows, loading: rowsLoading } = useFinancials(campaigns);
  const txs = useTransactions();
  const [tab, setTab] = useState('all');
  const [limit, setLimit] = useState(25);

  const totals = useMemo(
    () => ({
      raised: rows.reduce((s, r) => s + r.transparency.totalIn, 0n),
      released: rows.reduce((s, r) => s + r.transparency.totalReleased, 0n),
      refunded: rows.reduce((s, r) => s + r.transparency.totalRefunded, 0n),
      locked: rows.reduce((s, r) => s + r.transparency.balance, 0n),
    }),
    [rows],
  );

  const pie = [
    { name: 'Locked', value: num(totals.locked), color: '#22d3ee' },
    { name: 'Released', value: num(totals.released), color: '#2f6bff' },
    { name: 'Refunded', value: num(totals.refunded), color: '#8b5cf6' },
  ].filter((p) => p.value > 0);

  const bars = rows.map((r) => ({ name: `#${r.campaign.id}`, Raised: num(r.transparency.totalIn), Released: num(r.transparency.totalReleased) }));
  const progress = rows.map((r) => ({ name: `#${r.campaign.id}`, Progress: pct(r.campaign.raised, r.campaign.goal) }));

  const filtered = useMemo(() => {
    const t = TABS.find((x) => x.key === tab)?.types;
    return t ? txs.all.filter((r) => t.includes(r.type)) : txs.all;
  }, [txs.all, tab]);

  return (
    <SidebarLayout>
      <div>
        <h1 className="section-title">Funding Transparency</h1>
        <p className="mt-1 text-slate-400">Every number is computed from contract state and events — verifiable on Sepolia Etherscan.</p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard icon={<Coins className="h-5 w-5" />} label="Total Funds Raised" value={`${fmtEth(totals.raised)} ETH`} loading={loading || rowsLoading} />
            <StatCard icon={<Send className="h-5 w-5" />} label="Funds Released" value={`${fmtEth(totals.released)} ETH`} loading={loading || rowsLoading} />
            <StatCard icon={<Lock className="h-5 w-5" />} label="Remaining Locked" value={`${fmtEth(totals.locked)} ETH`} loading={loading || rowsLoading} />
            <StatCard icon={<Undo2 className="h-5 w-5" />} label="Refunded Funds" value={`${fmtEth(totals.refunded)} ETH`} loading={loading || rowsLoading} />
          </div>

          {rows.length === 0 && !loading && !rowsLoading ? (
            <EmptyState title="No data to chart yet" description="Charts appear after the first campaign is created on the contract." action={<Link to="/create" className="btn-primary">Start a Campaign</Link>} />
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="glass p-5">
                <h3 className="mb-3 font-bold text-white">Funding Overview</h3>
                {pie.length === 0 ? (
                  <p className="py-16 text-center text-sm text-slate-500">No funds yet.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} stroke="none">
                          {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
                        </Pie>
                        <Tooltip {...tip} formatter={(v) => `${v} ETH`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="glass p-5">
                <h3 className="mb-3 font-bold text-white">Funds Raised vs Released (ETH)</h3>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={bars}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="name" {...axis} />
                      <YAxis {...axis} />
                      <Tooltip {...tip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <Legend />
                      <Bar dataKey="Raised" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Released" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass p-5 xl:col-span-2">
                <h3 className="mb-3 font-bold text-white">Campaign Funding Progress (%)</h3>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={progress}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="name" {...axis} />
                      <YAxis domain={[0, 100]} {...axis} />
                      <Tooltip {...tip} formatter={(v) => `${v}%`} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <Bar dataKey="Progress" fill="#2f6bff" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <section className="glass overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-3">
          <h2 className="text-xl font-bold text-white">Transactions</h2>
          <div className="flex gap-1 rounded-xl bg-white/5 p-1">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => { setTab(t.key); setLimit(25); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === t.key ? 'bg-electric text-white' : 'text-slate-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {txs.loading ? (
          <LoadingSpinner label="Reading contract events…" />
        ) : txs.error ? (
          <div className="p-6"><ErrorState message={txs.error} onRetry={() => void txs.refresh()} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6"><EmptyState title="No transactions" description="Events appear after contributions, votes, releases or refunds. Set VITE_DEPLOY_BLOCK so history starts at your contract's deployment block." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead><tr><th className="th">Type</th><th className="th">Campaign</th><th className="th">Wallet</th><th className="th">Amount (ETH)</th><th className="th">Date</th><th className="th">Tx Hash</th><th className="th">Status</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {filtered.slice(0, limit).map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.03]">
                    <td className="td">{r.type}{r.detail && <span className="block text-xs text-slate-500">{r.detail}</span>}</td>
                    <td className="td"><Link className="text-electric hover:underline" to={`/campaigns/${r.campaignId}`}>#{r.campaignId}</Link></td>
                    <td className="td font-mono text-xs">{shortAddr(r.address)}</td>
                    <td className="td">{r.amount !== undefined ? fmtEth(r.amount) : '—'}</td>
                    <td className="td text-slate-400">{formatDate(r.timestamp)}</td>
                    <td className="td"><a className="inline-flex items-center gap-1 text-electric hover:underline" href={txUrl(r.txHash)} target="_blank" rel="noopener noreferrer">{shortAddr(r.txHash)} <ExternalLink className="h-3 w-3" /></a></td>
                    <td className="td"><span className="badge border-emerald-400/30 bg-emerald-400/10 text-emerald-300">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > limit && <div className="p-4 text-center"><button className="btn-ghost" onClick={() => setLimit((l) => l + 25)}>Show more</button></div>}
          </div>
        )}
      </section>
    </SidebarLayout>
  );
}
