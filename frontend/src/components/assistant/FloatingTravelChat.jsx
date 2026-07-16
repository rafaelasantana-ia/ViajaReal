import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { chatWithAssistant } from '../../services/aiService';
import { applyPendingAnswer, clearChatState, loadChatState, saveChatState, toConversationHistory } from '../../services/chatSessionService';
import { getActiveTrip } from '../../services/tripService';
import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';

const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function destinationForPage(location) {
  const selectedDestination = new URLSearchParams(location.search).get('destination');
  if (selectedDestination) return selectedDestination;
  return ['/destination', '/planner', '/timeline', '/places', '/costs', '/community'].includes(location.pathname) ? getActiveTrip()?.destination || null : null;
}

export function FloatingTravelChat() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [chatState, setChatState] = useState(loadChatState);
  const [loading, setLoading] = useState(false);
  const lastMessageRef = useRef('');

  useEffect(() => {
    saveChatState(chatState);
  }, [chatState]);

  const sendMessage = useCallback(async (rawMessage, retry = false) => {
    const text = rawMessage.trim();
    if (!text || loading) return;
    setLoading(true);
    lastMessageRef.current = text;

    const messagesWithoutError = chatState.messages.filter((message) => message.role !== 'error');
    const historyBase = retry && messagesWithoutError.at(-1)?.role === 'user'
      ? messagesWithoutError.slice(0, -1)
      : messagesWithoutError;
    const visibleMessages = retry
      ? messagesWithoutError
      : [...messagesWithoutError, { id: makeId(), role: 'user', content: text }];
    const nextFormData = applyPendingAnswer(chatState.formData, chatState.pendingField, text);
    const requestFormData = chatState.pendingType ? { ...nextFormData, intent: chatState.pendingType } : nextFormData;

    setChatState((current) => ({ ...current, messages: visibleMessages, formData: nextFormData }));
    try {
      const response = await chatWithAssistant({
        message: text,
        destination: nextFormData.destination || destinationForPage(location),
        history: toConversationHistory(historyBase),
        currentPage: location.pathname,
        formData: requestFormData,
      });
      const assistantMessage = { id: makeId(), role: 'assistant', content: response.answer, response };
      const pendingField = typeof response.data?.missing_information === 'string' ? response.data.missing_information : null;
      setChatState({
        messages: [...visibleMessages, assistantMessage],
        formData: pendingField ? nextFormData : {},
        pendingField,
        pendingType: pendingField ? response.type : null,
      });
    } catch (error) {
      setChatState((current) => ({
        ...current,
        messages: [...visibleMessages, { id: makeId(), role: 'error', content: error?.message || 'Não foi possível conectar ao backend de IA.', retryText: text }],
      }));
    } finally {
      setLoading(false);
    }
  }, [chatState, loading, location]);

  useEffect(() => {
    const sendFromPage = (event) => {
      const message = event.detail?.message;
      if (typeof message !== 'string' || !message.trim()) return;
      setIsOpen(true);
      sendMessage(message);
    };
    window.addEventListener('viajareal:chat:send', sendFromPage);
    return () => window.removeEventListener('viajareal:chat:send', sendFromPage);
  }, [sendMessage]);

  const clearConversation = () => {
    setChatState(clearChatState());
    lastMessageRef.current = '';
  };

  return (
    <>
      {!isOpen && <ChatButton onClick={() => setIsOpen(true)} isOpen={isOpen} />}
      {isOpen && (
        <ChatWindow
          messages={chatState.messages}
          loading={loading}
          onClose={() => setIsOpen(false)}
          onClear={clearConversation}
          onSend={sendMessage}
          onRetry={(message) => sendMessage(message || lastMessageRef.current, true)}
        />
      )}
    </>
  );
}
