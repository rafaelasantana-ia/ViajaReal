"""Estatísticas determinísticas e síntese textual dos relatos de um destino."""

from collections import Counter
from typing import Any, Dict, Iterable, List

from app.prompts.travel_prompts import DESTINATION_REPORTS_SUMMARY_PROMPT, build_messages
from app.schemas.ai import (
    DestinationReportStatistics,
    DestinationReportsSummaryRequest,
    DestinationReportsSummaryResponse,
    DestinationReportTextSynthesis,
    RecurringReportItem,
)
from app.services.ai_service import AIService, AIServiceError


def _ranked_items(values: Iterable[str], *, recurring_only: bool, limit: int = 5) -> List[RecurringReportItem]:
    labels: Dict[str, str] = {}
    counter: Counter[str] = Counter()
    for value in values:
        cleaned = str(value).strip()
        if not cleaned:
            continue
        key = cleaned.casefold()
        labels.setdefault(key, cleaned)
        counter[key] += 1
    ranked = sorted(counter.items(), key=lambda item: (-item[1], labels[item[0]]))
    if recurring_only:
        ranked = [item for item in ranked if item[1] >= 2]
    return [RecurringReportItem(label=labels[key], count=count) for key, count in ranked[:limit]]


class DestinationReportsSummaryService:
    def __init__(self, ai_service: AIService | None = None):
        self.ai_service = ai_service or AIService()

    def summarize(self, request: DestinationReportsSummaryRequest) -> DestinationReportsSummaryResponse:
        results, used = self.ai_service.execute_required_tools(
            [("search_destination_reports", {"destination": request.destination, "limit": 50})]
        )
        tool_result = results["search_destination_reports"]
        if not tool_result.get("ok"):
            message = (tool_result.get("error") or {}).get("message", "Destino não encontrado nos relatos.")
            raise AIServiceError(message)
        report_data = tool_result.get("data") or {}
        reports = report_data.get("reports") or []
        if not reports:
            raise AIServiceError("Não há relatos suficientes para analisar este destino.")

        total_spent = [float(report["total_spent"]) for report in reports]
        ratings = [float(report["rating"]) for report in reports]
        positive_points = _ranked_items(
            (point for report in reports for point in report.get("positives", [])),
            recurring_only=True,
        )
        negative_points = _ranked_items(
            (point for report in reports for point in report.get("negatives", [])),
            recurring_only=True,
        )
        mentioned_places = _ranked_items(
            (place for report in reports for place in report.get("recommended_places", [])),
            recurring_only=False,
        )
        profile_counts = Counter(str(report.get("travel_type", "")).strip().casefold() for report in reports if report.get("travel_type"))
        highest_profile_count = max(profile_counts.values(), default=0)
        leading_profiles = sorted(profile for profile, count in profile_counts.items() if count == highest_profile_count)
        compatible_profile = (
            leading_profiles[0]
            if len(leading_profiles) == 1
            else "A pequena amostra não indica um perfil predominante."
        )
        statistics = DestinationReportStatistics(
            average_expenses=round(sum(total_spent) / len(total_spent), 2),
            average_rating=round(sum(ratings) / len(ratings), 2),
            minimum_expenses=min(total_spent),
            maximum_expenses=max(total_spent),
            minimum_rating=min(ratings),
            maximum_rating=max(ratings),
            compatible_traveler_profile=compatible_profile,
            recurring_positive_points=positive_points,
            recurring_negative_points=negative_points,
            most_mentioned_places=mentioned_places,
        )

        limitations = [
            "Os relatos representam experiências individuais e não condições atuais ou oficiais.",
            "Os dados e valores analisados são mockados.",
        ]
        if len(reports) < 5:
            limitations.append(f"A amostra contém apenas {len(reports)} relatos; não permite conclusões fortes.")
        if not positive_points:
            limitations.append("Não houve ponto positivo repetido literalmente em mais de um relato.")
        if not negative_points:
            limitations.append("Não houve ponto negativo repetido literalmente em mais de um relato.")

        fallback = {
            "opinion_general": (
                f"Nesta pequena amostra de {len(reports)} relatos sobre {report_data['destination']['name']}, "
                f"as avaliações variaram de {statistics.minimum_rating} a {statistics.maximum_rating}."
            ),
            "recurring_recommendations": [
                f"{item.label} foi recomendado em {item.count} relato(s)."
                for item in mentioned_places
                if item.count >= 2
            ],
            "divergences": [
                f"Os gastos totais variaram de R$ {statistics.minimum_expenses:.2f} a R$ {statistics.maximum_expenses:.2f}.",
                f"As avaliações variaram de {statistics.minimum_rating} a {statistics.maximum_rating}.",
            ],
        }
        synthesis_payload = {
            "destination": report_data["destination"],
            "reports_analyzed": len(reports),
            "calculated_statistics": statistics.model_dump(),
            "report_excerpts": [
                {
                    "travel_type": report["travel_type"],
                    "story_summary": report["story_summary"],
                    "positives": report["positives"],
                    "negatives": report["negatives"],
                    "recommended_places": report["recommended_places"],
                }
                for report in reports
            ],
            "limitations": limitations,
        }
        synthesis_data = self.ai_service.synthesize_structured_data(
            feature="destination_reports_summary",
            messages=build_messages(DESTINATION_REPORTS_SUMMARY_PROMPT, synthesis_payload),
            fallback_data=fallback,
            required_fields={"opinion_general": str, "recurring_recommendations": list, "divergences": list},
        )
        if not synthesis_data.get("divergences"):
            synthesis_data["divergences"] = fallback["divergences"]
        synthesis = DestinationReportTextSynthesis.model_validate(synthesis_data)
        return DestinationReportsSummaryResponse(
            destination=report_data["destination"]["name"],
            reports_analyzed=len(reports),
            calculated_statistics=statistics,
            textual_synthesis=synthesis,
            limitations=limitations,
            tools_used=[tool.name for tool in used],
            mock_data=True,
        )
