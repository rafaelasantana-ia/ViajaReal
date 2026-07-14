import { Check, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AddStopButton } from '../components/itinerary/AddStopButton';
import { DaySelector } from '../components/itinerary/DaySelector';
import { TimelineList } from '../components/itinerary/TimelineList';
import { getActiveTrip } from '../services/tripService';

function loadTimeline(trip) {
  if (!trip) return [];
  try {
    return JSON.parse(localStorage.getItem(`viajareal-timeline-${trip.id}`) || 'null') || trip.days;
  } catch {
    return trip.days;
  }
}

export function DayTimeline() {
  const trip = getActiveTrip();
  const [days, setDays] = useState(() => loadTimeline(trip));
  const [activeDayId, setActiveDayId] = useState(() => days[0]?.id || null);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const activeDay = days.find((day) => day.id === activeDayId) || days[0] || null;

  useEffect(() => {
    if (trip) localStorage.setItem(`viajareal-timeline-${trip.id}`, JSON.stringify(days));
  }, [days, trip]);

  const handleAddStop = () => {
    if (!activeDay) return;
    const newStop = {
      id: `timeline-stop-${Date.now()}`,
      time: '20:45',
      title: 'Nova parada',
      category: 'Passeio',
      description: 'Adicione os detalhes desta parada.',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80',
    };
    setDays((current) => current.map((day) => day.id === activeDay.id ? { ...day, stops: [...day.stops, newStop] } : day));
    setEditing(true);
    setNotice('Parada adicionada. Preencha os detalhes e conclua a edição.');
  };

  const updateStop = (stopId, field, value) => setDays((current) => current.map((day) => day.id === activeDay.id ? { ...day, stops: day.stops.map((stop) => stop.id === stopId ? { ...stop, [field]: value } : stop) } : day));
  const deleteStop = (stopId) => setDays((current) => current.map((day) => day.id === activeDay.id ? { ...day, stops: day.stops.filter((stop) => stop.id !== stopId) } : day));

  if (!activeDay) {
    return <section className="card space-y-3"><h1 className="text-lg font-extrabold text-slate-950">Nenhum dia selecionado</h1><p className="text-sm text-slate-600">Crie um planejamento para visualizar a timeline da viagem.</p></section>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-lg font-extrabold text-slate-950">{activeDay.label} - {activeDay.city}</h1><p className="text-xs text-slate-500">{activeDay.date || 'Data a definir'}</p></div>
        <button type="button" className="flex shrink-0 items-center gap-1 text-xs font-bold text-brand-700" onClick={() => { setEditing((current) => !current); setNotice(editing ? 'Alterações salvas neste navegador.' : 'Edite os campos da timeline.'); }}>{editing ? <Check size={14} /> : <Pencil size={14} />} {editing ? 'Concluir edição' : 'Editar dia'}</button>
      </div>
      {notice && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">{notice}</div>}
      <DaySelector days={days} activeDayId={activeDay.id} onSelect={(dayId) => { setActiveDayId(dayId); setEditing(false); setNotice(''); }} />
      <TimelineList stops={activeDay.stops} editable={editing} onChange={updateStop} onDelete={deleteStop} />
      <AddStopButton onClick={handleAddStop} />
    </div>
  );
}
