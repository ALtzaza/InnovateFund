import { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BarChart3, Compass, Hexagon, HelpCircle, LayoutDashboard, Home, PlusCircle, Undo2, X } from 'lucide-react';
import { IS_CONTRACT_CONFIGURED, SEPOLIA } from '../../config/contract';

const groups = [
  {
    title: 'Platform',
    items: [
      { to: '/', label: 'Home', icon: Home, end: true },
      { to: '/campaigns', label: 'Explore Campaigns', icon: Compass, end: false },
      { to: '/#how-it-works', label: 'How It Works', icon: HelpCircle, end: false, hash: true },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard, end: false },
      { to: '/create', label: 'Create Campaign', icon: PlusCircle, end: false },
      { to: '/transparency', label: 'Transparency', icon: BarChart3, end: false },
      { to: '/refunds', label: 'Refunds', icon: Undo2, end: false },
    ],
  },
];

const base = 'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition';

/** Main app navigation: fixed rail on desktop, slide-in drawer on mobile. */
export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy-900 text-slate-300 transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-brand">
              <Hexagon className="h-5 w-5" />
            </span>
            Innovate<span className="text-blue-400">Fund</span>
          </Link>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{g.title}</p>
              <div className="space-y-1">
                {g.items.map(({ to, label, icon: Icon, end, hash }) =>
                  hash ? (
                    <Link key={to} to={to} onClick={onClose} className={`${base} text-slate-400 hover:bg-white/5 hover:text-white`}>
                      <Icon className="h-4 w-4" /> {label}
                    </Link>
                  ) : (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={onClose}
                      className={({ isActive }) => `${base} ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand" />}
                          <Icon className={`h-4 w-4 ${isActive ? 'text-brand' : ''}`} /> {label}
                        </>
                      )}
                    </NavLink>
                  ),
                )}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <span className={`h-2 w-2 rounded-full ${IS_CONTRACT_CONFIGURED ? 'bg-brand' : 'bg-amber-400'}`} />
              {SEPOLIA.name} Testnet
            </div>
            <p className="mt-1 text-xs text-slate-400">{IS_CONTRACT_CONFIGURED ? 'Contract connected' : 'Contract not configured'}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

/** Kept for existing pages: the shell now provides the sidebar, so this only spaces its children. */
export function SidebarLayout({ children }: { children: ReactNode }) {
  return <div className="min-w-0 space-y-6">{children}</div>;
}
