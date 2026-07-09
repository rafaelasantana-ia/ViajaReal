export function ChatBubble({ children, from = 'assistant' }) {
  const isUser = from === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-card ${isUser ? 'bg-brand-600 text-white' : 'bg-white text-slate-700'}`}>
        {children}
      </div>
    </div>
  );
}
