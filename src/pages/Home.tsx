import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Coins, Flag, Lock, Rocket, ShieldCheck, Users, Vote, Wallet, CheckCircle2, Layers } from 'lucide-react';
import { useCampaigns, useFinancials } from '../hooks/useCampaigns';
import { CampaignStatus } from '../types';
import { fmtEth } from '../utils/format';
import StatCard from '../components/ui/StatCard';
import Reveal from '../components/ui/Reveal';
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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-900 to-electric px-6 pb-24 pt-14 shadow-lift sm:px-12 sm:pb-28 sm:pt-20">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 animate-float rounded-full bg-electric/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 animate-float rounded-full bg-brand/15 blur-3xl [animation-delay:3s]" />
        <div className="relative grid items-center gap-12 xl:grid-cols-[1.2fr_1fr]">
          <div className="animate-fadeUp">
            <span className="badge border-white/15 bg-white/10 text-emerald-300 backdrop-blur"><ShieldCheck className="h-3.5 w-3.5" /> Secured by Ethereum smart contracts</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight !text-white sm:text-6xl">
              Fund Innovation.<br />
              <span className="text-emerald-400">Build the Future.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-blue-100/80">
              A decentralized crowdfunding platform powered by Ethereum, where funding is secured and released through verified milestones.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/campaigns" className="btn bg-white !px-5 !py-3 text-navy-900 shadow-lg shadow-black/20 hover:bg-blue-50">Explore Campaigns <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/create" className="btn border border-white/25 !px-5 !py-3 text-white hover:bg-white/10">Start a Campaign</Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100/70">
              {['Funds locked in the contract', 'Milestone-based payouts', 'Full refund if goal is missed'].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="relative hidden animate-fadeUp xl:block">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-blue-100/60">How funds flow</p>
              <div className="space-y-3">
                {[
                  { icon: Wallet, t: 'Backers contribute ETH' },
                  { icon: Lock, t: 'Funds locked in the contract' },
                  { icon: Vote, t: 'Backers vote on each milestone' },
                  { icon: Coins, t: 'Contract releases the payout' },
                ].map(({ icon: Icon, t }, i) => (
                  <div key={t} className="flex items-center gap-4 rounded-xl bg-white p-3.5 shadow-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-electric"><Icon className="h-5 w-5" /></span>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Step {i + 1}</p>
                      <p className="font-semibold text-slate-800">{t}</p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-brand" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats (overlaps hero) */}
      <section className="relative z-10 -mt-32 grid grid-cols-2 gap-4 px-2 sm:px-6 xl:grid-cols-4">
        <StatCard icon={<Layers className="h-5 w-5" />} label="Total Campaigns" value={String(campaigns.length)} loading={loading} />
        <StatCard icon={<Coins className="h-5 w-5" />} label="Total ETH Raised" value={`${fmtEth(stats.raised)} ETH`} loading={loading} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Successfully Funded" value={String(stats.funded)} loading={loading} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Contributors" value={String(stats.contributors)} hint="Unique wallets" loading={loading || rowsLoading} />
      </section>

      {/* Featured */}
      <Reveal>
        <section>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Opportunities</p>
              <h2 className="section-title mt-1">Featured Campaigns</h2>
            </div>
            <Link to="/campaigns" className="inline-flex items-center gap-1 text-sm font-semibold text-electric hover:underline">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
          ) : loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
          ) : featured.length === 0 ? (
            <EmptyState title="No campaigns yet" description="Campaigns are read directly from the smart contract. Create the first one!" action={<Link to="/create" className="btn-primary">Start a Campaign</Link>} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{featured.map((c) => <CampaignCard key={c.id} campaign={c} />)}</div>
          )}
        </section>
      </Reveal>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24">
        <Reveal>
          <div className="text-center">
            <p className="eyebrow">Process</p>
            <h2 className="section-title mt-1">How It Works</h2>
          </div>
        </Reveal>
        <div className="relative mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-12 hidden border-t-2 border-dashed border-slate-200 xl:block" />
          {steps.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 90}>
              <div className="glass card-hover relative h-full p-6">
                <span className="absolute right-5 top-4 text-5xl font-black text-slate-100">{i + 1}</span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-brand shadow-sm"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-12 text-center sm:px-12">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative">
            <h2 className="text-2xl font-bold !text-white sm:text-3xl">Ready to launch your project?</h2>
            <p className="mx-auto mt-3 max-w-xl text-blue-100/70">Set a goal, define your milestones and let your backers release funds as you deliver.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/create" className="btn-primary !px-5 !py-3">Start a Campaign <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/transparency" className="btn border border-white/25 !px-5 !py-3 text-white hover:bg-white/10">View Transparency</Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
