"""Geocodificação via Nominatim/OpenStreetMap com cache e rate limit."""

import logging
from threading import Lock
from time import monotonic, sleep

import httpx

from app.core.cache import TTLCache
from app.core.config import Settings, get_settings
from app.services.destination_query_service import qualify_destination_query
from app.services.external_api import ExternalAPIError, utc_now_iso

logger = logging.getLogger("viajareal.external.geocoding")
_request_lock = Lock()
_last_request_at = 0.0
_shared_cache: TTLCache | None = None


def _cache(settings: Settings) -> TTLCache:
    global _shared_cache
    if _shared_cache is None or _shared_cache.ttl_seconds != settings.cache_ttl:
        _shared_cache = TTLCache(settings.cache_ttl)
    return _shared_cache


class GeocodingService:
    base_url = "https://nominatim.openstreetmap.org/search"

    def __init__(self, settings: Settings | None = None, client: httpx.Client | None = None, cache: TTLCache | None = None):
        self.settings = settings or get_settings()
        self.client = client
        self.cache = cache or _cache(self.settings)

    def locate(self, destination: str) -> dict:
        query = " ".join(str(destination or "").split())
        if len(query) < 2 or len(query) > 120:
            raise ExternalAPIError("INVALID_DESTINATION", "Informe um destino entre 2 e 120 caracteres.", 422)
        external_query = qualify_destination_query(query)
        key = f"geocode:{external_query.casefold()}"
        cached = self.cache.get(key)
        if cached is not None:
            if cached.get("not_found"):
                raise ExternalAPIError("DESTINATION_NOT_FOUND", f"Destino '{query}' não encontrado.", 404)
            cached["cached"] = True
            return cached

        global _last_request_at
        try:
            with _request_lock:
                wait = 1.0 - (monotonic() - _last_request_at)
                if wait > 0:
                    sleep(wait)
                response = self._get(
                    params={"q": external_query, "format": "jsonv2", "addressdetails": 1, "limit": 1, "accept-language": "pt-BR"},
                    headers={"User-Agent": self.settings.nominatim_user_agent, "Accept": "application/json"},
                )
                _last_request_at = monotonic()
        except httpx.TimeoutException as exc:
            raise ExternalAPIError("GEOCODING_TIMEOUT", "A busca de localização demorou mais que o esperado.", 504) from exc
        except httpx.HTTPError as exc:
            logger.warning("geocoding_transport_error error_type=%s", type(exc).__name__)
            raise ExternalAPIError("GEOCODING_UNAVAILABLE", "O serviço de localização está indisponível.") from exc

        if response.status_code == 429:
            raise ExternalAPIError("GEOCODING_RATE_LIMIT", "O limite de consultas de localização foi atingido. Tente mais tarde.", 429)
        if response.status_code >= 400:
            raise ExternalAPIError("GEOCODING_UNAVAILABLE", "O serviço de localização não respondeu corretamente.")
        try:
            items = response.json()
        except ValueError as exc:
            raise ExternalAPIError("GEOCODING_INVALID_RESPONSE", "O serviço de localização retornou dados inválidos.") from exc
        if not isinstance(items, list) or not items:
            self.cache.set(key, {"not_found": True})
            raise ExternalAPIError("DESTINATION_NOT_FOUND", f"Destino '{query}' não encontrado.", 404)

        item = items[0]
        address = item.get("address") or {}
        try:
            result = {
                "normalized_name": str(item["display_name"]),
                "city": address.get("city") or address.get("town") or address.get("village") or address.get("municipality"),
                "state": address.get("state"),
                "country": address.get("country"),
                "latitude": float(item["lat"]),
                "longitude": float(item["lon"]),
                "cached": False,
                "source": {
                    "name": "Nominatim / OpenStreetMap",
                    "url": "https://nominatim.openstreetmap.org/",
                    "attribution": "© OpenStreetMap contributors",
                    "queried_at": utc_now_iso(),
                },
            }
        except (KeyError, TypeError, ValueError) as exc:
            raise ExternalAPIError("GEOCODING_INVALID_RESPONSE", "O serviço de localização retornou dados incompletos.") from exc
        self.cache.set(key, result)
        return result

    def _get(self, **kwargs) -> httpx.Response:
        if self.client is not None:
            return self.client.get(self.base_url, **kwargs)
        with httpx.Client(timeout=self.settings.external_api_timeout, follow_redirects=True) as client:
            return client.get(self.base_url, **kwargs)
