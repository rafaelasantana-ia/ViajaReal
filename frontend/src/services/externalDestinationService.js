import { getApi } from './apiClient';

export const getDestinationLocation = (destination) => getApi('/api/destinations/location', { destination });
export const getDestinationWeather = (latitude, longitude, forecastDays = 7) => getApi('/api/destinations/weather', {
  latitude,
  longitude,
  forecast_days: forecastDays,
});
export const getDestinationImages = (destination, limit = 3) => getApi('/api/destinations/images', { destination, limit });
export const getDestinationWikivoyage = (destination) => getApi('/api/destinations/wikivoyage', { destination });

export async function getLiveDestinationData(destination) {
  const imagePromise = getDestinationImages(destination).catch((error) => ({ images: [], fallback: true, limitations: [error.message] }));
  const location = await getDestinationLocation(destination);
  const [weatherResult, images] = await Promise.all([
    getDestinationWeather(location.latitude, location.longitude).catch((error) => ({ error })),
    imagePromise,
  ]);
  return {
    location,
    weather: weatherResult.error ? null : weatherResult,
    images,
    limitations: [
      ...(weatherResult.error ? [`Clima indisponível: ${weatherResult.error.message}`] : []),
      ...(images.limitations || []),
    ],
  };
}
