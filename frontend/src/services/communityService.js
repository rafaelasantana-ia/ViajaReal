import { communityReports } from '../data/mockCommunityReports';

export function getCommunityReports(destination = 'Japão') {
  return communityReports.filter((report) => report.destination === destination);
}

export function getRecentReports(limit = 2) {
  return communityReports.slice(0, limit);
}

export function summarizeReports() {
  return {
    total: communityReports.length,
    averageSafety: 'Alta',
    insight: 'Viajantes destacam transporte eficiente, alta segurança e custo melhor quando hospedados perto do metrô.',
  };
}
