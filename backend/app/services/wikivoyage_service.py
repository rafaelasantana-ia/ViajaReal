"""Conteúdo introdutório de destinos obtido pela MediaWiki Action API."""

import logging

import httpx

from app.core.cache import TTLCache
from app.core.config import Settings, get_settings
from app.services.external_api import ExternalAPIError, utc_now_iso

logger = logging.getLogger("viajareal.external.wikivoyage")
_shared_cache: TTLCache | None = None


def _cache(settings: Settings) -> TTLCache:
    global _shared_cache
    if _shared_cache is None or _shared_cache.ttl_seconds != settings.cache_ttl:
        _shared_cache = TTLCache(settings.cache_ttl)
    return _shared_cache


class WikivoyageService:
    base_url = "https://pt.wikivoyage.org/w/api.php"

    def __init__(self, settings: Settings | None = None, client: httpx.Client | None = None, cache: TTLCache | None = None):
        self.settings = settings or get_settings()
        self.client = client
        self.cache = cache or _cache(self.settings)

    def get_destination(self, destination: str) -> dict:
        query = " ".join(str(destination or "").split())
        if len(query) < 2 or len(query) > 120:
            raise ExternalAPIError("invalid_destination", "Destino inválido para consulta no Wikivoyage.", 422)
        key = f"wikivoyage:{query.casefold()}"
        cached = self.cache.get(key)
        if cached is not None:
            cached["cached"] = True
            return cached
        try:
            response = self._get(params={
                "action": "query",
                "format": "json",
                "formatversion": 2,
                "generator": "search",
                "gsrsearch": query,
                "gsrnamespace": 0,
                "gsrlimit": 1,
                "prop": "extracts|info",
                "exintro": 1,
                "explaintext": 1,
                "exsentences": 5,
                "inprop": "url",
                "redirects": 1,
                "uselang": "pt-br",
            })
            response.raise_for_status()
            pages = response.json().get("query", {}).get("pages") or []
            page = pages[0] if pages else None
            if not page or not page.get("extract"):
                raise ExternalAPIError("wikivoyage_not_found", "Não há conteúdo do Wikivoyage para este destino.", 404)
            result = {
                "title": page.get("title") or query,
                "summary": page["extract"].strip(),
                "page_url": page.get("fullurl"),
                "cached": False,
                "source": {
                    "name": "Wikivoyage",
                    "url": page.get("fullurl") or "https://pt.wikivoyage.org/",
                    "license": "CC BY-SA",
                    "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
                    "queried_at": utc_now_iso(),
                },
            }
            self.cache.set(key, result)
            return result
        except ExternalAPIError:
            raise
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
            logger.warning("wikivoyage_failure error_type=%s", type(exc).__name__)
            raise ExternalAPIError("wikivoyage_unavailable", "O Wikivoyage está indisponível no momento.") from exc

    def _get(self, **kwargs) -> httpx.Response:
        headers = {"User-Agent": self.settings.nominatim_user_agent, "Accept": "application/json"}
        if self.client is not None:
            return self.client.get(self.base_url, headers=headers, **kwargs)
        with httpx.Client(timeout=self.settings.external_api_timeout, follow_redirects=True) as client:
            return client.get(self.base_url, headers=headers, **kwargs)
