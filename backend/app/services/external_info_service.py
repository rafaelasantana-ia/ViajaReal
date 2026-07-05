"""Serviço para preparar buscas externas mockadas de um destino.

Futuro: substituir por APIs reais de clima, eventos, transporte, segurança e notícias.
"""

from typing import Any, Dict

from app.services.mock_examples import MOCK_DESTINATIONS


def get_public_destination_info(destination_name: str, preferences: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Retorna um conjunto de dados públicos mockados de um destino."""
    normalized_name = destination_name.strip().lower()
    destination = MOCK_DESTINATIONS.get(normalized_name)

    if not destination:
        return {
            "destination": destination_name,
            "status": "not_found",
            "message": "Destino não encontrado nos dados mockados.",
            "source": "mock",
            "verified": False,
        }

    # Futuro: substituir por integrações reais como OpenWeather, Ticketmaster, Google Places,
    # APIs de transporte local, segurança e feeds de notícias.
    return {
        "destination": destination["name"],
        "country": destination["country"],
        "climate": destination["climate"],
        "events": destination["events"],
        "attractions": destination["attractions"],
        "local_transport": destination["local_transport"],
        "safety": destination["safety"],
        "price_average": destination["price_average"],
        "recent_news": destination["recent_news"],
        "source": "mock",
        "verified": False,
        "preferences": preferences or {},
    }
