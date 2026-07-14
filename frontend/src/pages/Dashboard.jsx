import { CalendarDays, MapPinned, ReceiptText, Search, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DestinationCard } from '../components/cards/DestinationCard';
import { ReportCard } from '../components/cards/ReportCard';
import { TripCard } from '../components/cards/TripCard';
import { getRecentReports } from '../services/communityService';
import { getPopularDestinations } from '../services/destinationService';
import { getActiveTrip } from '../services/tripService';
import { currentUser } from '../data/mockUser';
import { destinationDetailsPath, resolveDestinationSearch } from '../services/destinationSearchService';

export function Dashboard() {
  const navigate = useNavigate();
  const trip = getActiveTrip();
  const destinations = getPopularDestinations();
  const reports = getRecentReports(1);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const filteredDestinations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return destinations;
    return destinations.filter((destination) =>
      `${destination.name} ${destination.location} ${destination.summary}`.toLowerCase().includes(normalizedQuery),
    );
  }, [destinations, query]);

  const handleDestinationSearch = async (event) => {
    event.preventDefault();
    if (searching) return;
    setSearchError('');
    setSearching(true);
    try {
      const result = await resolveDestinationSearch(query);
      navigate(destinationDetailsPath(result.name));
    } catch (error) {
      setSearchError(error.message || 'Não foi possível localizar esse destino.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl p-6 text-white shadow-soft md:p-8">
        <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/35 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl font-extrabold md:text-4xl">Olá, {currentUser.name.split(' ')[0]}!</h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-white/90 md:text-base">Explore o mundo com experiências reais de viajantes como você.</p>
          <form className="mt-6 max-w-xl" onSubmit={handleDestinationSearch}>
            <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-slate-500 shadow-card">
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Para onde você quer ir?" maxLength={120} aria-label="Destino" />
              <button type="submit" disabled={searching || !query.trim()} className="grid h-7 w-7 place-items-center rounded-full text-brand-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Pesquisar destino">
                <Search size={18} />
              </button>
            </label>
            {searching ? <p className="mt-2 text-xs font-semibold text-white">Localizando destino...</p> : null}
            {searchError ? <p className="mt-2 rounded-lg bg-rose-950/70 px-3 py-2 text-xs font-semibold text-white" role="alert">{searchError}</p> : null}
          </form>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-950">Sua próxima viagem</h2>
            <Link to="/planner" className="text-xs font-bold text-brand-700">Ver todas</Link>
          </div>
          <TripCard trip={trip} />
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { to: '/timeline', label: 'Timeline', icon: CalendarDays },
            { to: '/places', label: 'Mapa', icon: MapPinned },
            { to: '/costs', label: 'Custos', icon: ReceiptText },
            { to: '/community', label: 'Relatos', icon: UsersRound },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="rounded-2xl bg-white p-4 text-center shadow-card">
                <Icon size={22} className="mx-auto text-brand-600" />
                <span className="mt-2 block text-xs font-bold text-slate-700">{item.label}</span>
              </Link>
            );
          })}
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-950">Destinos populares</h2>
          <Link to="/destination" className="text-xs font-bold text-brand-700">Ver todos</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {filteredDestinations.map((destination) => <DestinationCard key={destination.id} destination={destination} />)}
        </div>
        {!filteredDestinations.length ? <div className="card text-sm text-slate-500">Nenhum destino encontrado para “{query}”.</div> : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-950">Relatos da comunidade</h2>
          <Link to="/community" className="flex items-center gap-1 text-xs font-bold text-brand-700"><UsersRound size={13} /> Ver relatos</Link>
        </div>
        {reports.map((report) => <ReportCard key={report.id} report={report} compact />)}
        {!reports.length ? <div className="card text-sm text-slate-500">Nenhum relato selecionado. Publique um relato para vê-lo aqui.</div> : null}
      </section>
    </div>
  );
}
