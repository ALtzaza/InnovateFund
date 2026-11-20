import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatEther } from 'ethers';
import toast from 'react-hot-toast';
import { useCampaign } from '../hooks/useCampaigns';
import { useWallet } from '../hooks/useWallet';
import { useTxFlow } from '../hooks/useTxFlow';
import { fetchContribution, fetchHasVoted, getWriteContract } from '../services/blockchain';
import { CampaignStatus, MilestoneStatus } from '../types';
import { eq, fmtEth, pct, validateEvidenceUrl } from '../utils/format';
import MilestoneCard from '../components/campaigns/MilestoneCard';
import { StatusBadge } from '../components/campaigns/StatusBadge';
import TransactionModal from '../components/ui/TransactionModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';

export default function Milestones() {
  const { id } = useParams();
  const cid = Number(id);
  const { campaign: c, milestones, loading, error, refresh } = useCampaign(cid);
  const wallet = useWallet();
  const flow = useTxFlow();
  const [myWeight, setMyWeight] = useState<bigint>(0n);
  const [voted, setVoted] = useState<Record<number, boolean>>({});

  // Contributor eligibility + vote status are read from the contract for the connected wallet.
  useEffect(() => {
    let cancelled = false;
    if (!wallet.address || !c) {
      setMyWeight(0n);
      setVoted({});
      return;
    }
    const addr = wallet.address;
    (async () => {
      const w = await fetchContribution(c.id, addr);
      const entries = await Promise.all(
        milestones.filter((m) => m.status === MilestoneStatus.Pending).map(async (m) => [m.index, await fetchHasVoted(c.id, m.index, addr)] as const),
      );
      if (!cancelled) {
        setMyWeight(w);
        setVoted(Object.fromEntries(entries));
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [wallet.address, c, milestones]);

  if (loading && !c) return <LoadingSpinner label="Loading milestones…" />;
  if (error || !c) return <ErrorState message={error ?? 'Campaign not found.'} onRetry={() => void refresh()} />;

  const isOwner = eq(wallet.address, c.owner);
  const ready = wallet.isConnected && wallet.isCorrectNetwork;

  const handleRequest = (index: number, url: string) => {
    const err = validateEvidenceUrl(url);
    if (err) return void toast.error(err);
    if (!ready) return void toast.error('Connect your wallet on Sepolia first.');
    const m = milestones[index];
    flow.open({
      title: 'Request fund release',
      description: 'Contributors will be able to vote on this evidence. Funds are paid automatically once approvals exceed 50%.',
      details: [
        { label: 'Campaign', value: `#${c.id} · ${c.title}` },
        { label: 'Milestone', value: `${index + 1}. ${m.title}` },
        { label: 'Amount', value: `${formatEther(m.amount)} ETH` },
        { label: 'Evidence', value: url },
      ],
      confirmLabel: 'Submit Request',
      send: async () => getWriteContract(await wallet.getSigner()).requestMilestoneRelease(c.id, index, url),
      onConfirmed: () => refresh(),
    });
  };

  const handleVote = (index: number, support: boolean) => {
    if (!ready) return void toast.error('Connect your wallet on Sepolia first.');
    const m = milestones[index];
    flow.open({
      title: support ? 'Approve milestone' : 'Reject milestone',
      description: 'Your vote is weighted by your contribution and cannot be changed afterwards. If approvals exceed 50%, the contract pays the owner in this same transaction.',
      details: [
        { label: 'Campaign', value: `#${c.id} · ${c.title}` },
        { label: 'Milestone', value: `${index + 1}. ${m.title}` },
        { label: 'Your weight', value: `${formatEther(myWeight)} ETH (${pct(myWeight, c.raised).toFixed(1)}%)` },
        { label: 'Vote', value: support ? 'Approve' : 'Reject' },
      ],
      confirmLabel: support ? 'Approve' : 'Reject',
      send: async () => getWriteContract(await wallet.getSigner()).voteMilestone(c.id, index, support),
      onConfirmed: () => refresh(),
    });
  };

  const released = milestones.filter((m) => m.status === MilestoneStatus.Released).length;

  return (
    <div className="space-y-6">
      <Link to={`/campaigns/${c.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to campaign</Link>
      <div className="glass flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{c.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {released}/{milestones.length} milestones released · Total funded {fmtEth(c.raised)} ETH
            {myWeight > 0n && <> · Your weight <b className="text-cyan-300">{pct(myWeight, c.raised).toFixed(1)}%</b></>}
          </p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {c.status === CampaignStatus.Funding && <p className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm text-cyan-200">Milestones unlock once the campaign reaches its funding goal.</p>}
      {c.status === CampaignStatus.Failed && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">This campaign failed. No milestone can be released; contributors can claim refunds.</p>}
      {!wallet.isConnected && <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">Connect your wallet to request releases or vote.</p>}

      {milestones.length === 0 ? (
        <EmptyState title="No milestones" />
      ) : (
        <div className="space-y-4">
          {milestones.map((m) => (
            <MilestoneCard
              key={m.index}
              milestone={m}
              campaign={c}
              isOwner={isOwner}
              myWeight={myWeight}
              hasVoted={!!voted[m.index]}
              busy={flow.isBusy}
              onRequest={handleRequest}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
      <TransactionModal flow={flow} />
    </div>
  );
}
