"""Busca de imagens via Pexels com fallback local controlado."""

import logging

import httpx

from app.core.cache import TTLCache
from app.core.config import Settings, get_settings
from app.services.destination_query_service import qualify_destination_query
from app.services.external_api import utc_now_iso

logger = logging.getLogger("viajareal.external.images")
_shared_cache: TTLCache | None = None


def _cache(settings: Settings) -> TTLCache:
    global _shared_cache
    if _shared_cache is None or _shared_cache.ttl_seconds != settings.cache_ttl:
        _shared_cache = TTLCache(settings.cache_ttl)
    return _shared_cache


class ImageService:
    base_url = "https://api.pexels.com/v1/search"
    fallback_url = "/images/destination-fallback.svg"

    def __init__(self, settings: Settings | None = None, client: httpx.Client | None = None, cache: TTLCache | None = None):
        self.settings = settings or get_settings()
        self.client = client
        self.cache = cache or _cache(self.settings)

    def search(self, destination: str, limit: int = 3) -> dict:
        query = " ".join(str(destination or "").split())
        if len(query) < 2 or len(query) > 120 or not 1 <= limit <= 10:
            return self._fallback("Parâmetros inválidos para a busca de imagens.")
        external_query = qualify_destination_query(query)
        key = f"images:{external_query.casefold()}:{limit}"
        cached = self.cache.get(key)
        if cached is not None:
            cached["cached"] = True
            return cached
        if not self.settings.pexels_api_key:
            return self._fallback("PEXELS_API_KEY não configurada; foi usada a imagem local.")
        try:
            response = self._get(
                headers={"Authorization": self.settings.pexels_api_key},
                params={"query": f"{external_query} travel", "per_page": limit, "orientation": "landscape", "locale": "pt-BR"},
            )
            if response.status_code >= 400:
                result = self._fallback("A Pexels não respondeu; foi usada a imagem local.")
                self.cache.set(key, result)
                return result
            photos = response.json().get("photos") or []
            images = [
                {
                    "url": photo.get("src", {}).get("large") or photo.get("src", {}).get("original"),
                    "photographer": photo.get("photographer"),
                    "page_url": photo.get("url"),
                }
                for photo in photos[:limit]
                if (photo.get("src", {}).get("large") or photo.get("src", {}).get("original")) and photo.get("url")
            ]
            if not images:
                result = self._fallback("Nenhuma imagem foi encontrada; foi usada a imagem local.")
                self.cache.set(key, result)
                return result
            result = {
                "images": images, "fallback": False, "cached": False, "limitations": [],
                "source": {"name": "Pexels", "url": "https://www.pexels.com/", "queried_at": utc_now_iso()},
            }
            self.cache.set(key, result)
            return result
        except (httpx.HTTPError, ValueError, TypeError) as exc:
            logger.warning("image_search_failure error_type=%s", type(exc).__name__)
            result = self._fallback("A busca de imagens falhou; foi usada a imagem local.")
            self.cache.set(key, result)
            return result

    def _fallback(self, limitation: str) -> dict:
        return {
            "images": [{"url": self.fallback_url, "photographer": None, "page_url": None}],
            "fallback": True, "cached": False, "limitations": [limitation],
            "source": {"name": "Imagem local", "url": self.fallback_url, "queried_at": utc_now_iso()},
        }

    def _get(self, **kwargs) -> httpx.Response:
        if self.client is not None:
            return self.client.get(self.base_url, **kwargs)
        with httpx.Client(timeout=self.settings.external_api_timeout, follow_redirects=True) as client:
            return client.get(self.base_url, **kwargs)
