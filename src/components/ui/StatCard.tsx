import { ReactNode } from 'react';
import { Skeleton } from './LoadingSpinner';

export default function StatCard({
  icon,
  label,
  value,
  hint,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <div className="glass group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-electric to-brand opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-electric">{icon}</div>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="num mt-3 text-2xl font-bold text-slate-900 sm:text-[1.7rem]">{value}</p>}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
