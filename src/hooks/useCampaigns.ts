import { useCallback, useEffect, useRef, useState } from 'react';
import { IS_CONTRACT_CONFIGURED } from '../config/contract';
import {
  fetchAllCampaigns,
  fetchCampaign,
  fetchContribution,
  fetchContributors,
  fetchHasVoted,
  fetchMilestones,
  fetchTransparency,
  parseTxError,
} from '../services/blockchain';
import { CampaignStatus, MilestoneStatus } from '../types';
import type { Campaign, ContributorEntry, Milestone, Transparency } from '../types';

/* ------------------------------ all campaigns ------------------------------ */

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(IS_CONTRACT_CONFIGURED);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!IS_CONTRACT_CONFIGURED) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setCampaigns(await fetchAllCampaigns());
    } catch (e) {
      setError(parseTxError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { campaigns, loading, error, refresh };
}

/* ------------------------------ single campaign ----------------------------- */

export function useCampaign(id: number) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [contributors, setContributors] = useState<ContributorEntry[]>([]);
  const [transparency, setTransparency] = useState<Transparency | null>(null);
  const [loading, setLoading] = useState(IS_CONTRACT_CONFIGURED);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    if (!IS_CONTRACT_CONFIGURED) {
      setLoading(false);
      return;
    }
    if (!Number.isInteger(id) || id < 1) {
      setError('Invalid campaign id.');
      setLoading(false);
      return;
    }
    const mine = ++seq.current;
    setError(null);
    try {
      const [c, ms, addrs, tr] = await Promise.all([
        fetchCampaign(id),
        fetchMilestones(id),
        fetchContributors(id),
        fetchTransparency(id),
      ]);
      const amounts = await Promise.all(addrs.map((a) => fetchContribution(id, a)));
      if (mine !== seq.current) return;
      setCampaign(c);
      setMilestones(ms);
      setContributors(addrs.map((address, i) => ({ address, amount: amounts[i] })).sort((a, b) => (b.amount > a.amount ? 1 : -1)));
      setTransparency(tr);
    } catch (e) {
      if (mine === seq.current) setError(parseTxError(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(IS_CONTRACT_CONFIGURED);
    void refresh();
  }, [refresh]);

  return { campaign, milestones, contributors, transparency, loading, error, refresh };
}

/* ------------------------ per-campaign financial rows ----------------------- */

export interface FinancialRow {
  campaign: Campaign;
  transparency: Transparency;
  contributors: string[];
}

export function useFinancials(campaigns: Campaign[]) {
  const [rows, setRows] = useState<FinancialRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!IS_CONTRACT_CONFIGURED || campaigns.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    Promise.all(
      campaigns.map(async (campaign) => {
        const [transparency, contributors] = await Promise.all([fetchTransparency(campaign.id), fetchContributors(campaign.id)]);
        return { campaign, transparency, contributors };
      }),
    )
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [campaigns]);

  return { rows, loading };
}

/* ------------------------- my contributions & votes ------------------------- */

export interface PendingVote {
  campaign: Campaign;
  milestone: Milestone;
  weight: bigint;
}

export function useMyPositions(campaigns: Campaign[], address: string | null) {
  const [contributions, setContributions] = useState<Map<number, bigint>>(new Map());
  const [pendingVotes, setPendingVotes] = useState<PendingVote[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!IS_CONTRACT_CONFIGURED || !address || campaigns.length === 0) {
      setContributions(new Map());
      setPendingVotes([]);
      return;
    }
    setLoading(true);
    (async () => {
      const amounts = await Promise.all(campaigns.map((c) => fetchContribution(c.id, address)));
      const map = new Map<number, bigint>();
      campaigns.forEach((c, i) => map.set(c.id, amounts[i]));

      const pending: PendingVote[] = [];
      for (const c of campaigns) {
        const weight = map.get(c.id) ?? 0n;
        if (weight === 0n || c.status !== CampaignStatus.Successful) continue;
        const ms = await fetchMilestones(c.id);
        for (const m of ms.filter((x) => x.status === MilestoneStatus.Pending)) {
          if (!(await fetchHasVoted(c.id, m.index, address))) pending.push({ campaign: c, milestone: m, weight });
        }
      }
      if (!cancelled) {
        setContributions(map);
        setPendingVotes(pending);
      }
    })()
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [campaigns, address, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { contributions, pendingVotes, loading, refresh };
}
