import { Link } from 'react-router-dom';
import { Hexagon } from 'lucide-react';
import { CONTRACT_ADDRESS, IS_CONTRACT_CONFIGURED, SEPOLIA, addressUrl } from '../../config/contract';

const MEMBERS = [
  { name: 'คฑาวุธ เมืองพรหม', id: '66002022' },
  { name: 'พบพร จิตโสภา', id: '66016519' },
  { name: 'นพรัตน์ สวัสดิ์เอื้อ', id: '66050180' },
  { name: 'อชิรยุ นวลสกุลวัฒน์', id: '66050731' },
  { name: 'ธนภัทร หนูบุญมี', id: '66031036' },
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-navy-900 text-slate-300">
      <div className="h-1 bg-gradient-to-r from-electric via-electric to-brand" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-brand">
              <Hexagon className="h-5 w-5" />
            </span>
            InnovateFund
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            About the platform: a decentralized crowdfunding dApp where funds stay locked in a smart contract and are released only after contributors approve each milestone.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Ethereum Network</h4>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Running on <span className="font-semibold text-emerald-400">{SEPOLIA.name} Testnet</span> (Chain ID {SEPOLIA.chainId}). Only test ETH is used.
          </p>
          <div className="mt-4 flex flex-col gap-1.5 text-sm">
            <Link className="text-slate-400 transition hover:text-white" to="/transparency">Transparency</Link>
            <Link className="text-slate-400 transition hover:text-white" to="/refunds">Refunds</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Smart Contract</h4>
          {IS_CONTRACT_CONFIGURED ? (
            <a className="mt-4 block break-all rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-xs text-blue-300 transition hover:border-blue-400/40 hover:text-blue-200" href={addressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer">
              {CONTRACT_ADDRESS}
            </a>
          ) : (
            <p className="mt-4 text-sm text-amber-400">Contract Not Configured</p>
          )}
          <p className="mt-3 text-xs text-slate-500">Always verify the address on Etherscan before sending funds.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Team Members</h4>
          <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400">
            {MEMBERS.map((m) => (
              <li key={m.id}>
                {m.name} <span className="num text-slate-500">({m.id})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
