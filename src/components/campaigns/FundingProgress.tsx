import { fmtEth, pct } from '../../utils/format';

export default function FundingProgress({ raised, goal, large = false }: { raised: bigint; goal: bigint; large?: boolean }) {
  const p = pct(raised, goal);
  return (
    <div>
      <div className={`overflow-hidden rounded-full bg-slate-100 ${large ? 'h-3.5' : 'h-2.5'}`}>
        <div className="h-full rounded-full bg-gradient-to-r from-electric to-brand transition-all duration-700" style={{ width: `${p}%` }} />
      </div>
      <div className="mt-2 flex items-baseline justify-between text-sm">
        <span className="text-slate-600">
          <span className={`font-bold text-slate-800 ${large ? 'text-xl' : ''}`}>{fmtEth(raised)}</span> / {fmtEth(goal)} ETH
        </span>
        <span className="font-semibold text-emerald-700">{p.toFixed(p % 1 === 0 ? 0 : 1)}%</span>
      </div>
    </div>
  );
}
