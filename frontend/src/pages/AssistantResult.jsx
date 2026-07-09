import { Download, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateItinerary } from '../services/aiService';

function getResult() {
  try {
    return JSON.parse(sessionStorage.getItem('viajareal-assistant-result')) || generateItinerary();
  } catch {
    return generateItinerary();
  }
}

export function AssistantResult() {
  const result = getResult();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-lg font-extrabold text-slate-950">Seu roteiro personalizado</h1>
        <p className="text-xs text-slate-500">{result.destination} · {result.days} dias · {result.style}</p>
      </div>

      <section className="card">
        <h2 className="text-sm font-extrabold text-slate-950">Resumo da viagem</h2>
        <p className="mt-2 text-sm text-slate-600">{result.summary}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-500">Custo estimado</p><strong className="text-xs">R$ {result.estimatedCost.toLocaleString('pt-BR')}</strong></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-500">Segurança</p><strong className="text-xs">{result.safety}</strong></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-500">Melhor época</p><strong className="text-xs">{result.bestSeason}</strong></div>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-sm font-extrabold text-slate-950">Roteiro por blocos</h2>
        <div className="space-y-3">
          {result.blocks.map((block) => (
            <article key={`${block.period}-${block.city}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2">
              <div className="w-16 text-xs font-extrabold text-brand-700">{block.period}</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-slate-950">{block.city}</h3>
                <p className="truncate text-xs text-slate-500">{block.description}</p>
              </div>
              <img src={block.image} alt={block.city} className="h-14 w-16 rounded-xl object-cover" />
            </article>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="primary-btn"><Download size={16} /> Salvar roteiro</button>
        <Link to="/assistant" className="ghost-btn"><Pencil size={16} /> Editar roteiro</Link>
      </div>
    </div>
  );
}
