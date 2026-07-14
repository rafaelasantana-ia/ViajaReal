import { destinations } from '../data/mockDestinations';
import { normalizeDestination } from './destinationSearchService';

export function getPopularDestinations() {
  return destinations;
}

export function getDestinationById(id = 'bonito') {
  return destinations.find((destination) => destination.id === id) || destinations[0];
}

export function getDestinationByName(name) {
  const normalizedName = normalizeDestination(name);
  return destinations.find((destination) => normalizeDestination(destination.name) === normalizedName) || null;
}

export function searchDestinations(query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return destinations;

  return destinations.filter((destination) =>
    `${destination.name} ${destination.location} ${destination.summary}`.toLowerCase().includes(normalizedQuery),
  );
}
