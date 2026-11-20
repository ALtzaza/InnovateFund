import { fmtEth, pct } from '../../utils/format';

export default function FundingProgress({ raised, goal, large = false }: { raised: bigint; goal: bigint; large?: boolean }) {
  const p = pct(raised, goal);
  return (
    <div>
      <div className={`overflow-hidden rounded-full bg-white/10 ${large ? 'h-3.5' : 'h-2.5'}`}>
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-electric to-purple transition-all duration-700" style={{ width: `${p}%` }} />
      </div>
      <div className="mt-2 flex items-baseline justify-between text-sm">
        <span className="text-slate-300">
          <span className={`font-bold text-white ${large ? 'text-xl' : ''}`}>{fmtEth(raised)}</span> / {fmtEth(goal)} ETH
        </span>
        <span className="font-semibold text-cyan-300">{p.toFixed(p % 1 === 0 ? 0 : 1)}%</span>
      </div>
    </div>
  );
}
