import { destinations, travelReports, userProfile, mockResponses, mockFavorites } from '../data/mockData';

export function searchDestinations(query) {
  const low = query.trim().toLowerCase();
  return destinations.filter((destination) =>
    `${destination.name} ${destination.country} ${destination.region} ${destination.summary}`
      .toLowerCase()
      .includes(low),
  );
}

export function filterDestinations(filters) {
  return destinations.filter((destination) => {
    if (filters.travelType && filters.travelType !== 'todos') {
      if (filters.travelType === 'economica' && destination.budget !== 'Baixo' && destination.budget !== 'Médio') {
        return false;
      }
      if (filters.travelType === 'familia' && destination.profile.toLowerCase().includes('família') === false) {
        return false;
      }
    }

    if (filters.budget && filters.budget !== 'todos' && destination.budget.toLowerCase() !== filters.budget) {
      return false;
    }

    if (filters.duration && filters.duration !== 'todos') {
      const duration = Number(filters.duration.replace(' dias', ''));
      if (filters.duration === 'curta' && duration > 4) return false;
      if (filters.duration === 'média' && (duration < 5 || duration > 9)) return false;
      if (filters.duration === 'longa' && duration < 10) return false;
    }

    if (filters.interests && filters.interests.length > 0) {
      const matchesInterest = filters.interests.some((interest) =>
        destination.summary.toLowerCase().includes(interest.toLowerCase()) ||
        destination.features.attractions.toLowerCase().includes(interest.toLowerCase()),
      );
      if (!matchesInterest) return false;
    }

    if (filters.safe && destination.safety.toLowerCase() === 'moderada') {
      return false;
    }

    return true;
  });
}

export function getDestinationDetails(id) {
  return destinations.find((destination) => destination.id === id) || null;
}

export function getTravelReports() {
  return travelReports;
}

export function addTravelReport(report) {
  travelReports.unshift({
    ...report,
    id: `report-${Math.random().toString(36).slice(2, 9)}`,
  });
  return travelReports;
}

export function calculateTripCosts(values, destinationId) {
  const total = Object.values(values).reduce((sum, value) => sum + Number(value || 0), 0);
  const days = Number(values.days || 1);
  const averagePerDay = days > 0 ? total / days : total;
  const destination = getDestinationDetails(destinationId);
  const compared = destination ? destination.averageCost : 0;

  let status = 'Dentro da média';
  if (averagePerDay < compared * 0.9) status = 'Econômica';
  if (averagePerDay > compared * 1.2) status = 'Cara';

  return {
    total,
    averagePerDay: Number(averagePerDay.toFixed(2)),
    comparedToDestination: compared,
    status,
  };
}

export function generateMockAISummary(query) {
  const low = query.toLowerCase();
  const matched = mockResponses.find((item) => low.includes(item.question));
  if (matched) {
    return matched.answer;
  }

  return 'Esse é um assistente mockado. No futuro, aqui será conectado a uma IA real para responder com base em dados do destino, orçamento e preferências.';
}

export function generateMockItinerary(destinationId, days, travelType) {
  const destination = getDestinationDetails(destinationId);
  if (!destination) return [];

  return destination.itinerary.slice(0, Math.min(days, destination.itinerary.length));
}

export function compareDestinations(firstId, secondId, profile) {
  const first = getDestinationDetails(firstId);
  const second = getDestinationDetails(secondId);
  if (!first || !second) return null;

  const scoreDestination = (destination) => {
    let score = destination.rating * 10;
    if (profile.travelType === 'Econômica' && destination.budget === 'Baixo') score += 10;
    if (profile.travelType === 'Cultura' && destination.features.attractions.toLowerCase().includes('cultura')) score += 8;
    if (profile.travelType === 'Praia' && destination.features.attractions.toLowerCase().includes('praia')) score += 8;
    return score;
  };

  const firstScore = scoreDestination(first);
  const secondScore = scoreDestination(second);

  return {
    first,
    second,
    winner: firstScore >= secondScore ? first.id : second.id,
    firstScore,
    secondScore,
  };
}

export function getMapMarkers() {
  return destinations.flatMap((destination) =>
    destination.mapMarkers.map((marker) => ({
      ...marker,
      destinationId: destination.id,
      destinationName: destination.name,
    })),
  );
}

export function validateTravelReport(report) {
  const required = ['title', 'destination', 'city', 'region', 'startDate', 'endDate', 'travelType', 'story'];
  const missing = required.filter((field) => !report[field] || String(report[field]).trim() === '');
  return {
    valid: missing.length === 0,
    missingFields: missing,
    message: missing.length === 0 ? 'Relato válido para cadastro.' : 'Preencha todos os campos obrigatórios antes de salvar.',
  };
}

export function getUserProfile() {
  return {
    ...userProfile,
    favoriteDestinations: userProfile.favorites.map((id) => getDestinationDetails(id)).filter(Boolean),
    travelHistory: travelReports.filter((report) => userProfile.reports.includes(report.id)),
  };
}

export function addFavoriteDestination(destinationId) {
  if (!mockFavorites.includes(destinationId)) {
    mockFavorites.unshift(destinationId);
  }
  if (!userProfile.favorites.includes(destinationId)) {
    userProfile.favorites.unshift(destinationId);
  }
  return getUserProfile();
}

export function removeFavoriteDestination(destinationId) {
  const index = mockFavorites.indexOf(destinationId);
  if (index !== -1) mockFavorites.splice(index, 1);
  userProfile.favorites = userProfile.favorites.filter((id) => id !== destinationId);
  return getUserProfile();
}
