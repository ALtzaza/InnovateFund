import { CampaignStatus, MilestoneStatus } from '../../types';
import { CAMPAIGN_STATUS_LABEL, MILESTONE_STATUS_LABEL } from '../../utils/format';

const campaignClass: Record<CampaignStatus, string> = {
  [CampaignStatus.Funding]: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  [CampaignStatus.Successful]: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  [CampaignStatus.Failed]: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  [CampaignStatus.Completed]: 'border-purple-400/30 bg-purple-400/10 text-purple-300',
};

const milestoneClass: Record<MilestoneStatus, string> = {
  [MilestoneStatus.NotRequested]: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  [MilestoneStatus.Pending]: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  [MilestoneStatus.Released]: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  [MilestoneStatus.Rejected]: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return <span className={`badge ${campaignClass[status]}`}>{CAMPAIGN_STATUS_LABEL[status]}</span>;
}

export function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  return <span className={`badge ${milestoneClass[status]}`}>{MILESTONE_STATUS_LABEL[status]}</span>;
}
