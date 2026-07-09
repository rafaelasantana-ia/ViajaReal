import { CalendarDays, Globe2, Images, Languages, Shield, Signal, Sparkles, Star, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getDestinationById } from '../services/destinationService';

const tabs = ['Geral', 'Sobre', 'Clima', 'Custos', 'Dicas', 'Galeria'];
const highlightIcons = [Sparkles, Wallet, Globe2, Shield];

export function DestinationPage() {
  const destination = getDestinationById('japao');
  const [activeTab, setActiveTab] = useState('Geral');
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
    Sobre: 'Destino ideal para combinar tradição, tecnologia, bairros caminháveis e experiências gastronômicas marcantes.',
    Clima: 'Primavera e outono são os períodos mais confortáveis, com temperaturas amenas e bons eventos culturais.',
    Custos: `Estimativa mockada: ${destination.averageCost}. Passagens e hospedagem concentram a maior parte do orçamento.`,
    Dicas: 'Reserve hospedagem perto de estações, compre passes de transporte com antecedência e leve dinheiro para pequenos comércios.',
    Galeria: 'Galeria mockada com imagens do destino e pontos sugeridos para o roteiro.',
  };

  return (
    <div className="space-y-6">
      <section className="relative h-72 overflow-hidden rounded-3xl md:h-[360px]">
        <img src={destination.heroImage} alt={destination.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-4 right-4 text-white">
          <h1 className="text-3xl font-extrabold">{destination.name} <span className="text-base">{destination.countryCode}</span></h1>
          <p className="mt-1 flex items-center gap-2 text-sm"><Star size={15} fill="currentColor" className="text-amber-300" /> {destination.rating} ({destination.reports.toLocaleString('pt-BR')} relatos)</p>
        </div>
      </section>

      <div className="space-y-5">
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
              {[destination.heroImage, destination.thumb, 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=500&q=80'].map((image) => (
                <img key={image} src={image} alt="Galeria do Japão" className="h-28 rounded-xl object-cover" />
              ))}
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

        <Link to="/planner" className="primary-btn w-full">Planejar viagem para o Japão</Link>
      </div>
    </div>
  );
}
