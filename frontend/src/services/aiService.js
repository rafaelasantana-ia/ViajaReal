import { activeTrip } from '../data/mockTrips';
import { places } from '../data/mockPlaces';
import { estimateTripCost } from './costService';
import { summarizeReports } from './communityService';

export const MOCK_MODE = true;

export function recommendPlaces() {
  // Futuro: substituir por chamada para API real de IA/recomendação.
  return places;
}

export function generateItinerary({ destination = 'Japão', days = 12, budget = 'R$ 8.000', style = 'Confortável' } = {}) {
  // Futuro: chamar endpoint real de IA com destino, dias, orçamento e estilo do viajante.
  const estimatedCost = estimateTripCost({ days, style });
  const reportsSummary = summarizeReports();

  return {
    destination,
    days,
    budget,
    style,
    estimatedCost,
    safety: reportsSummary.averageSafety,
    bestSeason: 'Mar - Mai',
    summary: `Preparamos um roteiro equilibrado para você conhecer o melhor do ${destination} com conforto e experiências autênticas.`,
    blocks: [
      { period: 'Dia 1-3', city: 'Tóquio', description: 'Explorar os principais pontos da capital', image: activeTrip.cover },
      { period: 'Dia 4-6', city: 'Kyoto', description: 'Cultura, templos e tradições', image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=400&q=80' },
      { period: 'Dia 7-8', city: 'Osaka', description: 'Gastronomia e vida noturna', image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=400&q=80' },
      { period: 'Dia 9-10', city: 'Hakone', description: 'Natureza e fontes termais', image: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=400&q=80' },
      { period: 'Dia 11-12', city: 'Tóquio', description: 'Compras e despedida', image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=400&q=80' },
    ],
  };
}

export function getAssistantLoadingMessages() {
  return ['Analisando relatos reais de viajantes...', 'Calculando melhor roteiro...', 'Estimando custos...'];
}
