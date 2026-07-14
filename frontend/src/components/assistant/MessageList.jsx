import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';

export function MessageList({ messages, loading, onRetry }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/80 px-3 py-4" aria-live="polite" aria-busy={loading}>
      {messages.map((message) => <ChatMessage key={message.id} message={message} onRetry={onRetry} />)}
      {loading && (
        <div className="flex items-center gap-2 pl-9 text-xs font-medium text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl rounded-bl-md border border-slate-100 bg-white shadow-sm">
            <LoaderCircle size={15} className="animate-spin text-brand-600" />
          </span>
          Preparando sua sugestão...
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
