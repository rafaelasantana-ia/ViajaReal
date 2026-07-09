import { Pencil } from 'lucide-react';
import { AddStopButton } from '../components/itinerary/AddStopButton';
import { TimelineList } from '../components/itinerary/TimelineList';
import { getTripDay } from '../services/tripService';

export function DayTimeline() {
  const day = getTripDay('day-2');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-950">{day.label} - {day.city}</h1>
          <p className="text-xs text-slate-500">13 de Abril (Domingo)</p>
        </div>
        <button type="button" className="flex items-center gap-1 text-xs font-bold text-brand-700"><Pencil size={14} /> Editar dia</button>
      </div>
      <TimelineList stops={day.stops} />
      <AddStopButton />
    </div>
  );
}
