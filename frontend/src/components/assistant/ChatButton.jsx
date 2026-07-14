import { Plane } from 'lucide-react';

export function ChatButton({ onClick, isOpen }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abrir Assistente de Viagem"
      aria-expanded={isOpen}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_14px_35px_rgba(109,40,217,0.38)] transition hover:-translate-y-0.5 hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200 md:bottom-6 md:right-6"
    >
      <Plane size={24} aria-hidden="true" />
    </button>
  );
}
