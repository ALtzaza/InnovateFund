import { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { CONTRACT_ADDRESS, IS_CONTRACT_CONFIGURED } from '../../config/contract';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-electric/10 text-electric">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glass flex flex-col items-center border-red-500/30 px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">Something went wrong</h3>
      <p className="mt-1 max-w-md break-words text-sm text-slate-500">{message}</p>
      {onRetry && (
        <button className="btn-ghost mt-5" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

/** Shown on every page when VITE_CONTRACT_ADDRESS is missing/invalid. */
export function ContractBanner() {
  if (IS_CONTRACT_CONFIGURED) return null;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">Contract Not Configured</p>
        <p className="mt-0.5 text-amber-800">
          {CONTRACT_ADDRESS
            ? 'VITE_CONTRACT_ADDRESS is not a valid address.'
            : 'Set VITE_CONTRACT_ADDRESS (and VITE_SEPOLIA_RPC_URL) in your .env file, then restart npm run dev.'}{' '}
          No blockchain data can be loaded until then.
        </p>
      </div>
    </div>
  );
}
