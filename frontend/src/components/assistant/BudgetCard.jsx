import { CircleDollarSign, WalletCards } from 'lucide-react';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

export function BudgetCard({ data }) {
  const budget = data?.budget || data?.itinerary?.budget;
  if (!budget) return null;
  const total = budget.total;
  const balance = budget.balance ?? budget.remaining_budget;

  return (
    <section className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3" aria-label="Resumo do orçamento">
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800"><WalletCards size={15} /> Orçamento estimado</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white p-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Total</p>
          <p className="mt-0.5 text-sm font-extrabold text-slate-900">{money(total)}</p>
        </div>
        {balance !== undefined && (
          <div className="rounded-lg bg-white p-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Saldo</p>
            <p className={`mt-0.5 text-sm font-extrabold ${Number(balance) < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{money(balance)}</p>
          </div>
        )}
      </div>
      {budget.classification && <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-800"><CircleDollarSign size={12} /> {budget.classification}</p>}
    </section>
  );
}
