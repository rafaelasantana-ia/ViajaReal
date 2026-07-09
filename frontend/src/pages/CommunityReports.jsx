import { Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ReportCard } from '../components/cards/ReportCard';
import { getCommunityReports } from '../services/communityService';

const filters = ['Mais recentes', 'Mais úteis', 'Custo', 'Segurança'];

export function CommunityReports() {
  const [reports, setReports] = useState(getCommunityReports('Japão'));
  const [activeFilter, setActiveFilter] = useState('Mais recentes');
  const [securityOnly, setSecurityOnly] = useState(false);

  const visibleReports = useMemo(() => {
    const filtered = securityOnly ? reports.filter((report) => report.safety === 'Alta') : reports;
    const sorted = [...filtered];

    if (activeFilter === 'Mais úteis') sorted.sort((first, second) => second.likes - first.likes);
    if (activeFilter === 'Custo') sorted.sort((first, second) => Number(first.cost.replace(/\D/g, '')) - Number(second.cost.replace(/\D/g, '')));
    if (activeFilter === 'Segurança') sorted.sort((first, second) => first.safety.localeCompare(second.safety));

    return sorted;
  }, [activeFilter, reports, securityOnly]);

  const handleShareReport = () => {
    setReports((current) => [
      {
        id: `report-${Date.now()}`,
        author: 'Rafaela S.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        destination: 'Japão',
        date: 'Abril/2026',
        duration: '12 dias',
        travelType: 'Confortável',
        text: 'Relato mockado publicado para validar o fluxo de compartilhamento no deploy.',
        cost: 'R$ 8.450',
        safety: 'Alta',
        likes: 0,
        image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=400&q=80',
      },
      ...current,
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-950">Relatos sobre Japão</h1>
          <p className="text-xs text-slate-500">{visibleReports.length.toLocaleString('pt-BR')} relatos exibidos</p>
        </div>
        <button type="button" className={`ghost-btn px-3 py-2 ${securityOnly ? 'border-brand-200 text-brand-700' : ''}`} onClick={() => setSecurityOnly((current) => !current)}>
          <Filter size={14} /> Segurança alta
        </button>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-100">
        {filters.map((filter) => (
          <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`tab-btn ${activeFilter === filter ? 'tab-btn-active' : ''}`}>{filter}</button>
        ))}
      </div>

      <section className="grid gap-3 lg:grid-cols-2">
        {visibleReports.map((report) => <ReportCard key={report.id} report={report} />)}
      </section>

      <button type="button" className="primary-btn w-full" onClick={handleShareReport}>Compartilhar relato mockado</button>
    </div>
  );
}
