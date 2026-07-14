import { activeTrip } from '../data/mockTrips';

const SAVED_AI_PLAN_KEY = 'viajareal-saved-ai-plan';

export function getActiveTrip() {
  if (activeTrip) return activeTrip;

  const savedPlan = getSavedAIPlan();
  if (!savedPlan?.result || !savedPlan?.form) return null;

  const startDate = savedPlan.form.approximateDate
    ? new Date(`${savedPlan.form.approximateDate}T12:00:00`)
    : null;
  const location = savedPlan.externalData?.location || savedPlan.result.live_context?.location;
  const cover = savedPlan.externalData?.images?.images?.[0]?.url
    || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80';
  const itinerary = savedPlan.result.itinerary || [];
  const dayCount = Math.max(Number(savedPlan.form.days) || 0, itinerary.length);
  const days = Array.from({ length: dayCount }, (_, index) => {
    const day = itinerary.find((item) => Number(item.day) === index + 1) || { day: index + 1, activities: [] };
    const date = startDate ? new Date(startDate) : null;
    if (date) date.setDate(date.getDate() + index);
    return {
      id: `day-${day.day}`,
      label: `Dia ${day.day}`,
      date: date?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) || '',
      city: savedPlan.form.destination,
      stops: (day.activities || []).map((activity, activityIndex) => ({
        id: `day-${day.day}-activity-${activityIndex + 1}`,
        time: `${String(9 + activityIndex * 2).padStart(2, '0')}:00`,
        title: activity,
        category: 'Passeio',
        description: `Atividade planejada para o dia ${day.day}.`,
        image: cover,
      })),
    };
  });

  return {
    id: `saved-${savedPlan.savedAt || 'trip'}`,
    title: `Viagem para ${savedPlan.form.destination}`,
    destination: savedPlan.form.destination,
    period: startDate ? startDate.toLocaleDateString('pt-BR') : 'Data a definir',
    daysCount: Number(savedPlan.form.days) || days.length,
    budget: Number(savedPlan.form.budget) || 0,
    travelersCount: savedPlan.form.company === 'solo' ? 1 : 2,
    status: 'Em planejamento',
    cover,
    travelers: [],
    location: location ? {
      lat: Number(location.latitude),
      lng: Number(location.longitude),
    } : null,
    days,
  };
}

export function getTripDay(dayId = 'day-1') {
  const trip = getActiveTrip();
  return trip?.days.find((day) => day.id === dayId) || trip?.days[0] || null;
}

export function getTripDays() {
  return getActiveTrip()?.days || [];
}

export function getSavedAIPlan() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_AI_PLAN_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveAIPlan({ form, result, externalData }) {
  const savedPlan = {
    form,
    result,
    externalData,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(SAVED_AI_PLAN_KEY, JSON.stringify(savedPlan));
  return savedPlan;
}
