import { Filter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AddReportForm } from '../components/reports/AddReportForm';
import { ReportCard } from '../components/cards/ReportCard';
import { summarizeTravelReports } from '../services/aiService';
import { getCommunityReports, getSavedCommunityReports, saveCommunityReport } from '../services/communityService';

const filters = ['Mais recentes', 'Mais úteis', 'Custo', 'Segurança'];

export function CommunityReports() {
  const [reports, setReports] = useState(() => getCommunityReports());
  const [activeFilter, setActiveFilter] = useState('Mais recentes');
  const [securityOnly, setSecurityOnly] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    let active = true;
    getSavedCommunityReports().then((savedReports) => {
      if (!active || !savedReports.length) return;
      setReports((current) => {
        const savedIds = new Set(savedReports.map((report) => report.id));
        return [...savedReports, ...current.filter((report) => !savedIds.has(report.id))];
      });
    });
    return () => { active = false; };
  }, []);

  const visibleReports = useMemo(() => {
    const filtered = securityOnly ? reports.filter((report) => report.safety === 'Alta') : reports;
    const sorted = [...filtered];

    if (activeFilter === 'Mais úteis') sorted.sort((first, second) => second.likes - first.likes);
    if (activeFilter === 'Custo') sorted.sort((first, second) => Number(first.cost.replace(/\D/g, '')) - Number(second.cost.replace(/\D/g, '')));
    if (activeFilter === 'Segurança') sorted.sort((first, second) => first.safety.localeCompare(second.safety));

    return sorted;
  }, [activeFilter, reports, securityOnly]);

  const handlePublishReport = async (report) => {
    const totalExpenses = Object.values(report.expenses).reduce((total, value) => total + Number(value || 0), 0);
    const uploadedPhotos = report.photos || [];
    const savedReport = await saveCommunityReport({
        id: `report-${Date.now()}`,
        createdAt: new Date().toISOString(),
        author: 'Viajante anônimo',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        destination: report.destination,
        date: new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date()),
        duration: 'Não informada',
        travelType: report.tripType || 'Não informado',
        text: report.originalText,
        cost: totalExpenses > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses) : 'Não informado',
        safety: 'Não informada',
        rating: report.rating || null,
        likes: 0,
        photos: uploadedPhotos,
        image: uploadedPhotos[0]?.url || 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=400&q=80',
    });
    setReports((current) => [savedReport, ...current]);
  };

  const handleAISummary = async () => {
    if (!visibleReports.length) {
      setAiError('Adicione pelo menos um relato antes de gerar o resumo.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    try {
      const destinations = [...new Set(visibleReports.map((report) => report.destination).filter(Boolean))];
      const response = await summarizeTravelReports(destinations.length === 1 ? destinations[0] : 'Relatos da comunidade', visibleReports);
      setAiSummary(response.data);
    } catch (error) {
      setAiError(error.message || 'Não foi possível resumir os relatos.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-950">Relatos da comunidade</h1>
          <p className="text-xs text-slate-500">{visibleReports.length.toLocaleString('pt-BR')} relatos exibidos</p>
        </div>
        <button type="button" className={`ghost-btn px-3 py-2 ${securityOnly ? 'border-brand-200 text-brand-700' : ''}`} onClick={() => setSecurityOnly((current) => !current)}>
          <Filter size={14} /> Segurança alta
        </button>
      </div>

      <AddReportForm onPublish={handlePublishReport} />

      <div className="flex overflow-x-auto border-b border-slate-100">
        {filters.map((filter) => (
          <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`tab-btn ${activeFilter === filter ? 'tab-btn-active' : ''}`}>{filter}</button>
        ))}
      </div>

      <section className="card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-950">Resumo dos relatos</h2>
            <p className="text-xs text-slate-500">A IA analisa somente os relatos exibidos e não cria experiências.</p>
          </div>
          <button type="button" className="ghost-btn shrink-0" onClick={handleAISummary} disabled={aiLoading}>{aiLoading ? 'Analisando...' : 'Resumir com IA'}</button>
        </div>
        {aiError ? <p className="text-sm font-semibold text-rose-700">{aiError}</p> : null}
        {aiSummary ? <div className="rounded-xl bg-brand-50 p-4 text-sm text-slate-700"><p>{aiSummary.summary}</p><p className="mt-2 text-xs">Atenção: {aiSummary.attention_points?.join(' · ')}</p></div> : null}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {visibleReports.map((report) => <ReportCard key={report.id} report={report} />)}
      </section>
    </div>
  );
}
