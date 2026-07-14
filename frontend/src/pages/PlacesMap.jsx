import { Filter } from 'lucide-react';
import { useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { PlaceCard } from '../components/cards/PlaceCard';
import { getActiveTrip } from '../services/tripService';

export function PlacesMap() {
  const trip = getActiveTrip();
  const center = trip?.location && Number.isFinite(trip.location.lat) && Number.isFinite(trip.location.lng)
    ? [trip.location.lat, trip.location.lng]
    : [-14.235, -51.9253];
  const allPlaces = (trip?.days || []).flatMap((day, dayIndex) => day.stops.map((stop, stopIndex) => ({
    ...stop,
    order: stopIndex + 1,
    type: stop.category,
    lat: center[0] + (dayIndex * 0.003) + (stopIndex * 0.0015),
    lng: center[1] + (dayIndex * 0.003) - (stopIndex * 0.0015),
    color: '#7c3aed',
  })));
  const [view, setView] = useState('Mapa');
  const [gastronomyOnly, setGastronomyOnly] = useState(false);
  const places = gastronomyOnly ? allPlaces.filter((place) => place.type === 'Gastronomia') : allPlaces;

  if (!trip) {
    return (
      <section className="card space-y-3">
        <h1 className="text-lg font-extrabold text-slate-950">Nenhum mapa selecionado</h1>
        <p className="text-sm text-slate-600">Crie um planejamento para visualizar os lugares da viagem no mapa.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
      {view === 'Mapa' ? (
        <section className="h-[420px] overflow-hidden rounded-3xl bg-slate-200 shadow-card lg:sticky lg:top-28">
          <MapContainer center={center} zoom={12} scrollWheelZoom={false}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {places.map((place) => (
              <CircleMarker key={place.id} center={[place.lat, place.lng]} radius={11} pathOptions={{ color: place.color, fillColor: place.color, fillOpacity: 0.9 }}>
                <Popup>{place.title}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </section>
      ) : (
        <section className="card h-fit">
          <h2 className="text-sm font-extrabold text-slate-950">Lista de lugares</h2>
          <p className="mt-2 text-sm text-slate-600">Visualização alternativa dos pontos do roteiro, sincronizada com os dados mockados.</p>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-white p-1 shadow-card">
          {['Mapa', 'Lista'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold ${view === item ? 'bg-brand-600 text-white' : 'text-slate-500'}`}
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setGastronomyOnly((current) => !current)}
            className={`grid h-9 w-9 place-items-center rounded-xl ${gastronomyOnly ? 'bg-brand-50 text-brand-700' : 'text-slate-500'}`}
            aria-label="Filtrar gastronomia"
          >
            <Filter size={16} />
          </button>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-950">Dia 1 - {trip.destination}</h2>
            {gastronomyOnly ? <span className="pill">Gastronomia</span> : null}
          </div>
          {places.map((place) => <PlaceCard key={place.id} place={place} />)}
        </div>
      </section>
    </div>
  );
}
