import { useState } from 'react';
import { ExternalLink, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { Campaign, Milestone } from '../../types';
import { CampaignStatus, MilestoneStatus } from '../../types';
import { fmtEth, pct, toHttpUrl, validateEvidenceUrl } from '../../utils/format';
import { MilestoneBadge } from './StatusBadge';

interface Props {
  milestone: Milestone;
  campaign: Campaign;
  isOwner: boolean;
  myWeight: bigint;
  hasVoted: boolean;
  busy: boolean;
  onRequest: (index: number, evidenceUrl: string) => void;
  onVote: (index: number, support: boolean) => void;
}

export default function MilestoneCard({ milestone: m, campaign, isOwner, myWeight, hasVoted, busy, onRequest, onVote }: Props) {
  const [url, setUrl] = useState('');
  const total = campaign.raised;
  const approvePct = pct(m.approveWeight, total);
  const rejectPct = pct(m.rejectWeight, total);
  const active = campaign.status === CampaignStatus.Successful;
  const isNext = m.index === campaign.releasedCount;

  const canRequest = isOwner && active && isNext && (m.status === MilestoneStatus.NotRequested || m.status === MilestoneStatus.Rejected);
  const canVote = active && m.status === MilestoneStatus.Pending && myWeight > 0n && !hasVoted;
  const urlError = url.trim() ? validateEvidenceUrl(url) : null;
  const link = m.evidenceUrl ? toHttpUrl(m.evidenceUrl) : '';

  return (
    <div className="glass animate-fadeUp p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-purple font-bold text-white">{m.index + 1}</div>
          <div>
            <h4 className="text-lg font-bold text-white">{m.title}</h4>
            <p className="mt-1 text-sm text-slate-400">{m.description || '—'}</p>
          </div>
        </div>
        <div className="text-right">
          <MilestoneBadge status={m.status} />
          <p className="mt-2 text-sm font-semibold text-cyan-300">{fmtEth(m.amount)} ETH</p>
        </div>
      </div>

      {m.evidenceUrl && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-400">Evidence:</span>
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-electric hover:underline">
              {m.evidenceUrl} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ) : (
            <span className="break-all text-slate-300">{m.evidenceUrl}</span>
          )}
        </p>
      )}

      {(m.status === MilestoneStatus.Pending || m.status === MilestoneStatus.Rejected || m.status === MilestoneStatus.Released) && (
        <div className="mt-5">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="bg-emerald-400 transition-all" style={{ width: `${approvePct}%` }} />
            <div className="bg-rose-400 transition-all" style={{ width: `${rejectPct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
            <span className="text-emerald-300">Approve {approvePct.toFixed(1)}% ({fmtEth(m.approveWeight)} ETH)</span>
            <span className="text-slate-500">Needs &gt; 50%</span>
            <span className="text-rose-300">Reject {rejectPct.toFixed(1)}% ({fmtEth(m.rejectWeight)} ETH)</span>
          </div>
        </div>
      )}

      {canVote && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
          <span className="text-sm text-slate-400">Your voting weight: <b className="text-white">{fmtEth(myWeight)} ETH</b> ({pct(myWeight, total).toFixed(1)}%)</span>
          <div className="ml-auto flex gap-2">
            <button className="btn-success" disabled={busy} onClick={() => onVote(m.index, true)}><ThumbsUp className="h-4 w-4" /> Approve</button>
            <button className="btn-danger" disabled={busy} onClick={() => onVote(m.index, false)}><ThumbsDown className="h-4 w-4" /> Reject</button>
          </div>
        </div>
      )}
      {active && m.status === MilestoneStatus.Pending && myWeight > 0n && hasVoted && (
        <p className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-400">You have already voted on this milestone.</p>
      )}
      {active && m.status === MilestoneStatus.Pending && myWeight === 0n && !isOwner && (
        <p className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-500">Only contributors of this campaign can vote.</p>
      )}

      {canRequest && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <label className="label" htmlFor={`ev-${m.index}`}>
            {m.status === MilestoneStatus.Rejected ? 'Submit new evidence (previous request was rejected)' : 'Evidence URL (https:// or ipfs://)'}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id={`ev-${m.index}`} className="input" placeholder="ipfs://Qm…" value={url} onChange={(e) => setUrl(e.target.value)} />
            <button className="btn-primary shrink-0" disabled={busy || !url.trim() || !!urlError} onClick={() => onRequest(m.index, url.trim())}>
              Request Fund Release
            </button>
          </div>
          {urlError && <p className="mt-2 text-sm text-rose-300">{urlError}</p>}
        </div>
      )}
      {isOwner && active && !isNext && m.status === MilestoneStatus.NotRequested && (
        <p className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-500">Milestones must be completed in order.</p>
      )}
    </div>
  );
}
