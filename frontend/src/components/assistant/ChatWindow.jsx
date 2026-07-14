import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { QuickSuggestions } from './QuickSuggestions';

export function ChatWindow({ messages, loading, onClose, onClear, onSend, onRetry }) {
  return (
    <section
      className="fixed inset-x-2 bottom-20 z-50 flex h-[calc(100dvh-6rem)] max-h-[42rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] sm:left-auto sm:right-4 sm:w-[24rem] md:bottom-6 md:right-6 md:h-[38rem] md:max-h-[calc(100dvh-3rem)]"
      role="dialog"
      aria-label="Assistente de Viagem"
    >
      <ChatHeader onClose={onClose} onClear={onClear} hasMessages={messages.length > 0} />
      <MessageList messages={messages} loading={loading} onRetry={onRetry} />
      {messages.length === 0 && <QuickSuggestions onSelect={onSend} disabled={loading} />}
      <ChatInput onSend={onSend} disabled={loading} />
    </section>
  );
}
