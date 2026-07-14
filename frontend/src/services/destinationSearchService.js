import { destinations } from '../data/mockDestinations';
import { getDestinationLocation } from './externalDestinationService';

export function normalizeDestination(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function findLocalDestination(query) {
  const normalizedQuery = normalizeDestination(query);
  if (!normalizedQuery) return null;

  return destinations.find((destination) => normalizeDestination(destination.name) === normalizedQuery)
    || destinations.find((destination) => normalizeDestination(`${destination.name} ${destination.location}`).includes(normalizedQuery))
    || null;
}

export function destinationDetailsPath(destination) {
  const name = typeof destination === 'string' ? destination : destination.name;
  return `/destination?destination=${encodeURIComponent(name)}`;
}

export async function resolveDestinationSearch(query) {
  const cleanQuery = String(query || '').trim();
  if (cleanQuery.length < 2) throw new Error('Informe um destino com pelo menos 2 caracteres.');

  const localDestination = findLocalDestination(cleanQuery);
  if (localDestination) return { name: localDestination.name, local: true, destination: localDestination };

  const location = await getDestinationLocation(cleanQuery);
  return { name: location.city || cleanQuery, local: false, location };
}
