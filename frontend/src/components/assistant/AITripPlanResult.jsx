import { AlertTriangle, Bot, CheckCircle2, Clipboard, CloudSun, Image as ImageIcon, MapPin, MessageCircle, RefreshCw, Route, WalletCards, Wrench } from 'lucide-react';
import { ToolBadge } from './ToolBadge';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

export function AITripPlanResult({ result, externalData, onRegenerate, onSendToChat, onCopy, copyStatus, loading }) {
  if (!result) return null;
  const liveLocation = externalData?.location || result.live_context?.location;
  const liveWeather = externalData?.weather || result.live_context?.weather;
  const imageData = externalData?.images;
  const locationIsReal = liveLocation && !String(liveLocation.source_type || 'real').startsWith('mock');

  return (
    <section className="space-y-4" aria-labelledby="ai-plan-title">
      <div className="flex flex-col gap-3 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-700"><Bot size={15} /> Planejamento gerado por IA</p>
          <h2 id="ai-plan-title" className="mt-1 text-lg font-extrabold text-slate-950">Sua sugestão de viagem</h2>
        </div>
        {result.mock_data && <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">Dados mockados</span>}
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] font-bold">
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-800">Dados reais: localização, clima e imagens quando disponíveis</span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">Dados simulados: relatos, atrações e estimativas-base</span>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-violet-800">Conteúdo gerado por IA: síntese textual</span>
      </div>

      {(liveLocation || liveWeather || imageData?.images?.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-3">
          {imageData?.images?.[0] && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src={imageData.images[0].url} alt={`Vista de ${liveLocation?.city || 'destino'}`} className="h-40 w-full object-cover" />
              <div className="p-3 text-xs text-slate-600">
                <p className="flex items-center gap-1 font-bold text-slate-800"><ImageIcon size={13} /> {imageData.fallback ? 'Imagem local de fallback' : 'Imagem real da Pexels'}</p>
                {imageData.images[0].page_url && <a href={imageData.images[0].page_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-brand-700 underline">{imageData.images[0].photographer || 'Ver página original'}</a>}
              </div>
            </article>
          )}
          {liveLocation && (
            <article className="card">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-800"><MapPin size={15} /> {locationIsReal ? 'Localização real' : 'Localização simulada (fallback)'}</p>
              <p className="mt-2 text-sm font-extrabold text-slate-950">{liveLocation.city || liveLocation.normalized_name}</p>
              <p className="mt-1 text-xs text-slate-600">{[liveLocation.state, liveLocation.country].filter(Boolean).join(' · ')}</p>
              <p className="mt-2 text-[11px] text-slate-500">{liveLocation.latitude}, {liveLocation.longitude} · {liveLocation.source?.name || (locationIsReal ? 'Nominatim / OpenStreetMap' : 'mock_destinations')}</p>
            </article>
          )}
          {liveWeather && (
            <article className="card">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-800"><CloudSun size={15} /> Clima real · Open-Meteo</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">{liveWeather.current?.temperature_c} °C</p>
              <p className="mt-1 text-sm capitalize text-slate-600">{liveWeather.current?.condition}</p>
              <p className="mt-2 text-xs text-slate-600">Máx. {liveWeather.today?.max_temperature_c} °C · Mín. {liveWeather.today?.min_temperature_c} °C · Chuva {liveWeather.today?.rain_mm} mm</p>
              <p className="mt-2 text-[11px] font-semibold text-amber-700">Previsão é estimativa, não garantia.</p>
            </article>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="card lg:col-span-2">
          <h3 className="text-sm font-extrabold text-slate-950">Resumo</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{result.summary}</p>
          <div className="mt-4 rounded-xl bg-brand-50 p-3">
            <p className="text-xs font-bold text-brand-800">Adequação ao perfil</p>
            <p className="mt-1 text-sm text-brand-900">{result.profile_fit}</p>
          </div>
        </article>
        <article className="card">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><WalletCards size={15} /> Estimativa total</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-950">{money(result.estimated_total)}</p>
          <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">{result.budget_status}</p>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="card">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-emerald-800"><CheckCircle2 size={17} /> Pontos positivos</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">{result.positive_points.map((item) => <li key={item}>• {item}</li>)}</ul>
        </article>
        <article className="card">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-amber-800"><AlertTriangle size={17} /> Pontos de atenção</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">{result.attention_points.map((item) => <li key={item}>• {item}</li>)}</ul>
        </article>
      </div>

      <article className="card">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-950"><Route size={17} className="text-brand-600" /> Roteiro por dia</h3>
        {result.itinerary.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {result.itinerary.map((day) => (
            <div key={day.day} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-slate-900">Dia {day.day}</p>
                <span className="text-[11px] font-semibold text-slate-500">{money(day.estimated_activities_cost)}</span>
              </div>
              {day.activities.length > 0 && <ul className="mt-2 space-y-1 text-xs text-slate-600">{day.activities.map((activity) => <li key={activity}>• {activity}</li>)}</ul>}
            </div>
            ))}
          </div>
        ) : <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Roteiro indisponível porque não há atrações internas suficientes para este destino. Nenhuma atividade foi inventada.</p>}
      </article>

      {result.limitations.length > 0 && (
        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-amber-900"><AlertTriangle size={16} /> Limitações</h3>
          <ul className="mt-2 space-y-1 text-xs text-amber-800">{result.limitations.map((item) => <li key={item}>• {item}</li>)}</ul>
        </aside>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1 text-xs font-bold text-slate-500"><Wrench size={13} /> Tools:</span>
        {result.tools_used.map((tool) => <ToolBadge key={tool} name={tool} />)}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button type="button" className="ghost-btn" onClick={onRegenerate} disabled={loading}><RefreshCw size={16} /> Gerar novamente</button>
        <button type="button" className="ghost-btn" onClick={onSendToChat}><MessageCircle size={16} /> Enviar ao chatbot</button>
        <button type="button" className="ghost-btn" onClick={onCopy}><Clipboard size={16} /> {copyStatus || 'Copiar resultado'}</button>
      </div>
    </section>
  );
}
