export function DaySelector({ days, activeDayId, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map((day) => (
        <button
          key={day.id}
          type="button"
          onClick={() => onSelect(day.id)}
          className={`min-w-16 rounded-xl px-3 py-2 text-center text-xs font-extrabold transition ${
            activeDayId === day.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'bg-white text-slate-700 shadow-card'
          }`}
        >
          <span className="block">{day.label}</span>
          <span className="text-[10px] opacity-75">{day.date}</span>
        </button>
      ))}
      <button type="button" className="grid min-w-10 place-items-center rounded-full bg-white text-xl font-semibold shadow-card">+</button>
    </div>
  );
}
