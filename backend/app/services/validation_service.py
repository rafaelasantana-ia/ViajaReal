"""Serviço para validar relatos com lógica mockada.

Futuro: validar com APIs externas, comparação geográfica ou modelos de IA.
"""

from typing import Any, Dict, List


def validate_report(report: Dict[str, Any]) -> Dict[str, Any]:
    """Valida se um relato parece consistente e marca campos não verificados."""
    destination = report.get("destination", "")
    locations = report.get("locations", [])

    issues: List[str] = []
    verified_locations: List[str] = []

    if not destination:
        issues.append("Destino não informado.")

    if not locations:
        issues.append("Nenhum local foi informado.")
    else:
        # Mock: simula uma verificação simples de nomes e presença de destino.
        verified_locations = [location for location in locations if destination.lower() in location.lower() or location.lower() in destination.lower()]
        if len(verified_locations) < len(locations):
            issues.append("Alguns locais podem não pertencer ao destino informado.")

    return {
        "destination_exists": bool(destination),
        "locations_verified": len(verified_locations) == len(locations),
        "issues": issues,
        "verification_status": "not_verified" if issues else "verified_mock",
        "message": "Informações marcadas como não verificadas até que uma validação externa seja aplicada.",
    }
