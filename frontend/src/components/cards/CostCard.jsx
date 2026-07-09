export function CostCard({ category }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-none">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="text-xs font-semibold text-slate-700">{category.name}</span>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-slate-900">R$ {category.value.toLocaleString('pt-BR')}</p>
        <p className="text-[10px] text-slate-400">{category.percent}%</p>
      </div>
    </div>
  );
}
