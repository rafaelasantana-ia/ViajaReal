import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { AddStopButton } from '../components/itinerary/AddStopButton';
import { TimelineList } from '../components/itinerary/TimelineList';
import { getTripDay } from '../services/tripService';

export function DayTimeline() {
  const initialDay = getTripDay('day-2');
  const [stops, setStops] = useState(initialDay?.stops || []);
  const [notice, setNotice] = useState('');

  const handleAddStop = () => {
    if (!initialDay) return;
    setStops((current) => [
      ...current,
      {
        id: `timeline-stop-${Date.now()}`,
        time: '20:45',
        title: 'Nova parada',
        category: 'Gastronomia',
        description: 'Parada mockada adicionada pela timeline.',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80',
      },
    ]);
    setNotice('Parada adicionada na timeline mockada.');
  };

  if (!initialDay) {
    return (
      <section className="card space-y-3">
        <h1 className="text-lg font-extrabold text-slate-950">Nenhum dia selecionado</h1>
        <p className="text-sm text-slate-600">Crie um planejamento para visualizar a timeline da viagem.</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-950">{initialDay.label} - {initialDay.city}</h1>
          <p className="text-xs text-slate-500">13 de Abril (Domingo)</p>
        </div>
        <button type="button" className="flex items-center gap-1 text-xs font-bold text-brand-700" onClick={() => setNotice('Edição do dia ativada no modo mockado.')}><Pencil size={14} /> Editar dia</button>
      </div>
      {notice ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div> : null}
      <TimelineList stops={stops} />
      <AddStopButton onClick={handleAddStop} />
    </div>
  );
}
