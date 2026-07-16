const CHAT_STATE_KEY = 'viajareal-floating-chat';
const MAX_STORED_MESSAGES = 20;

const emptyState = () => ({ messages: [], formData: {}, pendingField: null, pendingType: null });

export function loadChatState() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CHAT_STATE_KEY));
    if (!parsed || !Array.isArray(parsed.messages)) return emptyState();
    return {
      messages: parsed.messages.slice(-MAX_STORED_MESSAGES),
      formData: parsed.formData && typeof parsed.formData === 'object' ? parsed.formData : {},
      pendingField: typeof parsed.pendingField === 'string' ? parsed.pendingField : null,
      pendingType: typeof parsed.pendingType === 'string' ? parsed.pendingType : null,
    };
  } catch {
    return emptyState();
  }
}

export function saveChatState(state) {
  const safeState = {
    ...state,
    messages: state.messages.slice(-MAX_STORED_MESSAGES),
  };
  sessionStorage.setItem(CHAT_STATE_KEY, JSON.stringify(safeState));
}

export function clearChatState() {
  sessionStorage.removeItem(CHAT_STATE_KEY);
  sessionStorage.removeItem('viajareal-chat-session');
  return emptyState();
}

export function toConversationHistory(messages) {
  return messages
    .filter((message) => ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
    .slice(-10)
    .map(({ role, content }) => ({ role, content }));
}

export function applyPendingAnswer(formData, pendingField, value) {
  if (!pendingField) return formData;
  if (pendingField === 'interests') {
    return {
      ...formData,
      interests: value.split(/[,;]|\be\b/gi).map((item) => item.trim()).filter(Boolean),
    };
  }
  const numericFields = new Set(['days', 'available_budget', 'accommodation', 'food', 'transport', 'activities', 'other', 'budget']);
  const normalized = numericFields.has(pendingField)
    ? Number(String(value).replace(/[^\d,.-]/g, '').replace(',', '.'))
    : value.trim();
  return {
    ...formData,
    [pendingField]: Number.isNaN(normalized) ? value.trim() : normalized,
  };
}
