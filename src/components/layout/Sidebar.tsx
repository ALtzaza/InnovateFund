import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, LayoutDashboard, PlusCircle, Undo2 } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { to: '/create', label: 'Create Campaign', icon: PlusCircle },
  { to: '/transparency', label: 'Transparency', icon: BarChart3 },
  { to: '/refunds', label: 'Refunds', icon: Undo2 },
];

export default function Sidebar() {
  return (
    <aside className="glass h-fit p-2 lg:sticky lg:top-24">
      <nav className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'bg-gradient-to-r from-electric/20 to-purple/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`
            }
          >
            <Icon className="h-4 w-4" /> {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function SidebarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <Sidebar />
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
