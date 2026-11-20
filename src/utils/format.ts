import { formatEther } from 'ethers';
import { CampaignStatus, MilestoneStatus } from '../types';

export const shortAddr = (a?: string | null): string => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');

export function fmtEth(v: bigint, maxDecimals = 5): string {
  const s = formatEther(v);
  const [int, dec = ''] = s.split('.');
  const d = dec.slice(0, maxDecimals).replace(/0+$/, '');
  if (!d && int === '0' && v > 0n) return `<0.${'0'.repeat(maxDecimals - 1)}1`;
  return d ? `${int}.${d}` : int;
}

/** Percentage (0-100, two decimals) of part/total using bigint math. */
export function pct(part: bigint, total: bigint): number {
  if (total <= 0n) return 0;
  const p = Number((part * 10000n) / total) / 100;
  return Math.max(0, Math.min(100, p));
}

export function timeLeft(deadline: bigint): string {
  const secs = Number(deadline) - Math.floor(Date.now() / 1000);
  if (secs <= 0) return 'Ended';
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m left`;
  return `${secs}s left`;
}

export function daysLeftShort(deadline: bigint): string {
  const secs = Number(deadline) - Math.floor(Date.now() / 1000);
  if (secs <= 0) return 'Ended';
  const d = Math.ceil(secs / 86400);
  return secs < 86400 ? timeLeft(deadline) : `${d} day${d === 1 ? '' : 's'} left`;
}

export function formatDate(ts?: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  [CampaignStatus.Funding]: 'Funding',
  [CampaignStatus.Successful]: 'Funded',
  [CampaignStatus.Failed]: 'Failed',
  [CampaignStatus.Completed]: 'Completed',
};

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  [MilestoneStatus.NotRequested]: 'Not requested',
  [MilestoneStatus.Pending]: 'Pending approval',
  [MilestoneStatus.Released]: 'Released',
  [MilestoneStatus.Rejected]: 'Rejected',
};

/** Milestones are stored on-chain as one string. We encode "title::description". */
export function formatMilestoneText(title: string, description: string): string {
  const clean = (s: string) => s.replace(/::/g, ':').trim();
  return `${clean(title)}::${clean(description)}`;
}

export function parseMilestoneText(raw: string, index: number): { title: string; description: string } {
  const i = raw.indexOf('::');
  if (i === -1) return { title: `Milestone ${index + 1}`, description: raw };
  return { title: raw.slice(0, i).trim() || `Milestone ${index + 1}`, description: raw.slice(i + 2).trim() };
}

/** Returns an error message, or null when the URL is acceptable. Only https:// and ipfs:// are allowed. */
export function validateEvidenceUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return 'Evidence URL is required.';
  if (url.length > 300) return 'Evidence URL is too long (max 300 characters).';
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f]/.test(url)) return 'Evidence URL must not contain spaces or control characters.';
  if (/^ipfs:\/\/[A-Za-z0-9]+(\/\S*)?$/.test(url)) return null;
  if (/^https:\/\/\S+$/.test(url)) {
    try {
      new URL(url);
      return null;
    } catch {
      return 'Evidence URL is not a valid link.';
    }
  }
  return 'Only https:// or ipfs:// links are accepted.';
}

/** Converts a validated evidence URL to a safe clickable http(s) URL ('' if not safe). */
export function toHttpUrl(url: string): string {
  if (/^ipfs:\/\/[A-Za-z0-9]+(\/\S*)?$/.test(url)) return `https://ipfs.io/ipfs/${url.slice('ipfs://'.length)}`;
  if (/^https:\/\/\S+$/.test(url)) return url;
  return '';
}

export const eq = (a?: string | null, b?: string | null): boolean =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();
