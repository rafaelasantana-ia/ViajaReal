import { Bot } from 'lucide-react';

export function AssistantLoading({ message }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-semibold text-slate-500 shadow-card">
      <Bot size={16} className="animate-pulse text-brand-600" />
      {message}
    </div>
  );
}
