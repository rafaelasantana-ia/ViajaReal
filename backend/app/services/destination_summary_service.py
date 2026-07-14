"""Caso de uso de resumo contextual de destino."""

from app.prompts.travel_prompts import DESTINATION_SUMMARY_PROMPT, build_messages
from app.schemas.ai import AIResponse, DestinationSummaryRequest
from app.services.ai_service import AIService


class DestinationSummaryService:
    def __init__(self, ai_service: AIService | None = None):
        self.ai_service = ai_service or AIService()

    def summarize(self, request: DestinationSummaryRequest) -> AIResponse:
        payload = request.model_dump()
        return self.ai_service.generate(
            feature="destination_summary",
            messages=build_messages(DESTINATION_SUMMARY_PROMPT, payload),
            payload=payload,
            allowed_tools=["get_destination_information", "search_destination_reports"],
            mock_tool_plan=[
                ("get_destination_information", {"destination": request.destination}),
                ("search_destination_reports", {"destination": request.destination, "limit": 12}),
            ],
        )
