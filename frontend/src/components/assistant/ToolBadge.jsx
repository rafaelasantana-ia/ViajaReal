import { Wrench } from 'lucide-react';

export function ToolBadge({ name }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
      <Wrench size={10} aria-hidden="true" />
      {name}
    </span>
  );
}
