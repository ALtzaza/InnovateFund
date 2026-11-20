import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Coins, Flag, Lock, Rocket, ShieldCheck, Users, Vote, Wallet, CheckCircle2, Layers } from 'lucide-react';
import { useCampaigns, useFinancials } from '../hooks/useCampaigns';
import { CampaignStatus } from '../types';
import { fmtEth } from '../utils/format';
import StatCard from '../components/ui/StatCard';
import CampaignCard from '../components/campaigns/CampaignCard';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';

const steps = [
  { icon: Rocket, title: 'Create a Campaign', text: 'Owners define a goal, a deadline and milestones with a fixed ETH allocation each.' },
  { icon: Wallet, title: 'Fund a Project', text: 'Backers send ETH straight to the smart contract. Nobody can touch it directly.' },
  { icon: Flag, title: 'Complete Milestones', text: 'The owner submits evidence (e.g. an IPFS link) for each milestone, in order.' },
  { icon: Vote, title: 'Vote & Release Funds', text: 'Backers vote weighted by ETH. Above 50% approval, the contract pays the milestone.' },
];

export default function Home() {
  const { hash } = useLocation();
  const { campaigns, loading, error, refresh } = useCampaigns();
  const { rows, loading: rowsLoading } = useFinancials(campaigns);

  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [hash]);

  const stats = useMemo(() => {
    const raised = campaigns.reduce((s, c) => s + c.raised, 0n);
    const funded = campaigns.filter((c) => c.status === CampaignStatus.Successful || c.status === CampaignStatus.Completed).length;
    const unique = new Set(rows.flatMap((r) => r.contributors.map((a) => a.toLowerCase())));
    return { raised, funded, contributors: unique.size };
  }, [campaigns, rows]);

  const featured = useMemo(() => {
    const open = campaigns.filter((c) => c.status === CampaignStatus.Funding);
    return (open.length ? open : campaigns).slice().sort((a, b) => (b.raised > a.raised ? 1 : -1)).slice(0, 3);
  }, [campaigns]);

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-navy-800/80 to-navy-900/80 px-6 py-16 sm:px-12 sm:py-24">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 animate-float rounded-full bg-electric/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 animate-float rounded-full bg-purple/25 blur-3xl [animation-delay:2s]" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="animate-fadeUp">
            <span className="badge border-cyan-400/30 bg-cyan-400/10 text-cyan-300"><ShieldCheck className="h-3.5 w-3.5" /> Secured by Ethereum smart contracts</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              Fund Innovation. <span className="gradient-text">Build the Future.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              A decentralized crowdfunding platform powered by Ethereum, where funding is secured and released through verified milestones.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/campaigns" className="btn-primary">Explore Campaigns <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/create" className="btn-ghost">Start a Campaign</Link>
            </div>
          </div>
          <div className="relative hidden animate-fadeUp lg:block">
            <div className="glass space-y-3 p-6">
              {[
                { icon: Wallet, t: 'Backers contribute ETH', c: 'text-cyan-300' },
                { icon: Lock, t: 'Funds locked in the contract', c: 'text-electric' },
                { icon: Vote, t: 'Backers vote on each milestone', c: 'text-purple-400' },
                { icon: Coins, t: 'Contract releases the payout', c: 'text-emerald-300' },
              ].map(({ icon: Icon, t, c }, i) => (
                <div key={t} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${c}`}><Icon className="h-5 w-5" /></span>
                  <div>
                    <p className="text-xs text-slate-500">Step {i + 1}</p>
                    <p className="font-semibold text-white">{t}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Layers className="h-5 w-5" />} label="Total Campaigns" value={String(campaigns.length)} loading={loading} />
        <StatCard icon={<Coins className="h-5 w-5" />} label="Total ETH Raised" value={`${fmtEth(stats.raised)} ETH`} loading={loading} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Successfully Funded" value={String(stats.funded)} loading={loading} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Contributors" value={String(stats.contributors)} hint="Unique wallets" loading={loading || rowsLoading} />
      </section>

      {/* Featured */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="section-title">Featured Campaigns</h2>
          <Link to="/campaigns" className="text-sm font-semibold text-electric hover:underline">View all →</Link>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={() => void refresh()} />
        ) : loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
        ) : featured.length === 0 ? (
          <EmptyState title="No campaigns yet" description="Campaigns are read directly from the smart contract. Create the first one!" action={<Link to="/create" className="btn-primary">Start a Campaign</Link>} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{featured.map((c) => <CampaignCard key={c.id} campaign={c} />)}</div>
        )}
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24">
        <h2 className="section-title text-center">How It Works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="glass card-hover relative p-6">
              <span className="absolute right-5 top-4 text-5xl font-black text-white/5">{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-electric to-purple"><Icon className="h-6 w-6" /></span>
              <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
