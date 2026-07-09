import { Plus } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { CostCard } from '../components/cards/CostCard';
import { getCostSummary } from '../services/costService';

export function CostsPage() {
  const costs = getCostSummary();

  return (
    <div className="space-y-5">
      <section className="card lg:max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Total previsto</p>
            <h1 className="text-2xl font-extrabold text-slate-950">R$ {costs.total.toLocaleString('pt-BR')}</h1>
            <p className="mt-2 text-xs text-slate-500">Gasto por pessoa</p>
            <p className="font-bold text-slate-800">R$ {costs.perPerson.toLocaleString('pt-BR')}</p>
          </div>
          <div className="relative h-32 w-32">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={costs.categories} innerRadius={38} outerRadius={56} dataKey="value" stroke="none">
                  {costs.categories.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center text-center">
              <span className="text-[10px] text-slate-400">Orçamento usado</span>
              <strong className="block text-lg text-slate-950">{costs.budgetUsed}%</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="card">
        <h2 className="mb-2 text-sm font-extrabold text-slate-950">Por categoria</h2>
        {costs.categories.map((category) => <CostCard key={category.name} category={category} />)}
      </section>

      <section className="card">
        <h2 className="text-sm font-extrabold text-slate-950">Resumo diário (médio)</h2>
        <p className="mb-4 text-xs text-slate-500">R$ {costs.dailyAverage.toLocaleString('pt-BR')}</p>
        <div className="h-40">
          <ResponsiveContainer>
            <BarChart data={costs.daily}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      </div>

      <button type="button" className="primary-btn w-full"><Plus size={16} /> Adicionar gasto</button>
    </div>
  );
}
