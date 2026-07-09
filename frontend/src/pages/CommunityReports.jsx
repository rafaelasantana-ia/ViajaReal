import { Filter } from 'lucide-react';
import { ReportCard } from '../components/cards/ReportCard';
import { getCommunityReports } from '../services/communityService';

const filters = ['Mais recentes', 'Mais úteis', 'Custo', 'Segurança'];

export function CommunityReports() {
  const reports = getCommunityReports('Japão');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-950">Relatos sobre Japão</h1>
          <p className="text-xs text-slate-500">2.456 relatos</p>
        </div>
        <button type="button" className="ghost-btn px-3 py-2"><Filter size={14} /> Filtrar</button>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-100">
        {filters.map((filter, index) => <button key={filter} className={`tab-btn ${index === 0 ? 'tab-btn-active' : ''}`}>{filter}</button>)}
      </div>

      <section className="grid gap-3 lg:grid-cols-2">
        {reports.map((report) => <ReportCard key={report.id} report={report} />)}
      </section>

      <button type="button" className="primary-btn w-full">Compartilhar relato</button>
    </div>
  );
}
