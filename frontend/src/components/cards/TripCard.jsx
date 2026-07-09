import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TripCard({ trip }) {
  return (
    <Link to="/planner" className="card flex gap-3">
      <img src={trip.cover} alt={trip.title} className="h-24 w-24 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-950">{trip.destination}</h3>
            <p className="text-xs text-slate-500">{trip.period}</p>
            <p className="text-xs text-slate-500">{trip.daysCount} dias</p>
          </div>
          <ArrowRight size={18} className="mt-2 text-brand-600" />
        </div>
        <span className="mt-3 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">{trip.status}</span>
      </div>
    </Link>
  );
}
