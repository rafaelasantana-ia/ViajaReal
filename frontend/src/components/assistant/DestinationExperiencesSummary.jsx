import { AlertTriangle, BarChart3, Bot, Calculator, Sparkles, UsersRound } from 'lucide-react';
import { ToolBadge } from './ToolBadge';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

function rankedList(items, emptyMessage) {
  if (!items?.length) return <p className="mt-2 text-xs text-slate-400">{emptyMessage}</p>;
  return <ul className="mt-2 space-y-1.5 text-xs text-slate-600">{items.map((item) => <li key={item.label} className="flex justify-between gap-3"><span>• {item.label}</span><strong className="shrink-0 text-slate-800">{item.count} relato(s)</strong></li>)}</ul>;
}

export function DestinationExperiencesSummary({ result, loading, error, onGenerate }) {
  const statistics = result?.calculated_statistics;
  const synthesis = result?.textual_synthesis;

  return (
    <section className="card space-y-4" aria-labelledby="experiences-summary-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="experiences-summary-title" className="text-base font-extrabold text-slate-950">Resumo das experiências</h2>
          <p className="mt-1 text-xs text-slate-500">Estatísticas calculadas no backend e síntese textual feita pela IA.</p>
        </div>
        <button type="button" className="ghost-btn shrink-0" onClick={onGenerate} disabled={loading}><Sparkles size={15} /> {loading ? 'Analisando relatos...' : 'Gerar resumo com IA'}</button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <p className="flex items-start gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> Os relatos representam experiências individuais e não condições atuais ou oficiais.</p>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-brand-800"><UsersRound size={13} /> {result.reports_analyzed} relatos utilizados</span>
            {result.mock_data && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">Dados mockados</span>}
            {result.tools_used.map((tool) => <ToolBadge key={tool} name={tool} />)}
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-sky-950"><Calculator size={16} /> Estatísticas calculadas no código</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-3"><p className="text-[10px] uppercase tracking-wide text-slate-400">Média de gastos</p><p className="mt-1 text-sm font-extrabold text-slate-900">{money(statistics.average_expenses)}</p></div>
              <div className="rounded-xl bg-white p-3"><p className="text-[10px] uppercase tracking-wide text-slate-400">Avaliação média</p><p className="mt-1 text-sm font-extrabold text-slate-900">{statistics.average_rating.toFixed(2)}/5</p></div>
              <div className="col-span-2 rounded-xl bg-white p-3"><p className="text-[10px] uppercase tracking-wide text-slate-400">Perfil mais compatível na amostra</p><p className="mt-1 text-sm font-bold capitalize text-slate-900">{statistics.compatible_traveler_profile}</p></div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div><p className="flex items-center gap-1 text-xs font-bold text-emerald-800"><BarChart3 size={13} /> Pontos positivos recorrentes</p>{rankedList(statistics.recurring_positive_points, 'Nenhuma repetição literal identificada.')}</div>
              <div><p className="flex items-center gap-1 text-xs font-bold text-rose-800"><BarChart3 size={13} /> Pontos negativos recorrentes</p>{rankedList(statistics.recurring_negative_points, 'Nenhuma repetição literal identificada.')}</div>
              <div><p className="flex items-center gap-1 text-xs font-bold text-brand-800"><BarChart3 size={13} /> Lugares mais mencionados</p>{rankedList(statistics.most_mentioned_places, 'Nenhum lugar mencionado.')}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-brand-950"><Bot size={16} /> Texto sintetizado pela IA</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{synthesis.opinion_general}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div><p className="text-xs font-bold text-slate-800">Recomendações recorrentes</p>{synthesis.recurring_recommendations.length > 0 ? <ul className="mt-2 space-y-1 text-xs text-slate-600">{synthesis.recurring_recommendations.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-2 text-xs text-slate-400">Nenhuma recomendação recorrente.</p>}</div>
              <div><p className="text-xs font-bold text-slate-800">Divergências entre relatos</p><ul className="mt-2 space-y-1 text-xs text-slate-600">{synthesis.divergences.map((item) => <li key={item}>• {item}</li>)}</ul></div>
            </div>
          </div>

          {result.limitations.length > 0 && <aside className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-bold text-amber-900">Limitações da análise</p><ul className="mt-2 space-y-1 text-xs text-amber-800">{result.limitations.map((item) => <li key={item}>• {item}</li>)}</ul></aside>}
        </div>
      )}
    </section>
  );
}
