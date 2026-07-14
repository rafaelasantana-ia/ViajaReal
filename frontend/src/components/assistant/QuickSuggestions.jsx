const INITIAL_SUGGESTIONS = [
  'Planejar uma viagem',
  'Estimar meu orçamento',
  'Buscar relatos',
  'Comparar destinos',
  'Gerar roteiro',
];

export function QuickSuggestions({ onSelect, disabled }) {
  return (
    <div className="px-4 pb-3">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Como posso ajudar?</p>
      <div className="flex flex-wrap gap-2">
        {INITIAL_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className="rounded-full border border-brand-100 bg-brand-50 px-3 py-2 text-left text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
