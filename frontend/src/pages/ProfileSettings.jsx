import { ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { currentUser } from '../data/mockUser';

export function ProfileSettings() {
  const [selectedMenu, setSelectedMenu] = useState('Minhas viagens');

  return (
    <div className="space-y-6">
      <section className="relative h-64 overflow-hidden rounded-3xl text-white md:h-72">
        <img src={currentUser.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-slate-900/10" />
        <div className="absolute bottom-5 left-4 right-4 flex items-center gap-4">
          <img src={currentUser.avatar} alt={currentUser.name} className="h-20 w-20 rounded-full border-4 border-white object-cover" />
          <div>
            <h1 className="text-xl font-extrabold">{currentUser.name}</h1>
            <p className="text-xs text-white/80">{currentUser.handle}</p>
            <p className="text-xs text-white/80">{currentUser.since}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <section className="grid grid-cols-4 rounded-2xl bg-white p-3 shadow-card">
            {currentUser.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <strong className="block text-sm text-slate-950">{stat.value}</strong>
                <span className="text-[10px] text-slate-500">{stat.label}</span>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-card">
            {currentUser.menu.map((item) => {
              const isExit = item === 'Sair';
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedMenu(item)}
                  className={`flex w-full items-center justify-between border-b border-slate-100 px-4 py-4 text-left text-sm font-semibold last:border-none ${selectedMenu === item ? 'bg-brand-50 text-brand-700' : 'text-slate-700'}`}
                >
                  <span className="flex items-center gap-3">{isExit ? <LogOut size={16} /> : <span className="h-2 w-2 rounded-full bg-brand-200" />} {item}</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              );
            })}
          </section>
        </div>

        <section className="card">
          <h2 className="text-lg font-extrabold text-slate-950">{selectedMenu}</h2>
          <p className="mt-2 text-sm text-slate-600">Área mockada de {selectedMenu.toLowerCase()} operável no frontend. Em uma próxima integração, este painel pode buscar dados reais da conta.</p>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">Status: funcional no modo demonstrativo.</div>
        </section>
      </div>
    </div>
  );
}
