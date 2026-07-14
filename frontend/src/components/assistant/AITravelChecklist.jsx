import { AlertTriangle, CheckSquare, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { chatWithAssistant } from '../../services/aiService';

function storageKey(destination) {
  return `viajareal-checklist-${String(destination || 'viagem').trim().toLowerCase()}`;
}

function loadItems(destination) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(destination)) || '[]');
  } catch {
    return [];
  }
}

function parseChecklist(answer) {
  const ignored = /^(checklist|documentos|roupas|higiene|saúde|tecnologia|outros|observações|itens essenciais)\s*:?[\s*]*$/i;
  return String(answer || '').split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•☐]|\d+[.)])\s*/, '').trim())
    .filter((line) => line.length >= 3 && line.length <= 140 && !ignored.test(line))
    .slice(0, 20)
    .map((text, index) => ({ id: `ai-${Date.now()}-${index}`, text, checked: false }));
}

export function AITravelChecklist({ form, externalData }) {
  const destination = form.destination?.trim();
  const [items, setItems] = useState(() => loadItems(destination));
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const completed = useMemo(() => items.filter((item) => item.checked).length, [items]);

  useEffect(() => {
    setItems(loadItems(destination));
  }, [destination]);

  useEffect(() => {
    if (destination) localStorage.setItem(storageKey(destination), JSON.stringify(items));
  }, [destination, items]);

  const generateChecklist = async () => {
    setLoading(true);
    setError('');
    const weather = externalData?.weather;
    const climate = weather ? `${weather.current?.condition}, ${weather.current?.temperature_c} °C; mínima ${weather.today?.min_temperature_c} °C e máxima ${weather.today?.max_temperature_c} °C` : 'não consultado';
    const message = [
      'Crie um checklist prático para esta viagem usando somente o contexto abaixo.',
      `Destino: ${destination}. Duração: ${form.days} dias. Companhia: ${form.company}.`,
      `Interesses: ${(form.interests || []).join(', ') || 'não informados'}. Conforto: ${form.comfortLevel}.`,
      `Data aproximada: ${form.approximateDate || 'não informada'}. Clima consultado: ${climate}.`,
      'Retorne entre 10 e 16 itens, exatamente um item por linha, sem título, numeração ou explicações.',
      'Inclua bagagem, documentos, organização e itens coerentes com o clima. Não invente vistos, vacinas, leis ou exigências médicas; quando necessário, escreva apenas para verificar em fonte oficial.',
    ].join('\n');
    try {
      const response = await chatWithAssistant({ message, destination, currentPage: '/planner', formData: { ...form, intent: 'general' } });
      const generated = parseChecklist(response.answer || response.message);
      if (!generated.length) throw new Error('A IA não retornou uma lista válida.');
      setItems(generated);
    } catch (generationError) {
      setError(generationError.message || 'Não foi possível gerar o checklist.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (event) => {
    event.preventDefault();
    const text = newItem.trim();
    if (!text) return;
    setItems((current) => [...current, { id: `custom-${Date.now()}`, text, checked: false }]);
    setNewItem('');
  };

  return (
    <section className="card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="flex items-center gap-2 text-base font-extrabold text-slate-950"><CheckSquare size={18} className="text-brand-600" /> Checklist inteligente</h2><p className="mt-1 text-xs text-slate-500">Itens personalizados para {destination || 'sua viagem'}, salvos neste navegador.</p></div>
        <button type="button" className="ghost-btn shrink-0" onClick={generateChecklist} disabled={loading || !destination}><Sparkles size={16} className={loading ? 'animate-pulse' : ''} /> {loading ? 'Gerando...' : items.length ? 'Gerar novamente' : 'Gerar com IA'}</button>
      </div>
      {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}</div>}
      {items.length > 0 ? <><div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-700">{completed} de {items.length} concluídos</span><span className="text-slate-500">{Math.round((completed / items.length) * 100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(completed / items.length) * 100}%` }} /></div><div className="grid gap-2 md:grid-cols-2">{items.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"><input type="checkbox" checked={item.checked} onChange={() => setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, checked: !currentItem.checked } : currentItem))} className="h-4 w-4 accent-emerald-600" aria-label={`Marcar ${item.text}`} /><input value={item.text} onChange={(event) => setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, text: event.target.value } : currentItem))} className={`min-w-0 flex-1 bg-transparent text-xs outline-none ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`} /><button type="button" onClick={() => setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))} className="text-slate-400 hover:text-rose-600" aria-label={`Excluir ${item.text}`}><Trash2 size={14} /></button></div>)}</div></> : <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-800">Gere uma lista personalizada depois de preencher os dados da viagem.</div>}
      <form onSubmit={addItem} className="flex gap-2 border-t border-slate-100 pt-4"><input value={newItem} onChange={(event) => setNewItem(event.target.value)} maxLength={140} placeholder="Adicionar item manualmente" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /><button type="submit" disabled={!newItem.trim()} className="primary-btn px-4 disabled:opacity-40"><Plus size={16} /> Adicionar</button></form>
    </section>
  );
}
