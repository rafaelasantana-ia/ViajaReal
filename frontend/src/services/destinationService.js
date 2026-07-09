import { destinations } from '../data/mockDestinations';

export function getPopularDestinations() {
  return destinations;
}

export function getDestinationById(id = 'japao') {
  return destinations.find((destination) => destination.id === id) || destinations[0];
}

export function searchDestinations(query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return destinations;

  return destinations.filter((destination) =>
    `${destination.name} ${destination.location} ${destination.summary}`.toLowerCase().includes(normalizedQuery),
  );
}
