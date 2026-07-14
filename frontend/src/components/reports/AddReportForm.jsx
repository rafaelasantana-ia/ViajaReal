import { AlertTriangle, Camera, Check, RotateCcw, Send, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { improveReportWithAI } from '../../services/aiService';

const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100';
const emptyExpenses = { lodging: '', food: '', transport: '', activities: '' };
const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function responseList(title, values, emptyLabel) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
      {values.length > 0 ? <ul className="mt-1 space-y-1 text-xs text-slate-600">{values.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-1 text-xs text-slate-400">{emptyLabel}</p>}
    </div>
  );
}

export function AddReportForm({ onPublish }) {
  const [form, setForm] = useState({ destination: 'Bonito', originalText: '', tripType: '', expenses: emptyExpenses, rating: '' });
  const [review, setReview] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photos, setPhotos] = useState([]);
  const photoInputRef = useRef(null);
  const objectUrlsRef = useRef(new Set());

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  const addPhotos = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const invalidType = files.find((file) => !ALLOWED_PHOTO_TYPES.has(file.type));
    if (invalidType) return setError('Use somente imagens JPG, PNG ou WebP.');
    const oversized = files.find((file) => file.size > MAX_PHOTO_SIZE);
    if (oversized) return setError('Cada foto pode ter no máximo 5 MB.');
    const availableSlots = MAX_PHOTOS - photos.length;
    if (availableSlots <= 0) return setError('Você pode adicionar no máximo 5 fotos.');
    const selected = files.slice(0, availableSlots).map((file) => {
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.add(url);
      return { id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`, name: file.name, file, url };
    });
    setPhotos((current) => [...current, ...selected]);
    setError(files.length > availableSlots ? `Foram adicionadas ${availableSlots} fotos. O limite é 5.` : '');
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const removePhoto = (photo) => {
    URL.revokeObjectURL(photo.url);
    objectUrlsRef.current.delete(photo.url);
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const numericExpenses = Object.fromEntries(
    Object.entries(form.expenses)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, Number(value)]),
  );

  const organizeReport = async () => {
    if (!form.destination.trim()) return setError('Informe o destino.');
    if (form.originalText.trim().length < 20) return setError('Escreva pelo menos 20 caracteres no relato original.');
    setLoading(true);
    setError('');
    setAccepted(false);
    try {
      const response = await improveReportWithAI({
        destination: form.destination.trim(),
        originalText: form.originalText.trim(),
        tripType: form.tripType,
        expenses: numericExpenses,
        rating: form.rating,
      });
      setReview({ ...response, originalText: form.originalText });
      setEditedText(response.improved_text);
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível organizar o relato.');
    } finally {
      setLoading(false);
    }
  };

  const acceptImprovement = () => {
    setForm((current) => ({ ...current, originalText: editedText }));
    setAccepted(true);
  };

  const discardImprovement = () => {
    setReview(null);
    setEditedText('');
    setAccepted(false);
  };

  const publish = async () => {
    if (form.originalText.trim().length < 20) return setError('Escreva o relato antes de publicar.');
    setPublishing(true);
    setError('');
    setSaved(false);
    try {
      await onPublish({ ...form, expenses: numericExpenses, photos: photos.map(({ name, file }) => ({ name, file })) });
      photos.forEach((photo) => {
        URL.revokeObjectURL(photo.url);
        objectUrlsRef.current.delete(photo.url);
      });
      setForm({ destination: 'Bonito', originalText: '', tripType: '', expenses: emptyExpenses, rating: '' });
      setReview(null);
      setEditedText('');
      setAccepted(false);
      setPhotos([]);
      setSaved(true);
    } catch (publishError) {
      setError(publishError.message || 'Não foi possível salvar o relato na aplicação.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className="card space-y-5" aria-labelledby="add-report-title">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Adicionar Relato</p>
        <h2 id="add-report-title" className="mt-1 text-lg font-extrabold text-slate-950">Compartilhe sua experiência</h2>
        <p className="mt-1 text-xs text-slate-500">Escreva primeiro com suas próprias palavras. A IA só organiza o conteúdo fornecido.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs font-bold text-slate-700">Destino *
          <input className={inputClass} value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} maxLength={120} />
        </label>
        <label className="text-xs font-bold text-slate-700">Tipo de viagem
          <select className={inputClass} value={form.tripType} onChange={(event) => setForm({ ...form, tripType: event.target.value })}>
            <option value="">Não informado</option><option value="solo">Solo</option><option value="casal">Casal</option><option value="família">Família</option><option value="amigos">Amigos</option><option value="aventura">Aventura</option>
          </select>
        </label>
        <label className="text-xs font-bold text-slate-700 md:col-span-2">Relato original *
          <textarea className={`${inputClass} min-h-36 resize-y`} value={form.originalText} onChange={(event) => { setForm({ ...form, originalText: event.target.value.slice(0, 12000) }); setAccepted(false); }} placeholder="Conte o que aconteceu, os lugares visitados e suas impressões..." />
          <span className="mt-1 block text-right text-[10px] font-normal text-slate-400">{form.originalText.length}/12000</span>
        </label>
      </div>

      <fieldset>
        <legend className="flex items-center gap-2 text-xs font-bold text-slate-700"><Camera size={15} /> Fotos da viagem</legend>
        <p className="mt-1 text-[11px] text-slate-400">Adicione até 5 fotos em JPG, PNG ou WebP, com no máximo 5 MB cada. As fotos são salvas com o relato neste navegador.</p>
        <label
          className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition hover:border-brand-300 hover:bg-brand-50"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); addPhotos(event.dataTransfer.files); }}
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand-700 shadow-card"><Upload size={19} /></span>
          <span className="mt-2 text-sm font-bold text-slate-700">Selecionar fotos</span>
          <span className="mt-1 text-xs text-slate-500">Clique ou arraste as imagens para esta área</span>
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => addPhotos(event.target.files)} />
        </label>
        {photos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img src={photo.url} alt={`Pré-visualização de ${photo.name}`} className="h-28 w-full object-cover" />
                <button type="button" onClick={() => removePhoto(photo)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-slate-950/75 text-white shadow-lg transition hover:bg-rose-600" aria-label={`Remover ${photo.name}`}>
                  <Trash2 size={14} />
                </button>
                <p className="truncate px-2 py-1.5 text-[10px] text-slate-500">{photo.name}</p>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-xs font-bold text-slate-700">Gastos informados</legend>
        <p className="mt-1 text-[11px] text-slate-400">Estes valores não são enviados ao modelo e nunca serão alterados pela IA.</p>
        <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Object.entries({ lodging: 'Hospedagem', food: 'Alimentação', transport: 'Transporte', activities: 'Passeios' }).map(([key, label]) => (
            <label key={key} className="text-[11px] font-semibold text-slate-600">{label}
              <input className={inputClass} type="number" min="0" step="10" value={form.expenses[key]} onChange={(event) => setForm({ ...form, expenses: { ...form.expenses, [key]: event.target.value } })} placeholder="R$ 0" />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block max-w-xs text-xs font-bold text-slate-700">Sua avaliação
        <select className={inputClass} value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}>
          <option value="">Não informar</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} estrela{rating > 1 ? 's' : ''}</option>)}
        </select>
        <span className="mt-1 block text-[11px] font-normal text-slate-400">A IA não sugere nem modifica sua nota.</span>
      </label>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</div>}
      {saved && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700" role="status"><Check size={16} className="mr-2 inline" />Relato salvo na aplicação.</div>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" className="ghost-btn" onClick={organizeReport} disabled={loading || !form.originalText.trim()}><Sparkles size={16} /> {loading ? 'Organizando relato...' : 'Organizar relato com IA'}</button>
        <button type="button" className="primary-btn" onClick={publish} disabled={loading || publishing || form.originalText.trim().length < 20}><Send size={16} /> {publishing ? 'Salvando relato...' : 'Publicar relato'}</button>
      </div>

      {review && (
        <section className="space-y-4 border-t border-slate-200 pt-5" aria-label="Revisão da IA">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><p className="flex items-start gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> A IA organiza o texto, mas não verifica a veracidade do relato. Revise antes de aceitar.</p></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-xs font-bold text-slate-700">Texto original preservado
              <textarea className={`${inputClass} min-h-64 resize-none bg-slate-50`} value={review.originalText} readOnly />
            </label>
            <label className="text-xs font-bold text-slate-700">Texto melhorado — editável
              <textarea className={`${inputClass} min-h-64 resize-y`} value={editedText} onChange={(event) => { setEditedText(event.target.value); setAccepted(false); }} />
            </label>
          </div>
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-3"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Resumo curto</p><p className="mt-1 text-sm text-slate-700">{review.summary}</p></div>
            {responseList('Pontos positivos', review.positive_points, 'Nenhum ponto positivo foi extraído.')}
            {responseList('Pontos negativos', review.negative_points, 'Nenhum ponto negativo foi extraído.')}
            {responseList('Lugares mencionados', review.mentioned_places, 'Nenhum lugar foi identificado no texto.')}
            {responseList('Categorias sugeridas', review.suggested_tags, 'Nenhuma categoria sugerida.')}
            {responseList('Informações ausentes', review.missing_information, 'Nenhuma ausência identificada.')}
            {responseList('Limitações', review.limitations, 'Nenhuma limitação retornada.')}
          </div>
          {accepted && <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><Check size={16} /> Texto melhorado aceito. O original continua visível nesta revisão.</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="primary-btn" onClick={acceptImprovement} disabled={!editedText.trim()}><Check size={16} /> Aceitar texto melhorado</button>
            <button type="button" className="ghost-btn" onClick={discardImprovement}><X size={16} /> Descartar melhoria</button>
            <button type="button" className="ghost-btn" onClick={organizeReport} disabled={loading}><RotateCcw size={16} /> Gerar novamente</button>
          </div>
        </section>
      )}
    </section>
  );
}
