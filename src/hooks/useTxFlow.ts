import { useCallback, useRef, useState } from 'react';
import type { ContractTransactionReceipt, ContractTransactionResponse } from 'ethers';
import toast from 'react-hot-toast';
import { parseTxError } from '../services/blockchain';
import { useWallet } from './useWallet';

export type TxStatus = 'idle' | 'awaiting' | 'pending' | 'confirmed' | 'failed';

export interface TxRequest {
  title: string;
  description?: string;
  details: { label: string; value: string }[];
  confirmLabel?: string;
  send: () => Promise<ContractTransactionResponse>;
  onConfirmed?: (receipt: ContractTransactionReceipt) => void | Promise<void>;
}

/** Manages the lifecycle of one write transaction: confirm → wallet → pending → confirmed/failed. */
export function useTxFlow() {
  const { refreshBalance } = useWallet();
  const [req, setReq] = useState<TxRequest | null>(null);
  const [status, setStatus] = useState<TxStatus>('idle');
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false); // prevents double submit

  const open = useCallback((r: TxRequest) => {
    if (busy.current) return;
    setReq(r);
    setStatus('idle');
    setHash(null);
    setError(null);
  }, []);

  const close = useCallback(() => {
    if (busy.current) return;
    setReq(null);
    setStatus('idle');
    setHash(null);
    setError(null);
  }, []);

  const confirm = useCallback(async () => {
    if (!req || busy.current) return;
    busy.current = true;
    setError(null);
    setHash(null);
    try {
      setStatus('awaiting');
      const tx = await req.send();
      setHash(tx.hash);
      setStatus('pending');
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) throw new Error('Transaction failed on-chain.');
      setStatus('confirmed');
      toast.success('Transaction confirmed');
      try {
        await req.onConfirmed?.(receipt);
      } catch {
        /* refresh errors must not flip a confirmed tx to failed */
      }
      void refreshBalance();
    } catch (e) {
      setError(parseTxError(e));
      setStatus('failed');
    } finally {
      busy.current = false;
    }
  }, [req, refreshBalance]);

  const isBusy = status === 'awaiting' || status === 'pending';
  return { req, status, hash, error, isBusy, open, close, confirm };
}

export type TxFlow = ReturnType<typeof useTxFlow>;
