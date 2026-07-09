import { Plus } from 'lucide-react';

export function AddStopButton({ onClick, label = 'Adicionar parada' }) {
  return (
    <button type="button" className="primary-btn w-full" onClick={onClick}>
      <Plus size={16} />
      {label}
    </button>
  );
}
