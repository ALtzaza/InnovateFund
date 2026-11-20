import {
  BrowserProvider,
  Contract,
  ContractTransactionReceipt,
  Interface,
  InterfaceAbi,
  JsonRpcProvider,
  Log,
  Network,
  Provider,
  Signer,
  isError,
} from 'ethers';
import abi from '../contracts/InnovateFundABI.json';
import {
  CONTRACT_ADDRESS,
  DEPLOY_BLOCK,
  IS_CONTRACT_CONFIGURED,
  LOG_BLOCK_RANGE,
  SEPOLIA,
  SEPOLIA_RPC_URL,
} from '../config/contract';
import { parseMilestoneText } from '../utils/format';
import type { Campaign, CampaignStatus, Milestone, MilestoneStatus, Transparency, TxRecord } from '../types';

const ABI = abi as unknown as InterfaceAbi;
export const iface = new Interface(ABI);

/* ----------------------------- providers ----------------------------- */

let readProvider: Provider | null | undefined;
export function getReadProvider(): Provider | null {
  if (readProvider !== undefined) return readProvider;
  if (SEPOLIA_RPC_URL) {
    readProvider = new JsonRpcProvider(SEPOLIA_RPC_URL, SEPOLIA.chainId, {
      staticNetwork: Network.from(SEPOLIA.chainId),
    });
  } else if (typeof window !== 'undefined' && window.ethereum) {
    readProvider = new BrowserProvider(window.ethereum);
  } else {
    readProvider = null;
  }
  return readProvider;
}

let readContract: Contract | null | undefined;
export function getReadContract(): Contract | null {
  if (readContract !== undefined) return readContract;
  const provider = getReadProvider();
  readContract = IS_CONTRACT_CONFIGURED && provider ? new Contract(CONTRACT_ADDRESS, ABI, provider) : null;
  return readContract;
}

function requireRead(): Contract {
  const c = getReadContract();
  if (!c) {
    throw new Error('No contract/provider available. Set VITE_CONTRACT_ADDRESS and VITE_SEPOLIA_RPC_URL in .env');
  }
  return c;
}

export function getWriteContract(signer: Signer): Contract {
  return new Contract(CONTRACT_ADDRESS, ABI, signer);
}

/* ------------------------------ mappers ------------------------------ */

/* eslint-disable @typescript-eslint/no-explicit-any */
const toCampaign = (r: any): Campaign => ({
  id: Number(r.id),
  owner: r.owner as string,
  title: r.title as string,
  description: r.description as string,
  goal: r.goal as bigint,
  raised: r.raised as bigint,
  deadline: r.deadline as bigint,
  status: Number(r.status) as CampaignStatus,
  milestoneCount: Number(r.milestoneCount),
  releasedCount: Number(r.releasedCount),
});

const toMilestone = (m: any, index: number): Milestone => {
  const { title, description } = parseMilestoneText(m.description as string, index);
  return {
    index,
    title,
    description,
    amount: m.amount as bigint,
    evidenceUrl: m.evidenceUrl as string,
    status: Number(m.status) as MilestoneStatus,
    approveWeight: m.approveWeight as bigint,
    rejectWeight: m.rejectWeight as bigint,
    round: m.round as bigint,
  };
};

/* ------------------------------- reads -------------------------------- */

export async function fetchCampaign(id: number): Promise<Campaign> {
  return toCampaign(await requireRead().getCampaignDetails(id));
}

export async function fetchAllCampaigns(): Promise<Campaign[]> {
  const c = requireRead();
  const count = Number(await c.campaignCount());
  const ids = Array.from({ length: count }, (_, i) => i + 1);
  return Promise.all(ids.map((id) => fetchCampaign(id)));
}

export async function fetchMilestones(id: number): Promise<Milestone[]> {
  const list: any[] = Array.from(await requireRead().getMilestones(id));
  return list.map((m, i) => toMilestone(m, i));
}

export async function fetchContributors(id: number): Promise<string[]> {
  return Array.from(await requireRead().getContributors(id)) as string[];
}

export async function fetchContribution(id: number, address: string): Promise<bigint> {
  return (await requireRead().contributions(id, address)) as bigint;
}

export async function fetchHasVoted(id: number, milestoneId: number, address: string): Promise<boolean> {
  return (await requireRead().hasVotedOnMilestone(id, milestoneId, address)) as boolean;
}

export async function fetchTransparency(id: number): Promise<Transparency> {
  const r: any = await requireRead().getTransparency(id);
  return {
    totalIn: r.totalIn as bigint,
    totalReleased: r.totalReleased as bigint,
    totalRefunded: r.totalRefunded as bigint,
    balance: r.balance as bigint,
    contributorCount: Number(r.contributorCount),
  };
}

/* -------------------------- events / history --------------------------- */

async function getLogsAdaptive(provider: Provider, from: number, to: number, out: Log[]): Promise<void> {
  try {
    out.push(...(await provider.getLogs({ address: CONTRACT_ADDRESS, fromBlock: from, toBlock: to })));
  } catch (e) {
    if (to - from <= 5) throw e;
    const mid = Math.floor((from + to) / 2);
    await getLogsAdaptive(provider, from, mid, out);
    await getLogsAdaptive(provider, mid + 1, to, out);
  }
}

const blockTimeCache = new Map<number, number>();

export async function fetchEventRecords(): Promise<TxRecord[]> {
  const provider = getReadProvider();
  if (!provider || !IS_CONTRACT_CONFIGURED) return [];
  const latest = await provider.getBlockNumber();
  const start = DEPLOY_BLOCK > 0 ? DEPLOY_BLOCK : Math.max(0, latest - 20000);

  const logs: Log[] = [];
  for (let from = start; from <= latest; from += LOG_BLOCK_RANGE) {
    await getLogsAdaptive(provider, from, Math.min(latest, from + LOG_BLOCK_RANGE - 1), logs);
  }

  const records: TxRecord[] = [];
  for (const log of logs) {
    let parsed;
    try {
      parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
    } catch {
      continue;
    }
    if (!parsed) continue;
    const a: any = parsed.args;
    const base = { id: `${log.transactionHash}-${log.index}`, blockNumber: log.blockNumber, txHash: log.transactionHash, status: 'Confirmed' as const };
    switch (parsed.name) {
      case 'CampaignCreated':
        records.push({ ...base, type: 'CampaignCreated', campaignId: Number(a.campaignId), address: a.owner, amount: a.goal, detail: a.title });
        break;
      case 'Contributed':
        records.push({ ...base, type: 'Contribution', campaignId: Number(a.campaignId), address: a.contributor, amount: a.amount });
        break;
      case 'Voted':
        records.push({ ...base, type: 'Vote', campaignId: Number(a.campaignId), address: a.voter, amount: a.weight, detail: `Milestone #${Number(a.milestoneId) + 1} · ${a.support ? 'Approve' : 'Reject'}` });
        break;
      case 'MilestoneRequested':
        records.push({ ...base, type: 'MilestoneRequest', campaignId: Number(a.campaignId), address: '', detail: `Milestone #${Number(a.milestoneId) + 1} · round ${Number(a.round)}` });
        break;
      case 'FundsReleased':
        records.push({ ...base, type: 'Release', campaignId: Number(a.campaignId), address: a.owner, amount: a.amount, detail: `Milestone #${Number(a.milestoneId) + 1}` });
        break;
      case 'Refunded':
        records.push({ ...base, type: 'Refund', campaignId: Number(a.campaignId), address: a.contributor, amount: a.amount });
        break;
      default:
        break;
    }
  }

  records.sort((x, y) => y.blockNumber - x.blockNumber || y.id.localeCompare(x.id));

  // Resolve block timestamps (cached, small batches).
  const blocks = Array.from(new Set(records.map((r) => r.blockNumber))).filter((b) => !blockTimeCache.has(b));
  for (let i = 0; i < blocks.length; i += 10) {
    await Promise.all(
      blocks.slice(i, i + 10).map(async (n) => {
        try {
          const b = await provider.getBlock(n);
          if (b) blockTimeCache.set(n, b.timestamp);
        } catch {
          /* timestamp is optional */
        }
      }),
    );
  }
  return records.map((r) => ({ ...r, timestamp: blockTimeCache.get(r.blockNumber) }));
}

export function campaignIdFromReceipt(receipt: ContractTransactionReceipt): number | null {
  for (const log of receipt.logs) {
    try {
      const p = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (p?.name === 'CampaignCreated') return Number((p.args as any).campaignId);
    } catch {
      /* not ours */
    }
  }
  return null;
}

/* ------------------------------- errors -------------------------------- */

const ERROR_MESSAGES: Record<string, string> = {
  CampaignNotFound: 'Campaign not found.',
  NotCampaignOwner: 'Only the campaign owner can do this.',
  EmptyTitle: 'Campaign title is required.',
  InvalidGoal: 'Funding goal must be greater than 0.',
  InvalidDuration: 'Duration must be between 60 seconds and 365 days.',
  InvalidMilestones: 'Invalid milestones (1–20 milestones, each amount > 0).',
  MilestoneTotalMismatch: 'Milestone allocations must add up exactly to the funding goal.',
  ZeroAmount: 'Amount must be greater than 0.',
  OwnerCannotContribute: 'Campaign owners cannot fund their own campaign.',
  CampaignNotFunding: 'This campaign is not accepting contributions (ended or already fully funded).',
  ExceedsRemainingGoal: 'Amount exceeds the remaining funding goal.',
  CampaignNotSuccessful: 'Campaign is not in a funded (active) state.',
  CampaignNotFailed: 'Refunds are only available after a campaign fails (deadline passed, goal not reached).',
  InvalidMilestone: 'Invalid milestone.',
  MilestoneOutOfOrder: 'Milestones must be completed in order.',
  MilestoneAlreadyPending: 'This milestone already has a pending request.',
  MilestoneAlreadyReleased: 'This milestone has already been released.',
  EmptyEvidence: 'Evidence URL is required.',
  NotContributor: 'Only contributors of this campaign can vote.',
  MilestoneNotPending: 'This milestone is not pending approval.',
  AlreadyVoted: 'You have already voted on this milestone.',
  InsufficientBalance: 'Campaign balance is insufficient for this release.',
  NothingToRefund: 'Nothing to refund for this wallet.',
  TransferFailed: 'ETH transfer failed.',
  Reentrancy: 'Reentrancy blocked.',
};

export function parseTxError(e: unknown): string {
  const err = e as any;
  if (isError(e, 'ACTION_REJECTED') || err?.code === 4001 || err?.info?.error?.code === 4001) {
    return 'You rejected the request in MetaMask.';
  }
  if (isError(e, 'INSUFFICIENT_FUNDS')) return 'Insufficient Sepolia ETH to cover the amount and gas fees.';

  const name: string | undefined = err?.revert?.name;
  if (name && ERROR_MESSAGES[name]) return ERROR_MESSAGES[name];

  const data = err?.data ?? err?.error?.data ?? err?.info?.error?.data;
  if (typeof data === 'string' && data.startsWith('0x') && data.length >= 10) {
    try {
      const decoded = iface.parseError(data);
      if (decoded && ERROR_MESSAGES[decoded.name]) return ERROR_MESSAGES[decoded.name];
    } catch {
      /* ignore */
    }
  }
  if (isError(e, 'CALL_EXCEPTION')) return err?.reason ? String(err.reason) : 'The contract rejected this call (revert).';
  const msg: string = err?.shortMessage ?? err?.message ?? 'Unknown error';
  return msg.length > 220 ? `${msg.slice(0, 220)}…` : msg;
}
