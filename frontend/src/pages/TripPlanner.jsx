import { CalendarDays, Map, MapPin, MessageSquareText, Plus, ReceiptText, Sparkles, Ticket, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AITripPlanResult } from '../components/assistant/AITripPlanResult';
import { AITravelChecklist } from '../components/assistant/AITravelChecklist';
import { AddStopButton } from '../components/itinerary/AddStopButton';
import { DaySelector } from '../components/itinerary/DaySelector';
import { TimelineList } from '../components/itinerary/TimelineList';
import { planTripWithAI } from '../services/aiService';
import { getLiveDestinationData } from '../services/externalDestinationService';
import { getActiveTrip, getSavedAIPlan, saveAIPlan } from '../services/tripService';

const tabs = [
  { label: 'Roteiro', icon: ReceiptText },
  { label: 'Mapa', icon: Map },
  { label: 'Custos', icon: WalletCards },
  { label: 'Reservas', icon: Ticket },
  { label: 'Dicas', icon: MessageSquareText },
];

const interestOptions = ['natureza', 'praia', 'gastronomia', 'cultura', 'aventura', 'história'];
const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100';

function approximateDate() {
  const date = new Date();
  date.setDate(date.getDate() + 60);
  return date.toISOString().slice(0, 10);
}

const initialForm = {
  destination: 'Bonito',
  days: 5,
  budget: 6500,
  travelType: 'Ecoturismo',
  company: 'casal',
  interests: ['natureza', 'aventura'],
  comfortLevel: 'Confortável',
  approximateDate: approximateDate(),
  observations: '',
};

function validateForm(form) {
  const errors = [];
  if (!form.destination.trim()) errors.push('Informe o destino.');
  if (!Number.isInteger(Number(form.days)) || Number(form.days) < 1 || Number(form.days) > 30) errors.push('Informe entre 1 e 30 dias.');
  if (!Number(form.budget) || Number(form.budget) <= 0) errors.push('Informe um orçamento maior que zero.');
  if (!form.travelType) errors.push('Selecione o tipo de viagem.');
  if (!form.company) errors.push('Selecione a companhia.');
  if (form.interests.length === 0) errors.push('Selecione pelo menos um interesse.');
  if (!form.comfortLevel) errors.push('Selecione o nível de conforto.');
  if (!form.approximateDate) errors.push('Informe uma data aproximada.');
  return errors;
}

function resultAsText(result) {
  const days = result.itinerary.map((day) => `Dia ${day.day}: ${day.activities.join(', ')}`).join('\n');
  return [
    result.summary,
    `Adequação ao perfil: ${result.profile_fit}`,
    `Estimativa total: R$ ${Number(result.estimated_total).toLocaleString('pt-BR')}`,
    `Status do orçamento: ${result.budget_status}`,
    `Pontos positivos: ${result.positive_points.join('; ')}`,
    `Pontos de atenção: ${result.attention_points.join('; ')}`,
    days,
    `Limitações: ${result.limitations.join('; ')}`,
    `Tools: ${result.tools_used.join(', ')}`,
  ].filter(Boolean).join('\n\n');
}

export function TripPlanner() {
  const [searchParams] = useSearchParams();
  const trip = getActiveTrip();
  const [savedPlan] = useState(() => getSavedAIPlan());
  const [days, setDays] = useState(trip?.days || []);
  const [activeDayId, setActiveDayId] = useState(trip?.days[0]?.id || null);
  const [activeTab, setActiveTab] = useState('Roteiro');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(() => ({
    ...initialForm,
    ...(savedPlan?.form || {}),
    destination: searchParams.get('destination')?.trim() || savedPlan?.form?.destination || initialForm.destination,
  }));
  const [formErrors, setFormErrors] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(savedPlan?.result || null);
  const [aiError, setAiError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [externalData, setExternalData] = useState(savedPlan?.externalData || null);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState('');
  const day = days.find((item) => item.id === activeDayId) || days[0] || null;

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleInterest = (interest) => setForm((current) => ({
    ...current,
    interests: current.interests.includes(interest)
      ? current.interests.filter((item) => item !== interest)
      : [...current.interests, interest],
  }));

  const generatePlan = async (event) => {
    event?.preventDefault();
    const errors = validateForm(form);
    setFormErrors(errors);
    if (errors.length > 0) return;
    setAiLoading(true);
    setAiError('');
    setCopyStatus('');
    setExternalLoading(true);
    setExternalError('');
    try {
      const [result, liveResult] = await Promise.all([
        planTripWithAI(form),
        getLiveDestinationData(form.destination).catch((error) => ({ error })),
      ]);
      setAiPlan(result);
      if (liveResult.error) setExternalError(liveResult.error.message);
      else setExternalData(liveResult);
      saveAIPlan({ form, result, externalData: liveResult.error ? null : liveResult });
      sessionStorage.setItem('viajareal-detailed-ai-plan', JSON.stringify(result));
      setNotice('Planejamento salvo neste navegador.');
    } catch (error) {
      setAiError(error.message || 'Não foi possível gerar o planejamento.');
    } finally {
      setAiLoading(false);
      setExternalLoading(false);
    }
  };

  const searchLiveData = async () => {
    if (!form.destination.trim()) {
      setExternalError('Informe um destino antes de pesquisar.');
      return;
    }
    setExternalLoading(true);
    setExternalError('');
    try {
      setExternalData(await getLiveDestinationData(form.destination));
    } catch (error) {
      setExternalError(error.message || 'Não foi possível consultar os dados reais.');
    } finally {
      setExternalLoading(false);
    }
  };

  const handleAddStop = () => {
    if (!activeDayId) {
      setNotice('Gere ou selecione um planejamento antes de adicionar paradas.');
      return;
    }
    const newStop = {
      id: `stop-${Date.now()}`,
      time: '20:30',
      title: 'Nova parada sugerida',
      category: 'Passeio',
      description: 'Parada mockada adicionada ao roteiro para simular edição.',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=300&q=80',
    };
    setDays((currentDays) => currentDays.map((currentDay) => (
      currentDay.id === activeDayId ? { ...currentDay, stops: [...currentDay.stops, newStop] } : currentDay
    )));
    setNotice('Parada adicionada ao roteiro mockado.');
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(resultAsText(aiPlan));
      setCopyStatus('Resultado copiado');
    } catch {
      setCopyStatus('Não foi possível copiar');
    }
  };

  const sendToChat = () => {
    const message = `Analise este planejamento e sugira próximos passos usando somente estes dados:\n${resultAsText(aiPlan)}`.slice(0, 2900);
    window.dispatchEvent(new CustomEvent('viajareal:chat:send', { detail: { message } }));
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-700"><Sparkles size={15} /> Planejar Viagem</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Crie seu planejamento com IA</h1>
          <p className="mt-1 text-sm text-slate-500">O resultado usa somente dados internos e ferramentas da aplicação.</p>
        </div>

        <form className="card" onSubmit={generatePlan} noValidate>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs font-bold text-slate-700">Destino *
              <input className={inputClass} value={form.destination} onChange={(event) => updateForm('destination', event.target.value)} maxLength={120} placeholder="Ex.: Bonito" />
              <button type="button" onClick={searchLiveData} disabled={externalLoading} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-700 disabled:opacity-50">
                <MapPin size={13} /> {externalLoading ? 'Consultando fontes...' : 'Pesquisar dados reais'}
              </button>
            </label>
            <label className="text-xs font-bold text-slate-700">Quantidade de dias *
              <input className={inputClass} type="number" min="1" max="30" value={form.days} onChange={(event) => updateForm('days', event.target.value)} />
            </label>
            <label className="text-xs font-bold text-slate-700">Orçamento *
              <input className={inputClass} type="number" min="1" step="50" value={form.budget} onChange={(event) => updateForm('budget', event.target.value)} />
            </label>
            <label className="text-xs font-bold text-slate-700">Tipo de viagem *
              <select className={inputClass} value={form.travelType} onChange={(event) => updateForm('travelType', event.target.value)}>
                {['Ecoturismo', 'Lazer', 'Cultura', 'Aventura', 'Descanso'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">Companhia *
              <select className={inputClass} value={form.company} onChange={(event) => updateForm('company', event.target.value)}>
                <option value="solo">Sozinho(a)</option><option value="casal">Casal</option><option value="família">Família</option><option value="amigos">Amigos</option>
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">Nível de conforto *
              <select className={inputClass} value={form.comfortLevel} onChange={(event) => updateForm('comfortLevel', event.target.value)}>
                {['Econômico', 'Confortável', 'Premium'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">Data aproximada *
              <div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-4 text-slate-400" size={16} /><input className={`${inputClass} pl-9`} type="date" value={form.approximateDate} onChange={(event) => updateForm('approximateDate', event.target.value)} /></div>
            </label>
            <fieldset className="md:col-span-2">
              <legend className="text-xs font-bold text-slate-700">Interesses *</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`rounded-full border px-3 py-2 text-xs font-semibold capitalize transition ${form.interests.includes(interest) ? 'border-brand-300 bg-brand-100 text-brand-800' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200'}`}>
                    {form.interests.includes(interest) && <Plus size={11} className="mr-1 inline rotate-45" />}{interest}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="text-xs font-bold text-slate-700 md:col-span-2 xl:col-span-3">Observações
              <textarea className={`${inputClass} min-h-24 resize-y`} value={form.observations} onChange={(event) => updateForm('observations', event.target.value.slice(0, 2000))} placeholder="Restrições, preferências ou necessidades importantes" />
            </label>
          </div>

          {formErrors.length > 0 && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert"><ul className="space-y-1">{formErrors.map((error) => <li key={error}>• {error}</li>)}</ul></div>}
          {aiError && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{aiError}</div>}
          {externalError && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800" role="status">Dados reais indisponíveis: {externalError}. O planejamento ainda pode usar os mocks existentes.</div>}

          <button type="submit" className="primary-btn mt-5 w-full sm:w-auto" disabled={aiLoading}>
            <Sparkles size={17} className={aiLoading ? 'animate-pulse' : ''} /> {aiLoading ? 'Gerando planejamento...' : 'Gerar planejamento com IA'}
          </button>
        </form>

        {notice && <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">{notice}</div>}
      </section>

      <AITripPlanResult result={aiPlan} externalData={externalData} onRegenerate={generatePlan} onSendToChat={sendToChat} onCopy={copyResult} copyStatus={copyStatus} loading={aiLoading} />

      {aiPlan && <AITravelChecklist form={form} externalData={externalData} />}

      {trip ? <section className="space-y-5 border-t border-slate-200 pt-7">
        <div className="flex items-center justify-between">
          <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Planejamento atual</p><h2 className="text-base font-extrabold text-slate-950">{trip.title}</h2><p className="text-xs text-slate-500">{trip.period} · {trip.daysCount} dias</p></div>
          <div className="flex -space-x-2">{trip.travelers.map((avatar) => <img key={avatar} src={avatar} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover" />)}</div>
        </div>

        <div className="flex overflow-x-auto border-b border-slate-100">
          {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.label} type="button" onClick={() => setActiveTab(tab.label)} className={`tab-btn flex items-center gap-1 ${activeTab === tab.label ? 'tab-btn-active' : ''}`}><Icon size={13} /> {tab.label}</button>; })}
        </div>
        {notice && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}
        <DaySelector days={days} activeDayId={activeDayId} onSelect={setActiveDayId} />
        {activeTab === 'Roteiro' ? (
          <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-950">{day.label} - {day.city}</h3><button type="button" className="text-xs font-bold text-brand-700" onClick={() => setNotice(`${day.label} marcado como editável no modo mockado.`)}>Editar dia</button></div><TimelineList stops={day.stops} compact /></div>
        ) : <div className="card"><h3 className="text-sm font-extrabold text-slate-950">{activeTab}</h3><p className="mt-2 text-sm text-slate-600">Conteúdo mockado de {activeTab.toLowerCase()} para a viagem ativa.</p></div>}
        <AddStopButton onClick={handleAddStop} />
      </section> : null}
    </div>
  );
}
