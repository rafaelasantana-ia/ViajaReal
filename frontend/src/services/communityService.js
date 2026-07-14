import { communityReports } from '../data/mockCommunityReports';

const DB_NAME = 'viajareal-community';
const DB_VERSION = 1;
const REPORT_STORE = 'reports';
const FALLBACK_STORAGE_KEY = 'viajareal-saved-reports';

function openCommunityDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('IndexedDB indisponível.'));
    const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(REPORT_STORE)) {
        database.createObjectStore(REPORT_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Não foi possível abrir o armazenamento local.'));
  });
}

function runStore(mode, operation) {
  return openCommunityDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(REPORT_STORE, mode);
    const store = transaction.objectStore(REPORT_STORE);
    const request = operation(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Não foi possível acessar os relatos salvos.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error || new Error('Não foi possível concluir o salvamento.'));
  }));
}

function hydrateReport(report) {
  const photos = (report.photos || []).map((photo) => ({
    name: photo.name,
    url: photo.blob instanceof Blob ? URL.createObjectURL(photo.blob) : photo.url,
  })).filter((photo) => photo.url);
  return {
    ...report,
    photos,
    image: photos[0]?.url || report.image,
  };
}

function fallbackReports() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getCommunityReports(destination) {
  if (!destination) return [];
  return communityReports.filter((report) => report.destination === destination);
}

export function getRecentReports(limit = 2, destination) {
  if (!destination) return [];
  return communityReports.filter((report) => report.destination === destination).slice(0, limit);
}

export async function getSavedCommunityReports() {
  try {
    const reports = await runStore('readonly', (store) => store.getAll());
    return reports.sort((first, second) => second.createdAt.localeCompare(first.createdAt)).map(hydrateReport);
  } catch {
    return fallbackReports();
  }
}

export async function saveCommunityReport(report) {
  const persisted = {
    ...report,
    photos: (report.photos || []).map((photo) => ({ name: photo.name, type: photo.file?.type, blob: photo.file })),
  };
  try {
    await runStore('readwrite', (store) => store.put(persisted));
    return hydrateReport(persisted);
  } catch {
    const withoutPhotos = { ...report, photos: [] };
    const current = fallbackReports().filter((item) => item.id !== report.id);
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify([withoutPhotos, ...current]));
    return withoutPhotos;
  }
}

export function summarizeReports() {
  return {
    total: communityReports.length,
    averageSafety: 'Alta',
    insight: 'Viajantes destacam transporte eficiente, alta segurança e custo melhor quando hospedados perto do metrô.',
  };
}
