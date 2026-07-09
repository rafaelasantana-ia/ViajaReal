import { Bot, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssistantLoading } from '../components/assistant/AssistantLoading';
import { AssistantOptionButton } from '../components/assistant/AssistantOptionButton';
import { ChatBubble } from '../components/assistant/ChatBubble';
import { generateItinerary, getAssistantLoadingMessages } from '../services/aiService';

const styles = ['Econômico', 'Confortável', 'Luxo', 'Aventura', 'Cultural', 'Gastronômico'];

export function TravelAssistant() {
  const navigate = useNavigate();
  const loadingMessages = useMemo(() => getAssistantLoadingMessages(), []);
  const [answers, setAnswers] = useState({ destination: 'Japão', days: 12, budget: 'R$ 8.000', style: 'Confortável' });
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const handleGenerate = () => {
    setLoading(true);
    setMessageIndex(0);
    const timer = window.setInterval(() => setMessageIndex((current) => Math.min(current + 1, loadingMessages.length - 1)), 650);
    window.setTimeout(() => {
      window.clearInterval(timer);
      const result = generateItinerary(answers);
      sessionStorage.setItem('viajareal-assistant-result', JSON.stringify(result));
      navigate('/assistant/result');
    }, 1800);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700"><Bot size={18} /></span>
        <div>
          <h1 className="text-sm font-extrabold text-slate-950">Assistente de Viagem <span className="pill ml-1">Beta</span></h1>
        </div>
      </div>

      <ChatBubble>Olá! Sou seu assistente de viagem. Vou te fazer algumas perguntas para criar o roteiro perfeito para você.</ChatBubble>
      <ChatBubble>Qual destino você deseja visitar?</ChatBubble>
      <ChatBubble from="user">{answers.destination}</ChatBubble>
      <ChatBubble>Quantos dias você pretende ficar?</ChatBubble>
      <ChatBubble from="user">{answers.days} dias</ChatBubble>
      <ChatBubble>Qual é o seu orçamento total aproximado?</ChatBubble>
      <ChatBubble from="user">{answers.budget}</ChatBubble>
      <ChatBubble>Qual seu estilo de viagem?</ChatBubble>

      <div className="grid grid-cols-2 gap-2">
        {styles.map((style) => (
          <AssistantOptionButton key={style} active={answers.style === style} onClick={() => setAnswers({ ...answers, style })}>
            {style}
          </AssistantOptionButton>
        ))}
      </div>

      {loading ? <AssistantLoading message={loadingMessages[messageIndex]} /> : null}

      <button type="button" className="primary-btn w-full" onClick={handleGenerate}>
        <Send size={16} />
        Gerar roteiro mockado
      </button>
    </div>
  );
}
