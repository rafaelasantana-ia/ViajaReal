"""Casos de uso de melhoria e resumo de relatos."""

import re

from app.prompts.travel_prompts import REPORT_IMPROVEMENT_PROMPT, REPORT_SUMMARY_PROMPT, build_messages
from app.schemas.ai import AIResponse, ImproveReportRequest, ImproveReportResponse, ReportSummaryRequest, TravelReportInput
from app.security.ai_guard import contains_instruction_like_content
from app.services.ai_service import AIService, AIServiceError


class ReportAIService:
    def __init__(self, ai_service: AIService | None = None):
        self.ai_service = ai_service or AIService()

    def improve(self, request: TravelReportInput) -> AIResponse:
        payload = request.model_dump()
        return self.ai_service.generate(
            feature="report_improvement",
            messages=build_messages(REPORT_IMPROVEMENT_PROMPT, payload),
            payload=payload,
            allowed_tools=["get_destination_information"],
            mock_tool_plan=[("get_destination_information", {"destination": request.destination})],
        )

    def improve_detailed(self, request: ImproveReportRequest) -> ImproveReportResponse:
        # Valores e nota ficam fora do prompt para que o modelo não possa modificá-los.
        payload = {
            "destination": request.destination,
            "original_text": request.original_text,
            "text": request.original_text,
            "trip_type": request.trip_type,
            "expenses_provided": bool(request.expenses),
            "expense_categories": list(request.expenses),
            "rating_provided": request.rating is not None,
            "detailed_improvement": True,
            "content_boundary": "untrusted_user_report",
            "contains_instruction_like_text": contains_instruction_like_content(request.original_text),
        }
        response = self.ai_service.generate(
            feature="report_improvement",
            messages=build_messages(REPORT_IMPROVEMENT_PROMPT, payload),
            payload=payload,
            allowed_tools=["get_destination_information"],
            mock_tool_plan=[("get_destination_information", {"destination": request.destination})],
        )
        data = response.data
        required = ("improved_text", "summary", "positive_points", "negative_points", "mentioned_places", "suggested_tags", "missing_information", "limitations")
        if any(field not in data for field in required):
            raise AIServiceError("A IA não retornou a organização completa do relato.")

        improved = str(data["improved_text"]).strip()
        original_numbers = re.findall(r"\d+(?:[.,]\d+)*", request.original_text)
        improved_numbers = re.findall(r"\d+(?:[.,]\d+)*", improved)
        if original_numbers != improved_numbers:
            improved = request.original_text

        def text_list(field: str) -> list[str]:
            value = data.get(field)
            if not isinstance(value, list):
                raise AIServiceError("A IA retornou listas inválidas para o relato.")
            return [str(item).strip() for item in value if str(item).strip()]

        mentioned_places = [
            place for place in text_list("mentioned_places")
            if place.casefold() in request.original_text.casefold()
        ]
        try:
            return ImproveReportResponse(
                improved_text=improved,
                summary=str(data["summary"]).strip()[:400],
                positive_points=text_list("positive_points"),
                negative_points=text_list("negative_points"),
                mentioned_places=mentioned_places,
                suggested_tags=text_list("suggested_tags"),
                missing_information=text_list("missing_information"),
                limitations=text_list("limitations"),
            )
        except (TypeError, ValueError) as exc:
            raise AIServiceError("A IA retornou uma organização inválida do relato.") from exc

    def summarize(self, request: ReportSummaryRequest) -> AIResponse:
        payload = request.model_dump()
        return self.ai_service.generate(
            feature="report_summary",
            messages=build_messages(REPORT_SUMMARY_PROMPT, payload),
            payload=payload,
            allowed_tools=["search_destination_reports"],
            mock_tool_plan=[("search_destination_reports", {"destination": request.destination, "limit": 20})],
        )
