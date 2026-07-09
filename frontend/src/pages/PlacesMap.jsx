import { Filter } from 'lucide-react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { PlaceCard } from '../components/cards/PlaceCard';
import { recommendPlaces } from '../services/aiService';

export function PlacesMap() {
  const places = recommendPlaces();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
      <section className="h-[420px] overflow-hidden rounded-3xl bg-slate-200 shadow-card lg:sticky lg:top-28">
        <MapContainer center={[35.6764, 139.6993]} zoom={12} scrollWheelZoom={false}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {places.map((place) => (
            <CircleMarker key={place.id} center={[place.lat, place.lng]} radius={11} pathOptions={{ color: place.color, fillColor: place.color, fillOpacity: 0.9 }}>
              <Popup>{place.title}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-white p-1 shadow-card">
          <button className="flex-1 rounded-xl bg-brand-600 py-2 text-xs font-bold text-white">Mapa</button>
          <button className="flex-1 rounded-xl py-2 text-xs font-bold text-slate-500">Lista</button>
          <button className="grid h-9 w-9 place-items-center rounded-xl text-slate-500"><Filter size={16} /></button>
        </div>

        <div className="card space-y-3">
          <h2 className="text-sm font-extrabold text-slate-950">Dia 1 - Tóquio</h2>
          {places.map((place) => <PlaceCard key={place.id} place={place} />)}
        </div>
      </section>
    </div>
  );
}
