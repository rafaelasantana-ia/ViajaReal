import { Plus } from 'lucide-react';

export function AddStopButton() {
  return (
    <button type="button" className="primary-btn w-full">
      <Plus size={16} />
      Adicionar parada
    </button>
  );
}
