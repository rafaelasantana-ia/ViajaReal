import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DestinationCard({ destination }) {
  return (
    <Link to="/destination" className="relative h-28 min-w-24 overflow-hidden rounded-xl shadow-card">
      <img src={destination.thumb} alt={destination.name} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute inset-x-2 bottom-2">
        <p className="text-xs font-extrabold text-white">{destination.name}</p>
        <p className="flex items-center gap-1 text-[10px] font-semibold text-white/90"><Star size={10} fill="currentColor" /> {destination.rating}</p>
      </div>
    </Link>
  );
}
