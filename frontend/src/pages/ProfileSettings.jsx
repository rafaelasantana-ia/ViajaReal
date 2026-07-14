import { CalendarDays, ChevronRight, FileText, Heart, HelpCircle, LogOut, MapPin, Settings, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { currentUser } from '../data/mockUser';
import { getPopularDestinations } from '../services/destinationService';
import { getSavedCommunityReports } from '../services/communityService';
import { getActiveTrip } from '../services/tripService';

const PROFILE_KEY = 'viajareal-profile-settings';
const preferenceOptions = ['Natureza', 'Praia', 'Gastronomia', 'Cultura', 'Aventura', 'História'];

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') || {};
  } catch {
    return {};
  }
}

export function ProfileSettings() {
  const [selectedMenu, setSelectedMenu] = useState('Minhas viagens');
  const [reports, setReports] = useState([]);
  const [savedMessage, setSavedMessage] = useState('');
  const [storedProfile] = useState(loadProfile);
  const [preferences, setPreferences] = useState(storedProfile.preferences || ['Natureza', 'Gastronomia', 'Cultura']);
  const [account, setAccount] = useState(storedProfile.account || { name: currentUser.name, handle: currentUser.handle, email: 'rafaela@exemplo.com', city: 'São Paulo, SP' });
  const trip = getActiveTrip();
  const savedPlaces = getPopularDestinations().slice(0, 3);

  useEffect(() => {
    let active = true;
    getSavedCommunityReports().then((items) => { if (active) setReports(items); });
    return () => { active = false; };
  }, []);

  const persistProfile = (nextPreferences = preferences, nextAccount = account) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ preferences: nextPreferences, account: nextAccount }));
    setSavedMessage('Alterações salvas neste navegador.');
  };

  const togglePreference = (preference) => {
    const next = preferences.includes(preference) ? preferences.filter((item) => item !== preference) : [...preferences, preference];
    setPreferences(next);
    persistProfile(next, account);
  };

  const renderPanel = () => {
    if (selectedMenu === 'Minhas viagens') return trip ? (
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <img src={trip.cover} alt={trip.destination} className="h-44 w-full object-cover" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold text-slate-950">{trip.title}</h3><p className="mt-1 text-sm text-slate-500">{trip.period} · {trip.daysCount} dias</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{trip.status}</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Orçamento</span><strong className="mt-1 block text-slate-900">R$ {trip.budget.toLocaleString('pt-BR')}</strong></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Roteiro</span><strong className="mt-1 block text-slate-900">{trip.days.length} dias organizados</strong></div></div>
          <Link to="/planner" className="primary-btn mt-4 w-fit">Abrir planejamento</Link>
        </div>
      </div>
    ) : <Empty text="Você ainda não possui uma viagem planejada." action="Criar planejamento" to="/planner" />;

    if (selectedMenu === 'Relatos publicados') return reports.length ? (
      <div className="mt-5 space-y-3">{reports.map((report) => <article key={report.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{report.title || `Relato de ${report.destination}`}</h3><span className="text-xs text-slate-400">{report.rating ? `${report.rating}/5` : 'Publicado'}</span></div><p className="mt-1 text-xs font-semibold text-brand-700">{report.destination}</p><p className="mt-2 line-clamp-3 text-sm text-slate-600">{report.text || report.originalText}</p></article>)}</div>
    ) : <Empty text="Nenhum relato publicado neste navegador." action="Publicar relato" to="/community" />;

    if (selectedMenu === 'Lugares salvos') return <div className="mt-5 grid gap-3 sm:grid-cols-3">{savedPlaces.map((place) => <article key={place.id} className="overflow-hidden rounded-xl border border-slate-200"><img src={place.thumb || place.heroImage} alt={place.name} className="h-24 w-full object-cover" /><div className="p-3"><h3 className="text-sm font-bold text-slate-900">{place.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={11} /> {place.location}</p></div></article>)}</div>;

    if (selectedMenu === 'Documentos de viagem') return <div className="mt-5 space-y-3">{[['Documento de identidade', 'Válido'], ['Comprovante de reserva', trip ? 'Pendente de anexar' : 'Sem viagem ativa'], ['Seguro viagem', 'Não adicionado']].map(([name, status]) => <div key={name} className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><span className="flex items-center gap-3 text-sm font-semibold text-slate-800"><FileText size={17} className="text-brand-600" /> {name}</span><span className="text-xs text-slate-500">{status}</span></div>)}</div>;

    if (selectedMenu === 'Preferências de viagem') return <div className="mt-5"><p className="text-sm text-slate-600">Selecione seus principais interesses para personalizar futuros planejamentos.</p><div className="mt-4 flex flex-wrap gap-2">{preferenceOptions.map((preference) => <button key={preference} type="button" onClick={() => togglePreference(preference)} className={`rounded-full border px-3 py-2 text-xs font-bold ${preferences.includes(preference) ? 'border-brand-300 bg-brand-100 text-brand-800' : 'border-slate-200 text-slate-600'}`}>{preference}</button>)}</div>{savedMessage && <p className="mt-4 text-xs font-semibold text-emerald-700">{savedMessage}</p>}</div>;

    if (selectedMenu === 'Configurações da conta') return <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); persistProfile(); }}><ProfileInput label="Nome" value={account.name} onChange={(value) => setAccount({ ...account, name: value })} /><ProfileInput label="Usuário" value={account.handle} onChange={(value) => setAccount({ ...account, handle: value })} /><ProfileInput label="E-mail" type="email" value={account.email} onChange={(value) => setAccount({ ...account, email: value })} /><ProfileInput label="Cidade" value={account.city} onChange={(value) => setAccount({ ...account, city: value })} /><button type="submit" className="primary-btn w-fit sm:col-span-2"><Settings size={16} /> Salvar alterações</button>{savedMessage && <p className="text-xs font-semibold text-emerald-700 sm:col-span-2">{savedMessage}</p>}</form>;

    if (selectedMenu === 'Ajuda e suporte') return <div className="mt-5 space-y-3">{[['Como criar uma viagem?', 'Acesse o Planejador, preencha os dados e gere o roteiro com IA.'], ['Onde ficam meus dados?', 'Planejamentos, preferências e gastos são salvos neste navegador.'], ['A IA inventa preços?', 'Não. Cálculos são feitos pelo sistema e a IA apenas analisa os dados disponíveis.']].map(([question, answer]) => <details key={question} className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-bold text-slate-900">{question}</summary><p className="mt-2 text-sm text-slate-600">{answer}</p></details>)}</div>;

    return <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold text-amber-900">Sair da conta</p><p className="mt-1 text-sm text-amber-800">Esta versão demonstrativa não possui autenticação. Seus dados continuam salvos somente neste navegador.</p></div>;
  };

  const panelIcons = { 'Minhas viagens': CalendarDays, 'Relatos publicados': Star, 'Lugares salvos': Heart, 'Documentos de viagem': FileText, 'Preferências de viagem': Heart, 'Configurações da conta': Settings, 'Ajuda e suporte': HelpCircle };
  const PanelIcon = panelIcons[selectedMenu] || LogOut;

  return (
    <div className="space-y-6">
      <section className="relative h-64 overflow-hidden rounded-3xl text-white md:h-72"><img src={currentUser.banner} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-slate-900/10" /><div className="absolute bottom-5 left-4 right-4 flex items-center gap-4"><img src={currentUser.avatar} alt={currentUser.name} className="h-20 w-20 rounded-full border-4 border-white object-cover" /><div><h1 className="text-xl font-extrabold">{account.name}</h1><p className="text-xs text-white/80">{account.handle}</p><p className="text-xs text-white/80">{currentUser.since}</p></div></div></section>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5"><section className="grid grid-cols-4 rounded-2xl bg-white p-3 shadow-card">{currentUser.stats.map((stat) => <div key={stat.label} className="text-center"><strong className="block text-sm text-slate-950">{stat.value}</strong><span className="text-[10px] text-slate-500">{stat.label}</span></div>)}</section><section className="overflow-hidden rounded-2xl bg-white shadow-card">{currentUser.menu.map((item) => { const isExit = item === 'Sair'; return <button key={item} type="button" onClick={() => { setSelectedMenu(item); setSavedMessage(''); }} className={`flex w-full items-center justify-between border-b border-slate-100 px-4 py-4 text-left text-sm font-semibold last:border-none ${selectedMenu === item ? 'bg-brand-50 text-brand-700' : 'text-slate-700'}`}><span className="flex items-center gap-3">{isExit ? <LogOut size={16} /> : <span className="h-2 w-2 rounded-full bg-brand-200" />} {item}</span><ChevronRight size={16} className="text-slate-400" /></button>; })}</section></div>
        <section className="card min-h-[420px]"><h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950"><PanelIcon size={20} className="text-brand-600" /> {selectedMenu}</h2>{renderPanel()}</section>
      </div>
    </div>
  );
}

function Empty({ text, action, to }) {
  return <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center"><p className="text-sm text-slate-600">{text}</p><Link to={to} className="primary-btn mx-auto mt-4 w-fit">{action}</Link></div>;
}

function ProfileInput({ label, value, onChange, type = 'text' }) {
  return <label className="text-xs font-bold text-slate-700">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-400" /></label>;
}
