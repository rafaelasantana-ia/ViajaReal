import { Bell, ChevronLeft, Heart, Search, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { currentUser } from '../../data/mockUser';
import { destinationDetailsPath, resolveDestinationSearch } from '../../services/destinationSearchService';

const titles = {
  '/': 'Dashboard',
  '/destination': 'Página de destino',
  '/planner': 'Planejador de roteiro',
  '/timeline': 'Timeline por dia',
  '/places': 'Mapa de lugares',
  '/costs': 'Controle de custos',
  '/community': 'Relatos da comunidade',
  '/profile': 'Perfil e configurações',
};

const subtitles = {
  '/': 'Planeje viagens com dados reais simulados e roteiros mockados.',
  '/planner': 'Escolha um destino e crie seu planejamento.',
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const title = titles[location.pathname] || 'ViajaReal';
  const [favoriteDestination, setFavoriteDestination] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (event) => {
    event.preventDefault();
    if (searching) return;
    setSearchError('');
    setSearching(true);
    try {
      const result = await resolveDestinationSearch(searchQuery);
      setSearchQuery('');
      navigate(destinationDetailsPath(result.name));
    } catch (error) {
      setSearchError(error.message || 'Destino não encontrado.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className={`grid h-9 w-9 place-items-center rounded-full bg-white shadow-card md:hidden ${isHome ? 'invisible' : ''}`}
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-extrabold text-slate-950 md:text-2xl">{title}</h1>
              {location.pathname === '/destination' ? (
                <button
                  type="button"
                  onClick={() => setFavoriteDestination((current) => !current)}
                  className={`grid h-8 w-8 place-items-center rounded-full bg-white shadow-card ${favoriteDestination ? 'text-rose-500' : 'text-slate-600'}`}
                  aria-label="Salvar destino"
                  title={favoriteDestination ? 'Destino salvo' : 'Salvar destino'}
                >
                  <Heart size={16} fill={favoriteDestination ? 'currentColor' : 'none'} />
                </button>
              ) : null}
            </div>
            <p className="hidden text-sm text-slate-500 md:block">{subtitles[location.pathname] || 'ViajaReal'}</p>
          </div>
        </div>

        <form className="relative hidden min-w-[260px] max-w-md flex-1 md:block" onSubmit={handleSearch}>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-500 shadow-card">
            <Search size={18} />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Buscar destino" maxLength={120} aria-label="Buscar destino" />
            <button type="submit" disabled={searching || !searchQuery.trim()} className="rounded-lg px-2 py-1 text-xs font-bold text-brand-700 disabled:opacity-40">{searching ? 'Buscando...' : 'Ir'}</button>
          </label>
          {searchError ? <p className="absolute left-2 right-2 top-full z-30 mt-1 rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white shadow-card" role="alert">{searchError}</p> : null}
        </form>

        <div className="flex items-center gap-3">
          <Bell size={18} className="text-slate-500" />
          <Link to="/profile" className="hidden items-center gap-2 md:flex">
            <img src={currentUser.avatar} alt={currentUser.name} className="h-9 w-9 rounded-full object-cover" />
            <span className="text-sm font-semibold text-slate-700">{currentUser.name.split(' ')[0]}</span>
          </Link>
          <UserRound size={18} className="text-slate-500 md:hidden" />
        </div>
      </div>
    </header>
  );
}
