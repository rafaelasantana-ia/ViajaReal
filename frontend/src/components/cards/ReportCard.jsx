import { Heart, MoreHorizontal } from 'lucide-react';

export function ReportCard({ report, compact = false }) {
  return (
    <article className="card">
      <div className="flex gap-3">
        <img src={report.avatar} alt={report.author} className="h-9 w-9 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950">{report.author}</h3>
              <p className="text-[11px] text-slate-500">{report.date} · {report.duration} · {report.travelType}</p>
            </div>
            <MoreHorizontal size={16} className="text-slate-400" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-700">{report.text}</p>
          {!compact ? (
            <div className="mt-3 flex gap-3">
              <img src={report.image} alt={report.destination} className="h-20 w-24 rounded-xl object-cover" />
              <div className="flex flex-col justify-end gap-2">
                <span className="pill bg-slate-100 text-slate-700">Gastos: {report.cost}</span>
                <span className="pill bg-emerald-50 text-emerald-700">Segurança: {report.safety}</span>
              </div>
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{compact ? `${report.destination} · ${report.cost}` : ''}</span>
            <span className="flex items-center gap-1"><Heart size={14} /> {report.likes}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
