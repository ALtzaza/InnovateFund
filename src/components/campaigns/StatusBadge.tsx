import { CampaignStatus, MilestoneStatus } from '../../types';
import { CAMPAIGN_STATUS_LABEL, MILESTONE_STATUS_LABEL } from '../../utils/format';

const campaignClass: Record<CampaignStatus, string> = {
  [CampaignStatus.Funding]: 'border-blue-600/30 bg-blue-600/10 text-blue-700',
  [CampaignStatus.Successful]: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  [CampaignStatus.Failed]: 'border-red-500/30 bg-red-500/10 text-red-600',
  [CampaignStatus.Completed]: 'border-slate-700/30 bg-slate-800/10 text-slate-800',
};

const milestoneClass: Record<MilestoneStatus, string> = {
  [MilestoneStatus.NotRequested]: 'border-slate-500/30 bg-slate-500/10 text-slate-600',
  [MilestoneStatus.Pending]: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  [MilestoneStatus.Released]: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  [MilestoneStatus.Rejected]: 'border-red-500/30 bg-red-500/10 text-red-600',
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return <span className={`badge ${campaignClass[status]}`}>{CAMPAIGN_STATUS_LABEL[status]}</span>;
}

export function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  return <span className={`badge ${milestoneClass[status]}`}>{MILESTONE_STATUS_LABEL[status]}</span>;
}
