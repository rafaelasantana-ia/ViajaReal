"""Serviço mockado para preparar integração com mapas.

Futuro: substituir por Google Maps, OpenStreetMap ou geocodificadores.
"""

from typing import Any, Dict, List

MOCK_COORDINATES = {
    "Lisboa": {"lat": 38.7223, "lng": -9.1393},
    "Bali": {"lat": -8.4095, "lng": 115.1889},
    "Marrakech": {"lat": 31.6295, "lng": -7.9811},
    "Tóquio": {"lat": 35.6762, "lng": 139.6503},
}


def get_mock_location_coordinates(location_name: str) -> Dict[str, Any]:
    """Retorna latitude e longitude mockadas para um nome de local."""
    if location_name in MOCK_COORDINATES:
        return {"location": location_name, "coordinates": MOCK_COORDINATES[location_name], "source": "mock"}

    return {
        "location": location_name,
        "coordinates": {"lat": 0.0, "lng": 0.0},
        "source": "mock",
        "message": "Coordenada não encontrada; retornando valor padrão mockado.",
    }


def build_map_markers(locations: List[str]) -> List[Dict[str, Any]]:
    """Gera marcadores mockados para o mapa do destino."""
    markers = []
    for index, location in enumerate(locations):
        coordinates = get_mock_location_coordinates(location)
        markers.append(
            {
                "id": index + 1,
                "label": location,
                "coordinates": coordinates["coordinates"],
                "type": "mock-marker",
            }
        )
    return markers
