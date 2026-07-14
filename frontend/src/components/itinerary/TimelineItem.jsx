import { MoreVertical, Trash2 } from 'lucide-react';

export function TimelineItem({ stop, compact = false, editable = false, onChange, onDelete }) {
  const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-400';
  return (
    <div className="grid grid-cols-[54px_1fr] gap-3">
      <div className="relative flex justify-center">
        <span className="absolute top-8 h-full w-px bg-brand-200" />
        <span className="z-10 mt-5 h-3 w-3 rounded-full border-2 border-white bg-brand-600 shadow" />
        {editable ? <input type="time" value={stop.time} onChange={(event) => onChange(stop.id, 'time', event.target.value)} className="absolute left-0 top-3 w-[52px] rounded border border-slate-200 bg-white px-1 py-1 text-[10px] font-bold outline-none" aria-label={`Horário de ${stop.title}`} /> : <span className="absolute left-0 top-4 text-xs font-bold text-slate-700">{stop.time}</span>}
      </div>
      <article className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
        <div className="min-w-0 flex-1">
          {editable ? <div className="space-y-2"><input value={stop.title} onChange={(event) => onChange(stop.id, 'title', event.target.value)} className={`${inputClass} font-bold`} placeholder="Nome da atividade" /><input value={stop.description} onChange={(event) => onChange(stop.id, 'description', event.target.value)} className={inputClass} placeholder="Descrição" /><input value={stop.category} onChange={(event) => onChange(stop.id, 'category', event.target.value)} className={inputClass} placeholder="Categoria" /></div> : <><h3 className="truncate text-sm font-extrabold text-slate-950">{stop.title}</h3><p className="text-xs text-slate-500">{stop.description}</p>{!compact ? <span className="mt-2 inline-flex text-[10px] font-bold text-brand-700">{stop.category}</span> : null}</>}
        </div>
        {!editable && stop.image ? <img src={stop.image} alt={stop.title} className="h-16 w-16 rounded-xl object-cover" /> : null}
        {editable ? <button type="button" onClick={() => onDelete(stop.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Excluir ${stop.title}`}><Trash2 size={15} /></button> : <MoreVertical size={16} className="text-slate-400" />}
      </article>
    </div>
  );
}
