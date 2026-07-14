import { Send } from 'lucide-react';
import { useState } from 'react';

export function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;
    const message = value.trim();
    setValue('');
    onSend(message);
  };

  return (
    <div className="border-t border-slate-100 bg-white p-3 bottom-safe">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, 3000))}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder="Digite sua mensagem..."
          aria-label="Mensagem para o assistente"
          className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Enviar mensagem"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Send size={17} />
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-slate-400">Enter para enviar · Shift + Enter para nova linha</p>
    </div>
  );
}
