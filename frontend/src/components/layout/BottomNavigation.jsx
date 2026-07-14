import { CalendarDays, Home, Map, Plus, ReceiptText, Search, Settings, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const mobileItems = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/destination', label: 'Explorar', icon: Search },
  { to: '/planner', label: 'Roteiro', icon: Plus, featured: true },
  { to: '/places', label: 'Mapa', icon: Map },
  { to: '/profile', label: 'Perfil', icon: Settings },
];

const desktopItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/destination', label: 'Destino', icon: Search },
  { to: '/planner', label: 'Planejador', icon: Plus },
  { to: '/timeline', label: 'Timeline por dia', icon: CalendarDays },
  { to: '/places', label: 'Mapa de lugares', icon: Map },
  { to: '/costs', label: 'Controle de custos', icon: ReceiptText },
  { to: '/community', label: 'Relatos', icon: UsersRound },
  { to: '/profile', label: 'Perfil', icon: Settings },
];

export function BottomNavigation() {
  return (
    <nav className="bottom-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 px-3 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5 items-center gap-1">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-semibold ${isActive ? 'text-brand-700' : 'text-slate-500'}`
              }
            >
              <span className={item.featured ? 'grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30' : ''}>
                <Icon size={item.featured ? 20 : 18} />
              </span>
              {!item.featured ? item.label : ''}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function SidebarNavigation() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-5 md:block">
      <NavLink to="/" className="mb-6 flex items-center gap-3 rounded-2xl px-2 py-1">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 font-black text-brand-700">VR</span>
        <div>
          <strong className="block text-slate-950">ViajaReal</strong>
          <span className="text-xs text-slate-500">Planejador de viagens</span>
        </div>
      </NavLink>
      <div className="space-y-1">
        {desktopItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
