export enum CampaignStatus {
  Funding = 0,
  Successful = 1,
  Failed = 2,
  Completed = 3,
}

export enum MilestoneStatus {
  NotRequested = 0,
  Pending = 1,
  Released = 2,
  Rejected = 3,
}

export interface Campaign {
  id: number;
  owner: string;
  title: string;
  description: string;
  goal: bigint;
  raised: bigint;
  deadline: bigint;
  status: CampaignStatus;
  milestoneCount: number;
  releasedCount: number;
}

export interface Milestone {
  index: number;
  title: string;
  description: string;
  amount: bigint;
  evidenceUrl: string;
  status: MilestoneStatus;
  approveWeight: bigint;
  rejectWeight: bigint;
  round: bigint;
}

export interface Transparency {
  totalIn: bigint;
  totalReleased: bigint;
  totalRefunded: bigint;
  balance: bigint;
  contributorCount: number;
}

export interface ContributorEntry {
  address: string;
  amount: bigint;
}

export type TxType =
  | 'CampaignCreated'
  | 'Contribution'
  | 'Vote'
  | 'MilestoneRequest'
  | 'Release'
  | 'Refund';

export interface TxRecord {
  id: string;
  type: TxType;
  campaignId: number;
  address: string;
  amount?: bigint;
  detail?: string;
  blockNumber: number;
  txHash: string;
  timestamp?: number;
  status: 'Confirmed';
}
