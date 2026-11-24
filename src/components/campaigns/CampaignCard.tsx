import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { Campaign } from '../../types';
import { CampaignStatus } from '../../types';
import { daysLeftShort } from '../../utils/format';
import FundingProgress from './FundingProgress';
import { StatusBadge } from './StatusBadge';

export default function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const ended = c.status === CampaignStatus.Failed;
  return (
    <div className="glass card-hover flex h-full animate-fadeUp flex-col p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-lg font-bold text-slate-800">{c.title}</h3>
        <StatusBadge status={c.status} />
      </div>
      <p className="line-clamp-3 flex-1 text-sm text-slate-500">{c.description || 'No description provided.'}</p>
      <div className="mt-5">
        <FundingProgress raised={c.raised} goal={c.goal} />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {c.status === CampaignStatus.Funding || ended ? daysLeftShort(c.deadline) : 'Funding closed'}
        </span>
        <span>Campaign #{c.id}</span>
      </div>
      <Link to={`/campaigns/${c.id}`} className="btn-ghost mt-5 w-full">
        View Details <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
