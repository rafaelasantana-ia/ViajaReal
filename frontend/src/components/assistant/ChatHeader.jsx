import { Plane, RotateCcw, X } from 'lucide-react';

export function ChatHeader({ onClose, onClear, hasMessages }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <Plane size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-extrabold text-slate-950">Assistente de Viagem</h2>
          <p className="text-[11px] text-emerald-600">Pronto para ajudar</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onClear}
          disabled={!hasMessages}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Limpar conversa"
          title="Limpar conversa"
        >
          <RotateCcw size={17} />
        </button>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar conversa">
          <X size={19} />
        </button>
      </div>
    </header>
  );
}
