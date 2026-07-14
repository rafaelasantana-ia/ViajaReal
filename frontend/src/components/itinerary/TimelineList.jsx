import { TimelineItem } from './TimelineItem';

export function TimelineList({ stops, compact = false, editable = false, onChange, onDelete }) {
  if (!stops.length) {
    return <div className="card text-center text-sm text-slate-500">Nenhuma parada adicionada para este dia.</div>;
  }

  return (
    <div>
      {stops.map((stop) => (
        <TimelineItem key={stop.id} stop={stop} compact={compact} editable={editable} onChange={onChange} onDelete={onDelete} />
      ))}
    </div>
  );
}
