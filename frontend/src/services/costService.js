import { costSummary } from '../data/mockCosts';

export function getCostSummary() {
  return costSummary;
}

export function estimateTripCost({ days = 12, style = 'Confortável' } = {}) {
  const styleMultiplier = {
    Econômico: 0.82,
    Confortável: 1,
    Luxo: 1.55,
  };
  const multiplier = styleMultiplier[style] || 1;

  return Math.round((costSummary.total / 12) * Number(days || 12) * multiplier);
}
