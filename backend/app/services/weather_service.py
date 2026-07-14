"""Previsão e condições atuais via Open-Meteo."""

import logging

import httpx

from app.core.cache import TTLCache
from app.core.config import Settings, get_settings
from app.services.external_api import ExternalAPIError, utc_now_iso

logger = logging.getLogger("viajareal.external.weather")
_shared_cache: TTLCache | None = None


def _cache(settings: Settings) -> TTLCache:
    global _shared_cache
    if _shared_cache is None or _shared_cache.ttl_seconds != settings.cache_ttl:
        _shared_cache = TTLCache(settings.cache_ttl)
    return _shared_cache


WEATHER_CODES = {
    0: "céu limpo", 1: "predominantemente limpo", 2: "parcialmente nublado", 3: "nublado",
    45: "neblina", 48: "neblina com geada", 51: "garoa leve", 53: "garoa moderada", 55: "garoa intensa",
    61: "chuva leve", 63: "chuva moderada", 65: "chuva forte", 80: "pancadas leves",
    81: "pancadas moderadas", 82: "pancadas fortes", 95: "trovoadas", 96: "trovoadas com granizo", 99: "trovoadas fortes com granizo",
}


class WeatherService:
    base_url = "https://api.open-meteo.com/v1/forecast"

    def __init__(self, settings: Settings | None = None, client: httpx.Client | None = None, cache: TTLCache | None = None):
        self.settings = settings or get_settings()
        self.client = client
        self.cache = cache or _cache(self.settings)

    def get_weather(self, latitude: float, longitude: float, forecast_days: int = 7) -> dict:
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            raise ExternalAPIError("INVALID_COORDINATES", "Latitude ou longitude inválida.", 422)
        if not 1 <= forecast_days <= 16:
            raise ExternalAPIError("INVALID_FORECAST_DAYS", "A previsão deve ter entre 1 e 16 dias.", 422)
        key = f"weather:{latitude:.4f}:{longitude:.4f}:{forecast_days}"
        cached = self.cache.get(key)
        if cached is not None:
            cached["cached"] = True
            return cached
        params = {
            "latitude": latitude, "longitude": longitude,
            "current": "temperature_2m,weather_code,precipitation,rain",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum",
            "timezone": "auto", "forecast_days": forecast_days,
        }
        try:
            response = self._get(params=params)
        except httpx.TimeoutException as exc:
            raise ExternalAPIError("WEATHER_TIMEOUT", "A consulta de clima demorou mais que o esperado.", 504) from exc
        except httpx.HTTPError as exc:
            logger.warning("weather_transport_error error_type=%s", type(exc).__name__)
            raise ExternalAPIError("WEATHER_UNAVAILABLE", "O serviço de clima está indisponível.") from exc
        if response.status_code == 429:
            raise ExternalAPIError("WEATHER_RATE_LIMIT", "O limite do serviço de clima foi atingido.", 429)
        if response.status_code >= 400:
            raise ExternalAPIError("WEATHER_UNAVAILABLE", "O serviço de clima não respondeu corretamente.")
        try:
            body = response.json()
            current = body["current"]
            daily = body["daily"]
            dates = daily["time"]
            forecast = [
                {
                    "date": date,
                    "condition": WEATHER_CODES.get(int(daily["weather_code"][index]), "condição não classificada"),
                    "max_temperature_c": daily["temperature_2m_max"][index],
                    "min_temperature_c": daily["temperature_2m_min"][index],
                    "precipitation_mm": daily["precipitation_sum"][index],
                    "rain_mm": daily["rain_sum"][index],
                }
                for index, date in enumerate(dates)
            ]
            result = {
                "current": {
                    "observed_at": current["time"],
                    "temperature_c": current["temperature_2m"],
                    "condition": WEATHER_CODES.get(int(current["weather_code"]), "condição não classificada"),
                    "precipitation_mm": current["precipitation"],
                    "rain_mm": current["rain"],
                },
                "today": forecast[0], "forecast": forecast, "timezone": body.get("timezone"), "cached": False,
                "source": {"name": "Open-Meteo", "url": "https://open-meteo.com/", "queried_at": utc_now_iso()},
                "limitations": ["Previsões meteorológicas são estimativas e não constituem garantia das condições da viagem."],
            }
        except (KeyError, TypeError, ValueError, IndexError) as exc:
            raise ExternalAPIError("WEATHER_INVALID_RESPONSE", "O serviço de clima retornou dados inválidos.") from exc
        self.cache.set(key, result)
        return result

    def _get(self, **kwargs) -> httpx.Response:
        if self.client is not None:
            return self.client.get(self.base_url, **kwargs)
        with httpx.Client(timeout=self.settings.external_api_timeout, follow_redirects=True) as client:
            return client.get(self.base_url, **kwargs)
