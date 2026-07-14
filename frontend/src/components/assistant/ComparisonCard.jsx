import { Scale } from 'lucide-react';

const getMetric = (destination, key, fallback = '—') => destination?.[key] ?? fallback;

export function ComparisonCard({ data }) {
  const comparison = data?.comparison;
  if (!comparison) return null;
  const destinations = [comparison.first_destination, comparison.second_destination].filter(Boolean);
  if (destinations.length < 2) return null;

  return (
    <section className="mt-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3" aria-label="Comparação de destinos">
      <p className="mb-2 flex items-center gap-2 text-xs font-bold text-sky-900"><Scale size={15} /> Comparação</p>
      <div className="grid grid-cols-2 gap-2">
        {destinations.map((destination) => (
          <div key={destination.id || destination.name} className="min-w-0 rounded-lg bg-white p-2 text-center">
            <p className="truncate text-xs font-extrabold text-slate-900">{destination.name}</p>
            <p className="mt-1 text-[10px] text-slate-500">Segurança {getMetric(destination, 'safety_rating')}</p>
            <p className="text-[10px] text-slate-500">Transporte {getMetric(destination, 'transport_rating')}</p>
            <p className="mt-1 text-sm font-bold text-brand-700">{getMetric(destination, 'compatibility_score')} pts</p>
          </div>
        ))}
      </div>
      {comparison.recommendation && <p className="mt-2 text-[11px] leading-relaxed text-sky-900">{comparison.recommendation}</p>}
    </section>
  );
}
