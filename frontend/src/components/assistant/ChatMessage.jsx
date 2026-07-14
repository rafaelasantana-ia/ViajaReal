import { AlertTriangle, Bot, UserRound } from 'lucide-react';
import { BudgetCard } from './BudgetCard';
import { ComparisonCard } from './ComparisonCard';
import { ToolBadge } from './ToolBadge';
import { TripPlanCard } from './TripPlanCard';

export function ChatMessage({ message, onRetry }) {
  if (message.role === 'error') {
    return (
      <div className="mx-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">
        <p className="flex items-start gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> <span>{message.content}</span></p>
        <button type="button" onClick={() => onRetry(message.retryText)} className="mt-2 font-bold text-rose-700 underline underline-offset-2">Tentar novamente</button>
      </div>
    );
  }

  const isUser = message.role === 'user';
  const response = message.response;
  return (
    <article className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Bot size={14} /></span>}
      <div className={`max-w-[84%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${isUser ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-sm'}`}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {!isUser && response && (
          <>
            {response.type === 'trip_plan' && <TripPlanCard data={response.data} />}
            {response.type === 'budget' && <BudgetCard data={response.data} />}
            {response.type === 'comparison' && <ComparisonCard data={response.data} />}
            {response.tools_used?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Ferramentas utilizadas">
                {response.tools_used.map((tool) => <ToolBadge key={tool} name={tool} />)}
              </div>
            )}
            {response.limitations?.length > 0 && (
              <aside className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10px] leading-relaxed text-amber-800">
                <p className="flex items-start gap-1 font-semibold"><AlertTriangle size={11} className="mt-0.5 shrink-0" /> Limitações</p>
                <ul className="mt-1 space-y-0.5">{response.limitations.map((item) => <li key={item}>• {item}</li>)}</ul>
              </aside>
            )}
          </>
        )}
      </div>
      {isUser && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600"><UserRound size={14} /></span>}
    </article>
  );
}
