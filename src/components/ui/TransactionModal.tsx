import { CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import type { TxFlow } from '../../hooks/useTxFlow';
import { txUrl } from '../../config/contract';
import { shortAddr } from '../../utils/format';

const STEPS = ['Confirm', 'Wallet', 'Pending', 'Done'];

export default function TransactionModal({ flow }: { flow: TxFlow }) {
  const { req, status, hash, error, isBusy, confirm, close } = flow;
  if (!req) return null;

  const stepIndex = status === 'idle' ? 0 : status === 'awaiting' ? 1 : status === 'pending' ? 2 : 3;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
      <div className="glass w-full max-w-md animate-fadeUp bg-white p-6">
        <h3 className="text-lg font-bold text-slate-800">{req.title}</h3>
        {req.description && <p className="mt-1 text-sm text-slate-500">{req.description}</p>}

        <div className="mt-5 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all ${status === 'failed' && i === stepIndex ? 'bg-red-500' : i <= stepIndex ? 'bg-gradient-to-r from-navy-900 to-electric' : 'bg-slate-100'}`} />
              <p className={`mt-1 text-center text-[10px] uppercase tracking-wide ${i <= stepIndex ? 'text-slate-600' : 'text-slate-400'}`}>{s}</p>
            </div>
          ))}
        </div>

        <dl className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          {req.details.map((d) => (
            <div key={d.label} className="flex justify-between gap-4">
              <dt className="text-slate-500">{d.label}</dt>
              <dd className="break-all text-right font-medium text-slate-800">{d.value}</dd>
            </div>
          ))}
        </dl>

        {status === 'awaiting' && (
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
            <Loader2 className="h-4 w-4 animate-spin" /> Awaiting confirmation in MetaMask…
          </p>
        )}
        {status === 'pending' && (
          <p className="mt-4 flex items-center gap-2 text-sm text-amber-700">
            <Loader2 className="h-4 w-4 animate-spin" /> Transaction pending — waiting for block confirmation…
          </p>
        )}
        {status === 'confirmed' && (
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Confirmed on Sepolia.
          </p>
        )}
        {status === 'failed' && (
          <p className="mt-4 flex items-start gap-2 text-sm text-red-600">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span className="break-words">{error ?? 'Transaction failed.'}</span>
          </p>
        )}

        {hash && (
          <a href={txUrl(hash)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-electric hover:underline">
            <ExternalLink className="h-4 w-4" /> {shortAddr(hash)} on Sepolia Etherscan
          </a>
        )}

        <div className="mt-6 flex gap-3">
          {(status === 'idle' || status === 'failed') && (
            <>
              <button className="btn-ghost flex-1" onClick={close}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => void confirm()} disabled={isBusy}>
                {status === 'failed' ? 'Try again' : req.confirmLabel ?? 'Confirm'}
              </button>
            </>
          )}
          {isBusy && (
            <button className="btn-ghost flex-1" disabled>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </button>
          )}
          {status === 'confirmed' && (
            <button className="btn-primary flex-1" onClick={close}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}
