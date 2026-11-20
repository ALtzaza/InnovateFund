import { useCallback, useEffect, useMemo, useState } from 'react';
import { IS_CONTRACT_CONFIGURED } from '../config/contract';
import { fetchEventRecords, parseTxError } from '../services/blockchain';
import type { TxRecord } from '../types';

let cache: { at: number; data: TxRecord[] } | null = null;
const TTL = 15_000;

interface Options {
  campaignId?: number;
  address?: string | null;
}

/** Reads the contract's event history (Contributed, FundsReleased, Refunded, Voted, ...) from the chain. */
export function useTransactions(opts: Options = {}) {
  const [all, setAll] = useState<TxRecord[]>(cache?.data ?? []);
  const [loading, setLoading] = useState(IS_CONTRACT_CONFIGURED && !cache);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = true) => {
    if (!IS_CONTRACT_CONFIGURED) {
      setLoading(false);
      return;
    }
    if (!force && cache && Date.now() - cache.at < TTL) {
      setAll(cache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEventRecords();
      cache = { at: Date.now(), data };
      setAll(data);
    } catch (e) {
      setError(parseTxError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  const records = useMemo(() => {
    const me = opts.address?.toLowerCase();
    return all.filter((r) => {
      if (opts.campaignId !== undefined && r.campaignId !== opts.campaignId) return false;
      if (me && r.address.toLowerCase() !== me) return false;
      return true;
    });
  }, [all, opts.campaignId, opts.address]);

  return { records, all, loading, error, refresh };
}
