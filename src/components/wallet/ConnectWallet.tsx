import { Loader2, Wallet } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import WalletInfo from './WalletInfo';

export default function ConnectWallet() {
  const { address, isInstalled, connecting, connect } = useWallet();
  if (address) return <WalletInfo />;
  return (
    <button className="btn-primary" onClick={() => void connect()} disabled={connecting}>
      {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
      {isInstalled ? 'Connect Wallet' : 'Install MetaMask'}
    </button>
  );
}
