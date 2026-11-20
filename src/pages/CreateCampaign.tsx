import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatEther, parseEther } from 'ethers';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useTxFlow } from '../hooks/useTxFlow';
import { campaignIdFromReceipt, getWriteContract } from '../services/blockchain';
import { IS_CONTRACT_CONFIGURED } from '../config/contract';
import { fmtEth, formatMilestoneText } from '../utils/format';
import TransactionModal from '../components/ui/TransactionModal';

interface MilestoneForm { key: number; title: string; description: string; amount: string }

const MAX_MILESTONES = 20;
const MIN_SECONDS = 60;
const MAX_SECONDS = 365 * 86400;

function safeParse(v: string): bigint | null {
  try {
    if (!v.trim()) return null;
    const w = parseEther(v.trim());
    return w > 0n ? w : null;
  } catch {
    return null;
  }
}

export default function CreateCampaign() {
  const wallet = useWallet();
  const flow = useTxFlow();
  const navigate = useNavigate();
  const keyRef = useRef(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('7');
  const [unit, setUnit] = useState<'days' | 'minutes'>('days');
  const [milestones, setMilestones] = useState<MilestoneForm[]>([{ key: 0, title: '', description: '', amount: '' }]);

  const update = (key: number, patch: Partial<MilestoneForm>) =>
    setMilestones((ms) => ms.map((m) => (m.key === key ? { ...m, ...patch } : m)));

  const v = useMemo(() => {
    const goalWei = safeParse(goal);
    const dur = Number(duration);
    const seconds = Number.isInteger(dur) && dur > 0 ? dur * (unit === 'days' ? 86400 : 60) : 0;
    const amounts = milestones.map((m) => safeParse(m.amount));
    const total = amounts.reduce<bigint>((s, a) => s + (a ?? 0n), 0n);
    const errors: string[] = [];
    if (title.trim().length < 3 || title.trim().length > 80) errors.push('Title must be 3–80 characters.');
    if (description.trim().length < 10 || description.trim().length > 1000) errors.push('Description must be 10–1000 characters.');
    if (!goalWei) errors.push('Funding goal must be a valid ETH amount greater than 0.');
    if (!seconds) errors.push('Duration must be a whole number greater than 0.');
    else if (seconds < MIN_SECONDS || seconds > MAX_SECONDS) errors.push('Duration must be between 1 minute and 365 days.');
    milestones.forEach((m, i) => {
      if (!m.title.trim() || m.title.trim().length > 60) errors.push(`Milestone ${i + 1}: title is required (max 60 chars).`);
      if (!m.description.trim() || m.description.trim().length > 300) errors.push(`Milestone ${i + 1}: description is required (max 300 chars).`);
      if (!amounts[i]) errors.push(`Milestone ${i + 1}: allocation must be a valid ETH amount > 0.`);
    });
    if (goalWei && total !== goalWei) errors.push('Milestone allocations must add up exactly to the funding goal.');
    return { goalWei, seconds, amounts, total, errors };
  }, [title, description, goal, duration, unit, milestones]);

  const walletBlock = !IS_CONTRACT_CONFIGURED ? 'Contract not configured.' : !wallet.isConnected ? 'Connect your wallet first.' : !wallet.isCorrectNetwork ? 'Switch MetaMask to Sepolia.' : null;

  const submit = () => {
    if (walletBlock || v.errors.length || !v.goalWei) return;
    const goalWei = v.goalWei;
    const amounts = v.amounts as bigint[];
    const mDescs = milestones.map((m) => formatMilestoneText(m.title, m.description));
    flow.open({
      title: 'Create campaign',
      description: 'This sends a transaction to the InnovateFund contract. Campaign terms cannot be changed afterwards.',
      details: [
        { label: 'Title', value: title.trim() },
        { label: 'Goal', value: `${formatEther(goalWei)} ETH` },
        { label: 'Duration', value: `${duration} ${unit}` },
        { label: 'Milestones', value: String(milestones.length) },
      ],
      confirmLabel: 'Create Campaign',
      send: async () => {
        const signer = await wallet.getSigner();
        return getWriteContract(signer).createCampaign(title.trim(), description.trim(), goalWei, BigInt(v.seconds), mDescs, amounts);
      },
      onConfirmed: (receipt) => {
        const id = campaignIdFromReceipt(receipt);
        toast.success(id ? `Campaign #${id} created!` : 'Campaign created!');
        navigate(id ? `/campaigns/${id}` : '/campaigns');
      },
    });
  };

  const goalWei = v.goalWei;
  const diff = goalWei ? goalWei - v.total : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Start a Campaign</h1>
          <p className="mt-1 text-slate-400">Define your goal and milestones. Funds are released only after backers approve each milestone.</p>
        </div>

        <section className="glass space-y-5 p-6">
          <div>
            <label className="label" htmlFor="title">Campaign Name</label>
            <input id="title" className="input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Smart IoT Farm" />
          </div>
          <div>
            <label className="label" htmlFor="desc">Campaign Description</label>
            <textarea id="desc" className="input min-h-[110px]" maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you building and why?" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="goal">Funding Goal (ETH)</label>
              <input id="goal" className="input" inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.003" />
            </div>
            <div>
              <label className="label" htmlFor="dur">Campaign Duration</label>
              <div className="flex gap-2">
                <input id="dur" className="input" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ''))} />
                <select className="input !w-36" value={unit} onChange={(e) => setUnit(e.target.value as 'days' | 'minutes')}>
                  <option value="days">Days</option>
                  <option value="minutes">Minutes</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-slate-500">Use minutes to test refunds quickly on Sepolia.</p>
            </div>
          </div>
        </section>

        <section className="glass p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">Milestones</h2>
            <button className="btn-ghost !py-1.5 !text-xs" disabled={milestones.length >= MAX_MILESTONES} onClick={() => setMilestones((ms) => [...ms, { key: keyRef.current++, title: '', description: '', amount: '' }])}>
              <Plus className="h-3.5 w-3.5" /> Add Milestone
            </button>
          </div>
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <div key={m.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Milestone {i + 1}</span>
                  <button className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-30" disabled={milestones.length === 1} onClick={() => setMilestones((ms) => ms.filter((x) => x.key !== m.key))} aria-label="Remove milestone">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                  <input className="input" placeholder="Title" maxLength={60} value={m.title} onChange={(e) => update(m.key, { title: e.target.value })} />
                  <input className="input" placeholder="ETH" inputMode="decimal" value={m.amount} onChange={(e) => update(m.key, { amount: e.target.value.replace(/[^0-9.]/g, '') })} />
                </div>
                <textarea className="input mt-3 min-h-[70px]" placeholder="Description" maxLength={300} value={m.description} onChange={(e) => update(m.key, { description: e.target.value })} />
              </div>
            ))}
          </div>
          <div className={`mt-4 flex flex-wrap justify-between gap-2 rounded-xl border p-3 text-sm ${diff === 0n ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
            <span>Total allocated: <b>{fmtEth(v.total)} ETH</b> / Goal: <b>{goalWei ? fmtEth(goalWei) : '—'} ETH</b></span>
            <span>{diff === null ? 'Enter a goal' : diff === 0n ? 'Matches goal ✓' : diff > 0n ? `${fmtEth(diff)} ETH left to allocate` : `${fmtEth(-diff)} ETH over the goal`}</span>
          </div>
        </section>
      </div>

      <aside>
        <div className="glass space-y-4 p-6 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preview <span className="text-slate-600">(not on-chain yet)</span></p>
          <h3 className="break-words text-xl font-bold text-white">{title.trim() || 'Campaign name'}</h3>
          <p className="line-clamp-4 break-words text-sm text-slate-400">{description.trim() || 'Your description will appear here.'}</p>
          <div className="space-y-1 text-sm text-slate-300">
            <p>Goal: <b className="text-white">{goalWei ? `${fmtEth(goalWei)} ETH` : '—'}</b></p>
            <p>Duration: <b className="text-white">{duration || '—'} {unit}</b></p>
            <p>Milestones: <b className="text-white">{milestones.length}</b></p>
          </div>
          {v.errors.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-amber-300">
              {v.errors.slice(0, 5).map((e) => <li key={e}>{e}</li>)}
              {v.errors.length > 5 && <li>…and {v.errors.length - 5} more</li>}
            </ul>
          )}
          {walletBlock && <p className="text-sm text-amber-300">{walletBlock}</p>}
          {!wallet.isConnected ? (
            <button className="btn-primary w-full" onClick={() => void wallet.connect()}>Connect Wallet</button>
          ) : !wallet.isCorrectNetwork ? (
            <button className="btn-primary w-full" onClick={() => void wallet.switchToSepolia()}>Switch to Sepolia</button>
          ) : (
            <button className="btn-primary w-full" disabled={!!walletBlock || v.errors.length > 0 || flow.isBusy} onClick={submit}>Create Campaign</button>
          )}
          <Link to="/campaigns" className="block text-center text-xs text-slate-500 hover:text-slate-300">Cancel</Link>
        </div>
      </aside>
      <TransactionModal flow={flow} />
    </div>
  );
}
