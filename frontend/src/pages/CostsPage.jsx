import { AlertTriangle, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { getCostSummary } from '../services/costService';
import { chatWithAssistant } from '../services/aiService';
import { getActiveTrip } from '../services/tripService';

const STORAGE_KEY = 'viajareal-editable-costs';
const colors = ['#7c3aed', '#0ea5e9', '#f59e0b', '#22c55e', '#f97316', '#ef4444', '#ec4899'];

function loadCosts(initialCosts) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved?.categories?.length ? saved : { categories: initialCosts.categories, daily: initialCosts.daily };
  } catch {
    return { categories: initialCosts.categories, daily: initialCosts.daily };
  }
}

export function CostsPage() {
  const trip = getActiveTrip();
  const initialCosts = getCostSummary();
  const [storedCosts] = useState(() => loadCosts(initialCosts));
  const [categories, setCategories] = useState(storedCosts.categories);
  const [daily] = useState(storedCosts.daily);
  const [newCategory, setNewCategory] = useState('');
  const [newValue, setNewValue] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const total = useMemo(() => categories.reduce((sum, category) => sum + category.value, 0), [categories]);
  const dailyAverage = useMemo(() => total / Math.max(daily.length, 1), [total, daily.length]);
  const chartDaily = useMemo(() => {
    const originalTotal = daily.reduce((sum, item) => sum + item.value, 0) || 1;
    return daily.map((item) => ({ ...item, value: Math.round((item.value / originalTotal) * total) }));
  }, [daily, total]);
  const budget = trip?.budget || 13000;
  const budgetUsed = Math.round((total / budget) * 100);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories, daily }));
  }, [categories, daily]);

  const updateCategory = (index, field, value) => {
    setCategories((current) => current.map((category, currentIndex) => (
      currentIndex === index
        ? { ...category, [field]: field === 'value' ? Math.max(0, Number(value) || 0) : value }
        : category
    )));
  };

  const addCategory = (event) => {
    event.preventDefault();
    const name = newCategory.trim();
    const value = Number(newValue);
    if (!name || !Number.isFinite(value) || value < 0) return;
    setCategories((current) => [...current, { name, value, color: colors[current.length % colors.length] }]);
    setNewCategory('');
    setNewValue('');
  };

  const analyzeCosts = async () => {
    setAiLoading(true);
    setAiError('');
    setAiAnalysis('');
    const remaining = budget - total;
    const categoryText = categories.map((category) => `${category.name}: R$ ${category.value.toFixed(2)}`).join('; ');
    const message = [
      'Analise somente estes gastos da minha viagem e responda em português de forma curta.',
      `Destino: ${trip.destination}. Orçamento: R$ ${budget.toFixed(2)}.`,
      `Total previsto: R$ ${total.toFixed(2)}. Saldo: R$ ${remaining.toFixed(2)}. Uso: ${budgetUsed}%.`,
      `Categorias: ${categoryText || 'nenhuma categoria cadastrada'}.`,
      'Informe: diagnóstico do orçamento, até 2 alertas e até 3 sugestões práticas de economia. Não invente preços nem gastos.',
    ].join('\n');

    try {
      const response = await chatWithAssistant({
        message,
        destination: trip.destination,
        currentPage: '/costs',
        formData: { budget, total, remaining, budget_used_percent: budgetUsed, categories },
      });
      setAiAnalysis(response.answer || response.message || 'A IA não retornou uma análise.');
    } catch (error) {
      setAiError(error.message || 'Não foi possível analisar os gastos com IA.');
    } finally {
      setAiLoading(false);
    }
  };

  if (!trip) {
    return (
      <section className="card space-y-3">
        <h1 className="text-lg font-extrabold text-slate-950">Nenhum orçamento selecionado</h1>
        <p className="text-sm text-slate-600">Crie um planejamento para acompanhar os custos da viagem.</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="card lg:max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Total previsto</p>
            <h1 className="text-2xl font-extrabold text-slate-950">R$ {total.toLocaleString('pt-BR')}</h1>
            <p className="mt-2 text-xs text-slate-500">Gasto por pessoa</p>
            <p className="font-bold text-slate-800">R$ {(total / (trip.travelersCount || 1)).toLocaleString('pt-BR')}</p>
          </div>
          <div className="relative h-32 w-32">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categories} innerRadius={38} outerRadius={56} dataKey="value" stroke="none">
                  {categories.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center text-center">
              <span className="text-[10px] text-slate-400">Orçamento usado</span>
              <strong className={`block text-lg ${budgetUsed > 100 ? 'text-rose-600' : 'text-slate-950'}`}>{budgetUsed}%</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 lg:max-w-3xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-violet-950"><Sparkles size={17} /> Análise inteligente dos gastos</h2>
            <p className="mt-1 text-xs text-violet-700">Receba um diagnóstico e sugestões usando somente os valores cadastrados.</p>
          </div>
          <button type="button" className="primary-btn shrink-0" onClick={analyzeCosts} disabled={aiLoading || categories.length === 0}>
            <Sparkles size={16} className={aiLoading ? 'animate-pulse' : ''} /> {aiLoading ? 'Analisando...' : 'Analisar gastos com IA'}
          </button>
        </div>
        {aiError && <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-white p-3 text-sm text-rose-700" role="alert"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> {aiError}</div>}
        {aiAnalysis && <div className="mt-4 whitespace-pre-wrap rounded-xl border border-violet-100 bg-white p-4 text-sm leading-relaxed text-slate-700" role="status">{aiAnalysis}</div>}
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="card">
          <h2 className="text-sm font-extrabold text-slate-950">Gastos por categoria</h2>
          <p className="mt-1 text-xs text-slate-500">Altere os campos abaixo. As mudanças são salvas automaticamente.</p>
          <div className="mt-4 space-y-2">
            {categories.map((category, index) => (
              <div key={`${category.color}-${index}`} className="grid grid-cols-[1fr_110px_36px] items-center gap-2">
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                  <input value={category.name} onChange={(event) => updateCategory(index, 'name', event.target.value)} className="min-w-0 w-full bg-transparent text-xs font-semibold text-slate-700 outline-none" aria-label={`Nome da categoria ${index + 1}`} />
                </label>
                <label className="flex items-center rounded-xl border border-slate-200 px-2 py-2 text-xs text-slate-500">
                  R$<input type="number" min="0" step="0.01" value={category.value} onChange={(event) => updateCategory(index, 'value', event.target.value)} className="min-w-0 w-full bg-transparent pl-1 text-right font-bold text-slate-800 outline-none" aria-label={`Valor de ${category.name}`} />
                </label>
                <button type="button" onClick={() => setCategories((current) => current.filter((_, currentIndex) => currentIndex !== index))} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Excluir ${category.name}`}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          <form onSubmit={addCategory} className="mt-4 grid grid-cols-[1fr_110px_40px] gap-2 border-t border-slate-100 pt-4">
            <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Nova categoria" className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-400" />
            <input type="number" min="0" step="0.01" value={newValue} onChange={(event) => setNewValue(event.target.value)} placeholder="Valor" className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-400" />
            <button type="submit" disabled={!newCategory.trim() || newValue === ''} className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white disabled:opacity-40" aria-label="Adicionar categoria"><Plus size={16} /></button>
          </form>
        </section>

        <section className="card">
          <h2 className="text-sm font-extrabold text-slate-950">Resumo diário (médio)</h2>
          <p className="mb-4 text-xs text-slate-500">R$ {dailyAverage.toLocaleString('pt-BR')}</p>
          <div className="h-40">
            <ResponsiveContainer>
              <BarChart data={chartDaily}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

    </div>
  );
}
