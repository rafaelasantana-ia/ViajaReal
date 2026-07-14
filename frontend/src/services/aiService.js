import { places } from '../data/mockPlaces';
import { post, postApi } from './apiClient';

export function recommendPlaces() {
  // Futuro: substituir por chamada para API real de IA/recomendação.
  return places;
}

export function planTripWithAI(payload) {
  return postApi('/api/ai/plan-trip', {
    destination: payload.destination,
    days: Number(payload.days),
    budget: Number(payload.budget),
    travel_type: payload.travelType,
    company: payload.company,
    interests: payload.interests,
    comfort_level: payload.comfortLevel,
    approximate_date: payload.approximateDate,
    observations: payload.observations?.trim() || null,
  });
}

export function getChatSessionId() {
  let sessionId = sessionStorage.getItem('viajareal-chat-session');
  if (!sessionId) {
    sessionId = globalThis.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('viajareal-chat-session', sessionId);
  }
  return sessionId;
}

export function chatWithAssistant({ message, destination, history = [], currentPage = '/', formData = {} }) {
  return postApi('/api/ai/chat', {
    message,
    session_id: getChatSessionId(),
    conversation_history: history,
    context: {
      current_page: currentPage,
      selected_destination: destination || null,
      form_data: formData,
    },
  }).then((response) => ({ ...response, message: response.answer }));
}

export function improveTravelReport(report) {
  return post('/ai/reports/improve', report);
}

export function improveReportWithAI({ destination, originalText, tripType, expenses, rating }) {
  return postApi('/api/ai/improve-report', {
    destination,
    original_text: originalText,
    trip_type: tripType || null,
    expenses,
    rating: rating === '' || rating == null ? null : Number(rating),
  });
}

export function summarizeTravelReports(destination, reports = []) {
  return post('/ai/reports/summary', {
    destination,
    reports: reports.map((report) => ({
      destination: report.destination || destination,
      title: report.title || `Relato de ${report.author || 'viajante'}`,
      text: report.text,
      travel_type: report.travelType || null,
      cost: Number(String(report.cost || '').replace(/\D/g, '')) || null,
      safety: report.safety || null,
    })),
  });
}

export function summarizeDestination(destination, interests = []) {
  return post('/ai/destinations/summary', { destination, interests });
}

export function summarizeDestinationReports(destination) {
  return postApi('/api/ai/summarize-destination-reports', { destination });
}
