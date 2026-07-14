import { CalendarDays, MapPin } from 'lucide-react';

export function TripPlanCard({ data }) {
  const plan = data?.itinerary || data?.itinerary_base;
  if (!plan) return null;

  const days = Array.isArray(plan.blocks)
    ? plan.blocks.map((block, index) => ({ day: block.period || index + 1, title: block.city, details: block.activities || [block.description].filter(Boolean) }))
    : (plan.itinerary || []).map((day) => ({ day: `Dia ${day.day}`, title: plan.destination?.name, details: (day.attractions || []).map((item) => item.name) }));

  return (
    <section className="mt-3 overflow-hidden rounded-xl border border-brand-100 bg-white" aria-label="Roteiro sugerido">
      <div className="flex items-center gap-2 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-800">
        <CalendarDays size={14} /> {plan.destination?.name || plan.destination || 'Roteiro'}
      </div>
      <div className="max-h-52 divide-y divide-slate-100 overflow-y-auto">
        {days.map((day, index) => (
          <div key={`${day.day}-${index}`} className="p-3">
            <p className="flex items-center gap-1 text-xs font-bold text-slate-800"><MapPin size={12} className="text-brand-600" /> {day.day}{day.title ? ` · ${day.title}` : ''}</p>
            {day.details.length > 0 ? (
              <ul className="mt-1 space-y-1 text-[11px] text-slate-600">
                {day.details.map((detail) => <li key={detail}>• {detail}</li>)}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
