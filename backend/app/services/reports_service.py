"""Serviço para filtrar relatos cadastrados pelos usuários de forma mockada."""

from typing import Any, Dict, List, Optional

from app.services.mock_examples import MOCK_USER_REPORTS


def filter_user_reports(
    destination: Optional[str] = None,
    travel_type: Optional[str] = None,
    budget_level: Optional[str] = None,
    duration_days: Optional[int] = None,
    interests: Optional[List[str]] = None,
    minimum_rating: float = 0.0,
) -> List[Dict[str, Any]]:
    """Filtra relatos mockados conforme preferências do usuário."""
    results: List[Dict[str, Any]] = []

    for report in MOCK_USER_REPORTS:
        if destination and report.get("destination", "").lower() != destination.lower():
            continue
        if travel_type and report.get("travel_type") != travel_type.lower():
            continue
        if budget_level and report.get("budget_level") != budget_level.lower():
            continue
        if duration_days and report.get("duration_days") and report["duration_days"] > duration_days:
            continue
        if interests and not set(interests).intersection(report.get("interests", [])):
            continue
        if report.get("rating", 0) < minimum_rating:
            continue
        results.append(report)

    return results
