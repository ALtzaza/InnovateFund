import { Link } from 'react-router-dom';
import { Hexagon } from 'lucide-react';
import { CONTRACT_ADDRESS, IS_CONTRACT_CONFIGURED, SEPOLIA, addressUrl } from '../../config/contract';
const MEMBERS = [
  { name: 'คฑาวุธ เมืองพรหม', id: '66002022' },
  { name: 'พบพร จิตโสภา', id: '66016519' },
  { name: 'นพรัตน์ สวัสดิ์เอื้อ', id: '66050180' },
  { name: 'อชิรยุ นวลสกลุวัฒน์', id: '66050731' },
  { name: 'ธนภัทร หนูบุญมี', id: '66031036' }
];
export default function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-navy-900/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-extrabold text-white">
            <Hexagon className="h-5 w-5 text-electric" /> InnovateFund
          </div>
          <p className="mt-3 text-sm text-slate-400">
            About the platform: a decentralized crowdfunding dApp where funds stay locked in a smart contract and are released only after contributors approve each milestone.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Ethereum Network</h4>
          <p className="mt-3 text-sm text-slate-400">
            Running on <span className="text-cyan-300">{SEPOLIA.name} Testnet</span> (Chain ID {SEPOLIA.chainId}). Only test ETH is used.
          </p>
          <div className="mt-3 flex flex-col gap-1 text-sm">
            <Link className="text-slate-400 hover:text-white" to="/transparency">Transparency</Link>
            <Link className="text-slate-400 hover:text-white" to="/refunds">Refunds</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Smart Contract</h4>
          {IS_CONTRACT_CONFIGURED ? (
            <a className="mt-3 block break-all font-mono text-xs text-electric hover:underline" href={addressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer">
              {CONTRACT_ADDRESS}
            </a>
          ) : (
            <p className="mt-3 text-sm text-amber-300">Contract Not Configured</p>
          )}
          <p className="mt-3 text-xs text-slate-500">Always verify the address on Etherscan before sending funds.</p>
        </div>
      </div>
     <div >
  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <h4 className="text-sm font-semibold text-white">Team Members</h4>
    <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400">
      {MEMBERS.map((m) => (
        <li key={m.id}>
          {m.name} <span className="text-slate-600">({m.id})</span>
        </li>
      ))}
    </ul>
  </div>
</div>
      
    </footer>
  );
}
