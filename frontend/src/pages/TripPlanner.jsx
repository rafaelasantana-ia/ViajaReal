import { Map, MessageSquareText, ReceiptText, Ticket, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { AddStopButton } from '../components/itinerary/AddStopButton';
import { DaySelector } from '../components/itinerary/DaySelector';
import { TimelineList } from '../components/itinerary/TimelineList';
import { getActiveTrip } from '../services/tripService';

const tabs = [
  { label: 'Roteiro', icon: ReceiptText },
  { label: 'Mapa', icon: Map },
  { label: 'Custos', icon: WalletCards },
  { label: 'Reservas', icon: Ticket },
  { label: 'Dicas', icon: MessageSquareText },
];

export function TripPlanner() {
  const trip = getActiveTrip();
  const [days, setDays] = useState(trip.days);
  const [activeDayId, setActiveDayId] = useState(trip.days[0].id);
  const [activeTab, setActiveTab] = useState('Roteiro');
  const [notice, setNotice] = useState('');
  const day = days.find((item) => item.id === activeDayId) || days[0];

  const handleAddStop = () => {
    const newStop = {
      id: `stop-${Date.now()}`,
      time: '20:30',
      title: 'Nova parada sugerida',
      category: 'Passeio',
      description: 'Parada mockada adicionada ao roteiro para simular edição.',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=300&q=80',
    };

    setDays((currentDays) =>
      currentDays.map((currentDay) =>
        currentDay.id === activeDayId ? { ...currentDay, stops: [...currentDay.stops, newStop] } : currentDay,
      ),
    );
    setNotice('Parada adicionada ao roteiro mockado.');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-extrabold text-slate-950">{trip.title}</h1>
          <p className="text-xs text-slate-500">{trip.period} · {trip.daysCount} dias</p>
        </div>
        <div className="flex -space-x-2">
          {trip.travelers.map((avatar) => <img key={avatar} src={avatar} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover" />)}
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.label)}
              className={`tab-btn flex items-center gap-1 ${activeTab === tab.label ? 'tab-btn-active' : ''}`}
            >
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      {notice ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div> : null}

      <DaySelector days={days} activeDayId={activeDayId} onSelect={setActiveDayId} />

      {activeTab === 'Roteiro' ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-950">{day.label} - {day.city}</h2>
            <button type="button" className="text-xs font-bold text-brand-700" onClick={() => setNotice(`${day.label} marcado como editável no modo mockado.`)}>Editar dia</button>
          </div>
          <TimelineList stops={day.stops} compact />
        </section>
      ) : (
        <section className="card">
          <h2 className="text-sm font-extrabold text-slate-950">{activeTab}</h2>
          <p className="mt-2 text-sm text-slate-600">Conteúdo mockado de {activeTab.toLowerCase()} para a viagem ativa. A integração real pode consumir API futuramente.</p>
        </section>
      )}

      <AddStopButton onClick={handleAddStop} />
    </div>
  );
}
