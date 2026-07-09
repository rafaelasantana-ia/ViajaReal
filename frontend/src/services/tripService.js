import { activeTrip } from '../data/mockTrips';

export function getActiveTrip() {
  return activeTrip;
}

export function getTripDay(dayId = 'day-1') {
  return activeTrip.days.find((day) => day.id === dayId) || activeTrip.days[0];
}

export function getTripDays() {
  return activeTrip.days;
}
