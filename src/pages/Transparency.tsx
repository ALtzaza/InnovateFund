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
const tip = { contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, color: '#1E293B', boxShadow: '0 8px 24px -8px rgba(15,23,42,.18)' } };
const axis = { stroke: '#64748B', fontSize: 12 };

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
    { name: 'Locked', value: num(totals.locked), color: '#2563EB' },
    { name: 'Released', value: num(totals.released), color: '#10B981' },
    { name: 'Refunded', value: num(totals.refunded), color: '#F59E0B' },
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
        <p className="mt-1 text-slate-500">Every number is computed from contract state and events — verifiable on Sepolia Etherscan.</p>
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
                <h3 className="mb-3 font-bold text-slate-800">Funding Overview</h3>
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
                <h3 className="mb-3 font-bold text-slate-800">Funds Raised vs Released (ETH)</h3>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={bars}>
                      <CartesianGrid stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="name" {...axis} />
                      <YAxis {...axis} />
                      <Tooltip {...tip} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
                      <Legend />
                      <Bar dataKey="Raised" fill="#2563EB" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Released" fill="#10B981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass p-5 xl:col-span-2">
                <h3 className="mb-3 font-bold text-slate-800">Campaign Funding Progress (%)</h3>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={progress}>
                      <CartesianGrid stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="name" {...axis} />
                      <YAxis domain={[0, 100]} {...axis} />
                      <Tooltip {...tip} formatter={(v) => `${v}%`} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
                      <Bar dataKey="Progress" fill="#0F172A" radius={[6, 6, 0, 0]} />
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
          <h2 className="text-xl font-bold text-slate-800">Transactions</h2>
          <div className="flex gap-1 rounded-xl bg-slate-50 p-1">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => { setTab(t.key); setLimit(25); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === t.key ? 'bg-electric text-white' : 'text-slate-500 hover:text-slate-800'}`}>
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
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(0, limit).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="td">{r.type}{r.detail && <span className="block text-xs text-slate-500">{r.detail}</span>}</td>
                    <td className="td"><Link className="text-electric hover:underline" to={`/campaigns/${r.campaignId}`}>#{r.campaignId}</Link></td>
                    <td className="td font-mono text-xs">{shortAddr(r.address)}</td>
                    <td className="td">{r.amount !== undefined ? fmtEth(r.amount) : '—'}</td>
                    <td className="td text-slate-500">{formatDate(r.timestamp)}</td>
                    <td className="td"><a className="inline-flex items-center gap-1 text-electric hover:underline" href={txUrl(r.txHash)} target="_blank" rel="noopener noreferrer">{shortAddr(r.txHash)} <ExternalLink className="h-3 w-3" /></a></td>
                    <td className="td"><span className="badge border-emerald-500/30 bg-emerald-500/10 text-emerald-700">{r.status}</span></td>
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
