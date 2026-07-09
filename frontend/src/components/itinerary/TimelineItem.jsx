import { MoreVertical } from 'lucide-react';

export function TimelineItem({ stop, compact = false }) {
  return (
    <div className="grid grid-cols-[54px_1fr] gap-3">
      <div className="relative flex justify-center">
        <span className="absolute top-8 h-full w-px bg-brand-200" />
        <span className="z-10 mt-5 h-3 w-3 rounded-full border-2 border-white bg-brand-600 shadow" />
        <span className="absolute left-0 top-4 text-xs font-bold text-slate-700">{stop.time}</span>
      </div>
      <article className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold text-slate-950">{stop.title}</h3>
          <p className="text-xs text-slate-500">{stop.description}</p>
          {!compact ? <span className="mt-2 inline-flex text-[10px] font-bold text-brand-700">{stop.category}</span> : null}
        </div>
        {stop.image ? <img src={stop.image} alt={stop.title} className="h-16 w-16 rounded-xl object-cover" /> : null}
        <MoreVertical size={16} className="text-slate-400" />
      </article>
    </div>
  );
}
