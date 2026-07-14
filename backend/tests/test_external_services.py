import unittest

import httpx

from app.core.cache import TTLCache
from app.core.config import Settings
from app.services.geocoding_service import GeocodingService
from app.services.image_service import ImageService
from app.services.weather_service import WeatherService


def settings(pexels_key="test-key"):
    return Settings(
        ai_mode="mock", ai_api_key=None, ai_api_url="", ai_model="test", ai_timeout_seconds=1,
        frontend_origins=("http://localhost:5173",), pexels_api_key=pexels_key,
        external_api_timeout=1, cache_ttl=60, nominatim_user_agent="ViajaRealTests/1.0 (+https://example.test)",
    )


class ExternalServicesTest(unittest.TestCase):
    def test_geocoding_normalizes_and_uses_cache(self):
        calls = []

        def handler(request):
            calls.append(request)
            return httpx.Response(200, json=[{
                "display_name": "Bonito, Mato Grosso do Sul, Brasil", "lat": "-21.1261", "lon": "-56.4836",
                "address": {"town": "Bonito", "state": "Mato Grosso do Sul", "country": "Brasil"},
            }])

        with httpx.Client(transport=httpx.MockTransport(handler)) as client:
            service = GeocodingService(settings(), client, TTLCache(60))
            first = service.locate("Bonito")
            second = service.locate("Bonito")
        self.assertEqual(first["city"], "Bonito")
        self.assertEqual(first["latitude"], -21.1261)
        self.assertTrue(second["cached"])
        self.assertEqual(len(calls), 1)
        self.assertIn("ViajaRealTests", calls[0].headers["User-Agent"])
        self.assertEqual(calls[0].url.params["q"], "Bonito, Mato Grosso do Sul, Brasil")

    def test_weather_returns_current_daily_and_source(self):
        def handler(_request):
            return httpx.Response(200, json={
                "timezone": "America/Campo_Grande",
                "current": {"time": "2026-07-13T12:00", "temperature_2m": 25.2, "weather_code": 1, "precipitation": 0.1, "rain": 0.0},
                "daily": {"time": ["2026-07-13"], "weather_code": [2], "temperature_2m_max": [28.0], "temperature_2m_min": [17.0], "precipitation_sum": [1.2], "rain_sum": [1.0]},
            })

        with httpx.Client(transport=httpx.MockTransport(handler)) as client:
            result = WeatherService(settings(), client, TTLCache(60)).get_weather(-21.12, -56.48, 1)
        self.assertEqual(result["current"]["temperature_c"], 25.2)
        self.assertEqual(result["today"]["rain_mm"], 1.0)
        self.assertEqual(result["source"]["name"], "Open-Meteo")

    def test_images_return_attribution_and_local_fallback(self):
        calls = []

        def handler(request):
            calls.append(request)
            return httpx.Response(200, json={"photos": [{"src": {"large": "https://images.test/bonito.jpg"}, "photographer": "Ana", "url": "https://pexels.com/photo/1"}]})

        with httpx.Client(transport=httpx.MockTransport(handler)) as client:
            result = ImageService(settings(), client, TTLCache(60)).search("Bonito", 1)
        self.assertFalse(result["fallback"])
        self.assertEqual(result["images"][0]["photographer"], "Ana")
        self.assertEqual(calls[0].url.params["query"], "Bonito, Mato Grosso do Sul, Brasil travel")
        fallback = ImageService(settings(None), cache=TTLCache(60)).search("Bonito", 1)
        self.assertTrue(fallback["fallback"])
        self.assertEqual(fallback["images"][0]["url"], "/images/destination-fallback.svg")


if __name__ == "__main__":
    unittest.main()
