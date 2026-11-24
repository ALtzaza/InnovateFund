import { Copy, ExternalLink, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet } from '../../hooks/useWallet';
import { addressUrl } from '../../config/contract';
import { fmtEth, shortAddr } from '../../utils/format';

export default function WalletInfo() {
  const { address, balance, isCorrectNetwork, switchToSepolia, disconnect } = useWallet();
  if (!address) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied');
    } catch {
      toast.error('Could not copy address');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isCorrectNetwork && (
        <button className="btn border border-amber-500/30 bg-amber-50 text-amber-700 hover:bg-amber-100" onClick={() => void switchToSepolia()}>
          Switch to Sepolia
        </button>
      )}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-1.5 text-sm">
        <span className="hidden font-semibold text-emerald-700 sm:inline">{balance !== null ? `${fmtEth(balance, 4)} ETH` : '…'}</span>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700">{shortAddr(address)}</span>
        <button title="Copy address" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={() => void copy()}>
          <Copy className="h-4 w-4" />
        </button>
        <a title="View on Etherscan" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" href={addressUrl(address)} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
        </a>
        <button title="Disconnect (UI only)" className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/15 hover:text-red-600" onClick={disconnect}>
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
