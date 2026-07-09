import { GripHorizontal } from 'lucide-react';

export function PlaceCard({ place }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-card">
      <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold text-white" style={{ backgroundColor: place.color }}>
        {place.order}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-extrabold text-slate-950">{place.title}</h3>
        <p className="text-xs text-slate-500">{place.type}</p>
      </div>
      <GripHorizontal size={16} className="text-slate-400" />
    </article>
  );
}
