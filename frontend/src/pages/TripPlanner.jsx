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
  const [activeDayId, setActiveDayId] = useState(trip.days[0].id);
  const day = trip.days.find((item) => item.id === activeDayId) || trip.days[0];

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
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          return <button key={tab.label} className={`tab-btn flex items-center gap-1 ${index === 0 ? 'tab-btn-active' : ''}`}><Icon size={13} /> {tab.label}</button>;
        })}
      </div>

      <DaySelector days={trip.days} activeDayId={activeDayId} onSelect={setActiveDayId} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-950">{day.label} - {day.city}</h2>
          <button type="button" className="text-xs font-bold text-brand-700">Editar dia</button>
        </div>
        <TimelineList stops={day.stops} compact />
      </section>

      <AddStopButton />
    </div>
  );
}
