"""Tools determinísticas baseadas exclusivamente nos mocks brasileiros."""

from copy import deepcopy
from dataclasses import dataclass
from datetime import date, timedelta
import json
from typing import Any, Callable, Dict, Iterable, List

from app.data.mock_destinations import MOCK_DESTINATIONS
from app.data.mock_reports import REPORTS_BY_DESTINATION
from app.core.config import get_settings
from app.services.external_api import ExternalAPIError, utc_now_iso
from app.services.destination_query_service import find_mock_destination as _find_destination
from app.services.destination_query_service import normalize_destination as _normalize
from app.services.geocoding_service import GeocodingService
from app.services.weather_service import WeatherService


def _error(code: str, message: str, details: Dict[str, Any] | None = None) -> Dict[str, Any]:
    return {"ok": False, "data": None, "error": {"code": code, "message": message, "details": details or {}}}


def _success(data: Dict[str, Any]) -> Dict[str, Any]:
    return {"ok": True, "data": data, "error": None}


def _non_negative_number(name: str, value: Any) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{name} deve ser um número.")
    if value < 0:
        raise ValueError(f"{name} não pode ser negativo.")
    return float(value)


def search_destination_reports(
    destination: str,
    travel_type: str | None = None,
    minimum_rating: float | None = None,
    limit: int = 10,
) -> Dict[str, Any]:
    """Busca e resume relatos do destino, com filtros opcionais."""
    found_destination = _find_destination(destination)
    if not found_destination:
        return _error("DESTINATION_NOT_FOUND", f"Destino '{destination}' não encontrado nos dados mockados.")
    if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 50:
        return _error("INVALID_LIMIT", "limit deve ser um inteiro entre 1 e 50.", {"limit": limit})
    if minimum_rating is not None:
        if isinstance(minimum_rating, bool) or not isinstance(minimum_rating, (int, float)) or not 0 <= minimum_rating <= 5:
            return _error("INVALID_MINIMUM_RATING", "minimum_rating deve estar entre 0 e 5.", {"minimum_rating": minimum_rating})

    reports = list(REPORTS_BY_DESTINATION.get(found_destination["id"], []))
    if travel_type:
        reports = [report for report in reports if _normalize(report["travel_type"]) == _normalize(travel_type)]
    if minimum_rating is not None:
        reports = [report for report in reports if report["rating"] >= float(minimum_rating)]
    reports.sort(key=lambda report: (report["rating"], report["date"]), reverse=True)

    summarized = [
        {
            "id": report["id"],
            "travel_type": report["travel_type"],
            "days": report["days"],
            "budget": report["budget"],
            "total_spent": report["total_spent"],
            "rating": report["rating"],
            "story_summary": report["story"][:280],
            "positives": report["positives"],
            "negatives": report["negatives"],
            "recommended_places": report["recommended_places"],
            "date": report["date"],
            "anonymous_author": report["anonymous_author"],
        }
        for report in reports[:limit]
    ]
    return _success(
        {
            "destination": {"id": found_destination["id"], "name": found_destination["name"]},
            "filters": {"travel_type": travel_type, "minimum_rating": minimum_rating, "limit": limit},
            "found_count": len(reports),
            "returned_count": len(summarized),
            "reports": summarized,
            "source": "mock_reports",
        }
    )


def get_destination_information(destination: str) -> Dict[str, Any]:
    """Retorna todos os dados estruturados disponíveis para um destino."""
    found_destination = _find_destination(destination)
    if not found_destination:
        return _error("DESTINATION_NOT_FOUND", f"Destino '{destination}' não encontrado nos dados mockados.")
    return _success({"destination": deepcopy(found_destination), "source": "mock_destinations"})


def calculate_trip_budget(
    days: int,
    available_budget: float,
    accommodation: float,
    food: float,
    transport: float,
    activities: float,
    other: float,
) -> Dict[str, Any]:
    """Calcula total, média diária, saldo e classificação do orçamento."""
    if isinstance(days, bool) or not isinstance(days, int) or not 1 <= days <= 365:
        return _error("INVALID_DAYS", "days deve ser um inteiro entre 1 e 365.", {"days": days})
    try:
        values = {
            "available_budget": _non_negative_number("available_budget", available_budget),
            "accommodation": _non_negative_number("accommodation", accommodation),
            "food": _non_negative_number("food", food),
            "transport": _non_negative_number("transport", transport),
            "activities": _non_negative_number("activities", activities),
            "other": _non_negative_number("other", other),
        }
    except ValueError as exc:
        return _error("INVALID_BUDGET_VALUE", str(exc))

    total = round(sum(values[key] for key in ("accommodation", "food", "transport", "activities", "other")), 2)
    available = values["available_budget"]
    balance = round(available - total, 2)
    ratio = total / available if available else (0 if total == 0 else float("inf"))
    if total > available:
        classification = "acima do orçamento"
    elif available > 0 and ratio < 0.9:
        classification = "abaixo do orçamento"
    else:
        classification = "dentro do orçamento"

    return _success(
        {
            "days": days,
            "available_budget": available,
            "breakdown": {key: values[key] for key in ("accommodation", "food", "transport", "activities", "other")},
            "total": total,
            "daily_average": round(total / days, 2),
            "balance": balance,
            "budget_usage_percent": round(ratio * 100, 2) if ratio != float("inf") else None,
            "classification": classification,
            "currency": "BRL",
            "source": "deterministic_calculation",
        }
    )


def generate_itinerary_base(
    destination: str,
    days: int,
    interests: List[str],
    available_budget: float,
) -> Dict[str, Any]:
    """Seleciona atrações compatíveis e as distribui sem repetição."""
    found_destination = _find_destination(destination)
    if not found_destination:
        return _error("DESTINATION_NOT_FOUND", f"Destino '{destination}' não encontrado nos dados mockados.")
    if isinstance(days, bool) or not isinstance(days, int) or not 1 <= days <= 30:
        return _error("INVALID_DAYS", "days deve ser um inteiro entre 1 e 30.", {"days": days})
    if not isinstance(interests, list) or any(not isinstance(item, str) or not item.strip() for item in interests):
        return _error("INVALID_INTERESTS", "interests deve ser um array de strings não vazias.")
    try:
        available = _non_negative_number("available_budget", available_budget)
    except ValueError as exc:
        return _error("INVALID_AVAILABLE_BUDGET", str(exc))

    normalized_interests = {_normalize(interest) for interest in interests}
    attractions = found_destination["attractions"]
    compatible = [
        attraction
        for attraction in attractions
        if not normalized_interests or normalized_interests.intersection(_normalize(item) for item in attraction["interests"])
    ]
    if not compatible:
        return _success(
            {
                "destination": {"id": found_destination["id"], "name": found_destination["name"]},
                "days": days,
                "interests": interests,
                "available_budget": available,
                "itinerary": [],
                "selected_attractions": 0,
                "estimated_activities_cost": 0.0,
                "remaining_budget": available,
                "insufficient_data": True,
                "message": "Não há atrações compatíveis com os interesses informados nos dados mockados.",
                "source": "mock_destinations",
            }
        )

    selected = []
    spent = 0.0
    for attraction in sorted(compatible, key=lambda item: (-len(normalized_interests.intersection(_normalize(value) for value in item["interests"])), item["estimated_cost"])):
        if spent + attraction["estimated_cost"] <= available:
            selected.append(attraction)
            spent += attraction["estimated_cost"]

    itinerary = [{"day": day, "attractions": [], "estimated_cost": 0.0} for day in range(1, days + 1)]
    for index, attraction in enumerate(selected):
        day = itinerary[index % days]
        item = deepcopy(attraction)
        day["attractions"].append(item)
        day["estimated_cost"] = round(day["estimated_cost"] + attraction["estimated_cost"], 2)

    insufficient = not selected or len(selected) < min(days, len(compatible))
    message = "Roteiro-base criado sem repetir atrações."
    if not selected:
        message = "O orçamento disponível não cobre nenhuma atração compatível dos dados mockados."
    elif insufficient:
        message = "Roteiro-base parcial: não há atrações suficientes dentro dos filtros e orçamento para todos os dias."

    return _success(
        {
            "destination": {"id": found_destination["id"], "name": found_destination["name"]},
            "days": days,
            "interests": interests,
            "available_budget": available,
            "itinerary": itinerary,
            "selected_attractions": len(selected),
            "estimated_activities_cost": round(spent, 2),
            "remaining_budget": round(available - spent, 2),
            "insufficient_data": insufficient,
            "message": message,
            "source": "mock_destinations",
        }
    )


def compare_destinations_data(
    first_destination: str,
    second_destination: str,
    traveler_profile: str,
    interests: List[str],
    budget: float,
) -> Dict[str, Any]:
    """Compara dois destinos e calcula aderência ao perfil com dados mockados."""
    first = _find_destination(first_destination)
    second = _find_destination(second_destination)
    missing = [name for name, value in ((first_destination, first), (second_destination, second)) if not value]
    if missing:
        return _error("DESTINATION_NOT_FOUND", "Um ou mais destinos não foram encontrados nos dados mockados.", {"missing_destinations": missing})
    if not isinstance(traveler_profile, str) or not traveler_profile.strip():
        return _error("INVALID_TRAVELER_PROFILE", "traveler_profile deve ser uma string não vazia.")
    if not isinstance(interests, list) or any(not isinstance(item, str) or not item.strip() for item in interests):
        return _error("INVALID_INTERESTS", "interests deve ser um array de strings não vazias.")
    try:
        daily_budget = _non_negative_number("budget", budget)
    except ValueError as exc:
        return _error("INVALID_BUDGET", str(exc))

    normalized_interests = {_normalize(item) for item in interests}
    normalized_profile = _normalize(traveler_profile)

    def metrics(destination: Dict[str, Any]) -> Dict[str, Any]:
        destination_interests = {_normalize(item) for item in destination["related_interests"]}
        matches = sorted(normalized_interests.intersection(destination_interests))
        interest_score = len(matches) / len(normalized_interests) if normalized_interests else 1.0
        budget_fit = 1.0 if destination["average_daily_cost"] <= daily_budget else max(0.0, daily_budget / destination["average_daily_cost"] if destination["average_daily_cost"] else 0.0)
        profile_tokens = {token for token in normalized_profile.split() if len(token) > 3}
        profile_text = _normalize(destination["recommended_profile"])
        profile_fit = 1.0 if profile_tokens and any(token in profile_text for token in profile_tokens) else 0.5
        score = round(
            destination["safety_rating"] / 5 * 25
            + destination["transport_rating"] / 5 * 15
            + interest_score * 30
            + budget_fit * 20
            + profile_fit * 10,
            2,
        )
        return {
            "id": destination["id"],
            "name": destination["name"],
            "average_daily_cost": destination["average_daily_cost"],
            "fits_daily_budget": destination["average_daily_cost"] <= daily_budget,
            "safety_rating": destination["safety_rating"],
            "transport_rating": destination["transport_rating"],
            "attraction_count": len(destination["attractions"]),
            "recommended_profile": destination["recommended_profile"],
            "matched_interests": matches,
            "interest_adherence_percent": round(interest_score * 100, 2),
            "profile_adherence": "alta" if profile_fit == 1 else "parcial",
            "compatibility_score": score,
        }

    first_metrics = metrics(first)
    second_metrics = metrics(second)
    if first_metrics["compatibility_score"] == second_metrics["compatibility_score"]:
        winner = None
        recommendation = "Os destinos têm a mesma pontuação de aderência para os dados informados."
    else:
        winner = first_metrics if first_metrics["compatibility_score"] > second_metrics["compatibility_score"] else second_metrics
        recommendation = (
            f"{winner['name']} combina melhor com o usuário porque atingiu {winner['compatibility_score']} pontos, "
            f"considerando custo diário, segurança, transporte, perfil e {winner['interest_adherence_percent']}% de aderência aos interesses."
        )

    return _success(
        {
            "traveler_profile": traveler_profile,
            "interests": interests,
            "daily_budget": daily_budget,
            "first_destination": first_metrics,
            "second_destination": second_metrics,
            "best_match": winner["id"] if winner else None,
            "recommendation": recommendation,
            "score_weights": {"safety": 25, "transport": 15, "interests": 30, "budget": 20, "profile": 10},
            "source": "mock_destinations",
        }
    )


def get_live_destination_context(destination: str, travel_date: str | None = None) -> Dict[str, Any]:
    """Obtém localização e clima sem permitir que falhas externas gerem valores inventados."""
    query = " ".join(str(destination or "").split())
    if len(query) < 2 or len(query) > 120:
        return _error("INVALID_DESTINATION", "destination deve ter entre 2 e 120 caracteres.")
    requested_date = None
    if travel_date:
        try:
            requested_date = date.fromisoformat(travel_date)
        except (TypeError, ValueError):
            return _error("INVALID_TRAVEL_DATE", "travel_date deve estar no formato AAAA-MM-DD.")

    limitations: List[str] = []
    sources: List[Dict[str, Any]] = []
    location: Dict[str, Any] | None = None
    weather: Dict[str, Any] | None = None
    mock_destination = _find_destination(query)
    settings = get_settings()

    if settings.ai_mode == "mock":
        if mock_destination:
            location = {
                "normalized_name": mock_destination["name"],
                "city": mock_destination["city"],
                "state": mock_destination["state"],
                "country": "Brasil",
                "latitude": mock_destination["latitude"],
                "longitude": mock_destination["longitude"],
                "source_type": "mock",
            }
            sources.append({"name": "mock_destinations", "type": "mock"})
        limitations.append("AI_MODE=mock: APIs externas não foram consultadas e não há clima em tempo real.")
    else:
        try:
            location = GeocodingService(settings).locate(query)
            location["source_type"] = "real"
            sources.append({**location["source"], "type": "real"})
        except ExternalAPIError as exc:
            limitations.append(str(exc))
            if mock_destination:
                location = {
                    "normalized_name": mock_destination["name"], "city": mock_destination["city"],
                    "state": mock_destination["state"], "country": "Brasil",
                    "latitude": mock_destination["latitude"], "longitude": mock_destination["longitude"],
                    "source_type": "mock_fallback",
                }
                sources.append({"name": "mock_destinations", "type": "mock_fallback"})
                limitations.append("A localização mockada foi usada como fallback e não é um resultado do Nominatim.")

        today = date.today()
        forecast_applicable = requested_date is None or today <= requested_date <= today + timedelta(days=15)
        if requested_date and not forecast_applicable:
            limitations.append("A data informada está fora da janela de previsão de até 16 dias; o clima não foi consultado.")
        elif location:
            try:
                weather = WeatherService(settings).get_weather(
                    float(location["latitude"]), float(location["longitude"]), 16 if requested_date else 7
                )
                weather["source_type"] = "real"
                sources.append({**weather["source"], "type": "real"})
                limitations.extend(weather.get("limitations") or [])
            except ExternalAPIError as exc:
                limitations.append(str(exc))

    return _success(
        {
            "destination": query, "travel_date": travel_date, "location": location, "weather": weather,
            "sources": sources, "queried_at": utc_now_iso(), "limitations": list(dict.fromkeys(limitations)),
        }
    )


@dataclass(frozen=True)
class ToolDefinition:
    name: str
    description: str
    parameters: Dict[str, Any]
    function: Callable[..., Dict[str, Any]]

    def provider_schema(self) -> Dict[str, Any]:
        return {"type": "function", "function": {"name": self.name, "description": self.description, "parameters": self.parameters}}


STRING = {"type": "string", "minLength": 1}
NON_NEGATIVE_NUMBER = {"type": "number", "minimum": 0}
INTERESTS = {"type": "array", "items": {"type": "string", "minLength": 1}}

TOOL_REGISTRY: Dict[str, ToolDefinition] = {
    "get_live_destination_context": ToolDefinition(
        "get_live_destination_context",
        "Localiza um destino e consulta clima real quando a data estiver na janela de previsão; informa fontes, horário e limitações sem inventar valores.",
        {"type": "object", "properties": {"destination": STRING, "travel_date": {"type": ["string", "null"], "format": "date"}}, "required": ["destination"], "additionalProperties": False},
        get_live_destination_context,
    ),
    "search_destination_reports": ToolDefinition(
        "search_destination_reports",
        "Busca relatos mockados de um destino brasileiro e aplica filtros por tipo de viagem e avaliação mínima.",
        {"type": "object", "properties": {"destination": STRING, "travel_type": {"type": ["string", "null"]}, "minimum_rating": {"type": ["number", "null"], "minimum": 0, "maximum": 5}, "limit": {"type": "integer", "minimum": 1, "maximum": 50}}, "required": ["destination"], "additionalProperties": False},
        search_destination_reports,
    ),
    "get_destination_information": ToolDefinition(
        "get_destination_information",
        "Obtém informações estruturadas de um destino brasileiro presente no catálogo mockado.",
        {"type": "object", "properties": {"destination": STRING}, "required": ["destination"], "additionalProperties": False},
        get_destination_information,
    ),
    "calculate_trip_budget": ToolDefinition(
        "calculate_trip_budget",
        "Calcula total, média diária, saldo e classificação a partir das categorias informadas.",
        {"type": "object", "properties": {"days": {"type": "integer", "minimum": 1, "maximum": 365}, "available_budget": NON_NEGATIVE_NUMBER, "accommodation": NON_NEGATIVE_NUMBER, "food": NON_NEGATIVE_NUMBER, "transport": NON_NEGATIVE_NUMBER, "activities": NON_NEGATIVE_NUMBER, "other": NON_NEGATIVE_NUMBER}, "required": ["days", "available_budget", "accommodation", "food", "transport", "activities", "other"], "additionalProperties": False},
        calculate_trip_budget,
    ),
    "generate_itinerary_base": ToolDefinition(
        "generate_itinerary_base",
        "Seleciona atrações compatíveis com interesses e orçamento e distribui sem repetição pelos dias.",
        {"type": "object", "properties": {"destination": STRING, "days": {"type": "integer", "minimum": 1, "maximum": 30}, "interests": INTERESTS, "available_budget": NON_NEGATIVE_NUMBER}, "required": ["destination", "days", "interests", "available_budget"], "additionalProperties": False},
        generate_itinerary_base,
    ),
    "compare_destinations_data": ToolDefinition(
        "compare_destinations_data",
        "Compara custo, segurança, transporte, atrações, perfil e interesses de dois destinos mockados.",
        {"type": "object", "properties": {"first_destination": STRING, "second_destination": STRING, "traveler_profile": STRING, "interests": INTERESTS, "budget": NON_NEGATIVE_NUMBER}, "required": ["first_destination", "second_destination", "traveler_profile", "interests", "budget"], "additionalProperties": False},
        compare_destinations_data,
    ),
}


def get_tool_schemas(names: Iterable[str]) -> List[Dict[str, Any]]:
    return [TOOL_REGISTRY[name].provider_schema() for name in names if name in TOOL_REGISTRY]


def execute_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    if name not in TOOL_REGISTRY:
        return _error("TOOL_NOT_ALLOWED", f"Tool não permitida: {name}")
    if not isinstance(arguments, dict):
        return _error("INVALID_TOOL_ARGUMENTS", "Os argumentos da tool devem ser um objeto.")
    try:
        return TOOL_REGISTRY[name].function(**arguments)
    except TypeError:
        return _error("INVALID_TOOL_ARGUMENTS", f"Argumentos ausentes ou desconhecidos para a tool {name}.")


def compact_result(result: Dict[str, Any], limit: int = 220) -> str:
    serialized = json.dumps(result, ensure_ascii=False, default=str)
    return serialized if len(serialized) <= limit else f"{serialized[:limit]}..."
