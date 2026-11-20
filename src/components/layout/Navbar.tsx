import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Hexagon, Menu, X } from 'lucide-react';
import ConnectWallet from '../wallet/ConnectWallet';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/campaigns', label: 'Explore Campaigns', end: false },
  { to: '/#how-it-works', label: 'How It Works', end: false, hash: true },
  { to: '/dashboard', label: 'Dashboard', end: false },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const cls = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-white" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-purple shadow-lg shadow-electric/30">
            <Hexagon className="h-5 w-5" />
          </span>
          Innovate<span className="gradient-text">Fund</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) =>
            l.hash ? (
              <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white">
                {l.label}
              </Link>
            ) : (
              <NavLink key={l.to} to={l.to} end={l.end} className={cls}>
                {l.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ConnectWallet />
          <button className="btn-ghost !px-2.5 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 bg-navy-900/95 p-4 lg:hidden">
          {[...links, { to: '/create', label: 'Start a Campaign', end: false }, { to: '/transparency', label: 'Transparency', end: false }, { to: '/refunds', label: 'Refunds', end: false }].map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
