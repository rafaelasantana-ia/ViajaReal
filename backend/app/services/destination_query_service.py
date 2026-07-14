"""Resolve nomes ambíguos usando o catálogo interno antes de consultar fontes externas."""

import re
import unicodedata
from typing import Any, Dict

from app.data.mock_destinations import MOCK_DESTINATIONS


def normalize_destination(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or ""))
    without_accents = "".join(char for char in normalized if not unicodedata.combining(char))
    return " ".join(re.sub(r"[^a-zA-Z0-9]+", " ", without_accents).lower().split())


def find_mock_destination(query: str) -> Dict[str, Any] | None:
    normalized = normalize_destination(query)
    if not normalized:
        return None
    return next(
        (
            destination
            for destination in MOCK_DESTINATIONS
            if normalized
            in {
                normalize_destination(destination["id"]),
                normalize_destination(destination["name"]),
                normalize_destination(destination["city"]),
                normalize_destination(f"{destination['city']} {destination['state']}"),
                normalize_destination(f"{destination['city']} {destination['state']} Brasil"),
            }
        ),
        None,
    )


def qualify_destination_query(query: str) -> str:
    """Acrescenta estado e país somente para destinos conhecidos do catálogo."""
    destination = find_mock_destination(query)
    if not destination:
        return " ".join(str(query or "").split())
    return f"{destination['city']}, {destination['state']}, Brasil"
