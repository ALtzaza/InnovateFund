import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import ConnectWallet from '../wallet/ConnectWallet';

function titleFor(path: string) {
  if (path === '/') return 'Home';
  if (path === '/campaigns') return 'Explore Campaigns';
  if (/^\/campaigns\/[^/]+\/milestones$/.test(path)) return 'Milestones';
  if (path.startsWith('/campaigns/')) return 'Campaign Details';
  if (path === '/create') return 'Create Campaign';
  if (path === '/dashboard') return 'My Dashboard';
  if (path === '/transparency') return 'Transparency';
  if (path === '/refunds') return 'Refunds';
  return 'InnovateFund';
}

/** Top bar of the app shell: page context on the left, wallet on the right. */
export default function Navbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button className="btn-ghost !px-2.5 lg:hidden" onClick={onMenu} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:block">InnovateFund</p>
            <p className="truncate text-base font-bold text-slate-900">{titleFor(pathname)}</p>
          </div>
        </div>
        <ConnectWallet />
      </div>
    </header>
  );
}
