import { CalendarDays, Globe2, Images, Languages, Shield, Signal, Sparkles, Star, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DestinationExperiencesSummary } from '../components/assistant/DestinationExperiencesSummary';
import { summarizeDestination, summarizeDestinationReports } from '../services/aiService';
import { getDestinationByName } from '../services/destinationService';
import { getLiveDestinationData } from '../services/externalDestinationService';

const tabs = ['Geral', 'Sobre', 'Clima', 'Custos', 'Dicas', 'Galeria'];
const highlightIcons = [Sparkles, Wallet, Globe2, Shield];

export function DestinationPage() {
  const [searchParams] = useSearchParams();
  const requestedDestination = searchParams.get('destination')?.trim() || 'Bonito';
  const localDestination = getDestinationByName(requestedDestination);
  const [liveData, setLiveData] = useState(null);
  const [destinationLoading, setDestinationLoading] = useState(!localDestination);
  const [destinationError, setDestinationError] = useState('');
  const [activeTab, setActiveTab] = useState('Geral');
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [experiencesSummary, setExperiencesSummary] = useState(null);
  const [experiencesLoading, setExperiencesLoading] = useState(false);
  const [experiencesError, setExperiencesError] = useState('');

  useEffect(() => {
    setAiSummary(null);
    setAiError('');
    setExperiencesSummary(null);
    setExperiencesError('');
    if (localDestination) {
      setLiveData(null);
      setDestinationError('');
      setDestinationLoading(false);
      return undefined;
    }

    let active = true;
    setDestinationLoading(true);
    setDestinationError('');
    getLiveDestinationData(requestedDestination)
      .then((result) => {
        if (active) setLiveData(result);
      })
      .catch((error) => {
        if (active) setDestinationError(error.message || 'Não foi possível carregar o destino.');
      })
      .finally(() => {
        if (active) setDestinationLoading(false);
      });
    return () => { active = false; };
  }, [localDestination, requestedDestination]);

  const destination = localDestination || (liveData ? {
    id: requestedDestination,
    name: liveData.location.city || requestedDestination,
    countryCode: liveData.location.country || '',
    location: [liveData.location.city, liveData.location.state, liveData.location.country].filter(Boolean).join(', '),
    rating: null,
    reports: 0,
    heroImage: liveData.images.images?.[0]?.url || '/images/destination-fallback.svg',
    thumb: liveData.images.images?.[0]?.url || '/images/destination-fallback.svg',
    summary: `Localização encontrada: ${liveData.location.normalized_name}. As informações exibidas nesta página vêm de fontes externas identificadas.`,
    bestSeason: 'Não informada pelas fontes consultadas',
    averageCost: 'Sem dados de custo',
    currency: 'Não informada',
    safety: 'Sem dados oficiais consultados',
    internet: 'Não informado',
    language: 'Não informado',
    climate: liveData.weather ? `${liveData.weather.current.condition}, ${liveData.weather.current.temperature_c} °C no momento da consulta. Máxima de ${liveData.weather.today.max_temperature_c} °C e mínima de ${liveData.weather.today.min_temperature_c} °C hoje.` : 'Clima indisponível no momento da consulta.',
    attentionPoints: [...(liveData.weather?.limitations || []), ...(liveData.limitations || [])],
    highlights: ['Localização verificada', ...(liveData.weather ? ['Clima atual', 'Previsão meteorológica'] : []), 'Imagem do destino'],
    isLive: true,
  } : null);

  if (destinationLoading) {
    return <div className="card text-sm font-semibold text-slate-600">Carregando dados de {requestedDestination}...</div>;
  }

  if (!destination) {
    return (
      <section className="card space-y-3">
        <h1 className="text-lg font-extrabold text-slate-950">Destino não encontrado</h1>
        <p className="text-sm text-rose-700">{destinationError || 'Não foi possível localizar esse destino.'}</p>
        <Link to="/" className="ghost-btn w-fit">Voltar ao Dashboard</Link>
      </section>
    );
  }

  const handleAISummary = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const response = await summarizeDestination(destination.name, destination.highlights);
      setAiSummary(response.data);
    } catch (error) {
      setAiError(error.message || 'Não foi possível gerar o resumo.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExperiencesSummary = async () => {
    setExperiencesLoading(true);
    setExperiencesError('');
    try {
      setExperiencesSummary(await summarizeDestinationReports(destination.name));
    } catch (error) {
      setExperiencesError(error.message || 'Não foi possível analisar as experiências.');
    } finally {
      setExperiencesLoading(false);
    }
  };
  const facts = [
    { label: 'Melhor época', value: destination.bestSeason, icon: CalendarDays },
    { label: 'Custo médio', value: destination.averageCost, icon: Wallet },
    { label: 'Moeda', value: destination.currency, icon: Globe2 },
    { label: 'Nível de segurança', value: destination.safety, icon: Shield },
    { label: 'Internet', value: destination.internet, icon: Signal },
    { label: 'Idioma', value: destination.language, icon: Languages },
  ];

  const tabContent = {
    Geral: destination.summary,
    Sobre: destination.summary,
    Clima: destination.climate || 'Não informado nos dados mockados.',
    Custos: destination.isLive ? destination.averageCost : `Estimativa mockada: ${destination.averageCost}.`,
    Dicas: destination.attentionPoints?.join(' · ') || 'Não informado nos dados mockados.',
    Galeria: destination.isLive ? `Imagens fornecidas por ${liveData.images.source?.name || 'fallback local'}.` : 'Galeria mockada com imagens do destino e pontos sugeridos para o roteiro.',
  };

  return (
    <div className="space-y-6">
      <section className="relative h-72 overflow-hidden rounded-3xl md:h-[360px]">
        <img src={destination.heroImage} alt={destination.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-4 right-4 text-white">
          <h1 className="text-3xl font-extrabold">{destination.name} <span className="text-base">{destination.countryCode}</span></h1>
          {destination.rating ? <p className="mt-1 flex items-center gap-2 text-sm"><Star size={15} fill="currentColor" className="text-amber-300" /> {destination.rating} ({destination.reports.toLocaleString('pt-BR')} relatos)</p> : <p className="mt-1 text-sm">{destination.location} · dados externos</p>}
        </div>
      </section>

      <div className="space-y-5">
        {destination.isLive ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
            Localização: Nominatim/OpenStreetMap · clima: {liveData.weather ? 'Open-Meteo' : 'indisponível'} · imagem: {liveData.images.source?.name || 'fallback local'}. A previsão meteorológica é uma estimativa, não uma garantia.
          </div>
        ) : null}
        <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`tab-btn ${activeTab === tab ? 'tab-btn-active' : ''}`}>{tab}</button>
          ))}
        </div>

        <section className="card">
          <h2 className="text-sm font-extrabold text-slate-950">{activeTab === 'Geral' ? 'Resumo do destino' : activeTab}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{tabContent[activeTab]}</p>
          {activeTab === 'Galeria' ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[destination.heroImage, destination.thumb].map((image) => (
                <img key={image} src={image} alt={`Galeria de ${destination.name}`} className="h-28 rounded-xl object-cover" />
              ))}
            </div>
          ) : null}
        </section>

        {destination.isLive ? (
          <section className="card">
            <h2 className="text-base font-extrabold text-slate-950">Resumo das experiências</h2>
            <p className="mt-2 text-sm text-slate-600">Ainda não há relatos internos mockados para {destination.name}. A aplicação não vai inventar experiências ou avaliações.</p>
          </section>
        ) : (
          <DestinationExperiencesSummary
            result={experiencesSummary}
            loading={experiencesLoading}
            error={experiencesError}
            onGenerate={handleExperiencesSummary}
          />
        )}

        <section className="card space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-950">Resumo inteligente</h2>
              <p className="text-xs text-slate-500">Combina informações do destino e relatos pela camada central de IA.</p>
            </div>
            <button type="button" className="ghost-btn shrink-0" onClick={handleAISummary} disabled={aiLoading || destination.isLive} title={destination.isLive ? 'Sem dados internos suficientes para gerar o resumo' : undefined}>
              <Sparkles size={15} /> {aiLoading ? 'Analisando...' : 'Gerar resumo'}
            </button>
          </div>
          {aiError ? <p className="text-sm font-semibold text-rose-700">{aiError}</p> : null}
          {aiSummary ? (
            <div className="rounded-xl bg-brand-50 p-4 text-sm text-slate-700">
              <p>{aiSummary.summary}</p>
              <p className="mt-2 text-xs font-semibold text-brand-700">Segurança: {aiSummary.safety} · Custo médio: {aiSummary.average_cost}</p>
            </div>
          ) : null}
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {facts.map((fact) => {
            const Icon = fact.icon;
            return (
              <article key={fact.label} className="card p-3">
                <Icon size={16} className="text-brand-600" />
                <p className="mt-2 text-[11px] text-slate-500">{fact.label}</p>
                <h3 className="text-xs font-extrabold text-slate-950">{fact.value}</h3>
              </article>
            );
          })}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-950">Destaques</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {destination.highlights.map((highlight, index) => {
              const Icon = highlightIcons[index] || Images;
              return (
                <div key={highlight} className="rounded-2xl bg-white p-3 text-center shadow-card">
                  <Icon size={18} className="mx-auto text-brand-600" />
                  <p className="mt-2 text-[10px] font-bold text-slate-700">{highlight}</p>
                </div>
              );
            })}
          </div>
        </section>

        <Link to={`/planner?destination=${encodeURIComponent(destination.name)}`} className="primary-btn w-full">Planejar viagem para {destination.name}</Link>
      </div>
    </div>
  );
}
