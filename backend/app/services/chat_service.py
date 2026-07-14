"""Caso de uso de conversa apoiada pelas tools de viagem."""

import re
from typing import Any, Dict, List, Tuple
from uuid import uuid4

from app.prompts.travel_prompts import CHAT_PROMPT, build_messages
from app.schemas.ai import AIResponse, ChatRequest
from app.security.ai_guard import blocked_message, evaluate_chat_message
from app.services.ai_service import AIService


class ChatService:
    def __init__(self, ai_service: AIService | None = None):
        self.ai_service = ai_service or AIService()

    def answer(self, request: ChatRequest) -> AIResponse:
        guard = evaluate_chat_message(request.message)
        if not guard.allowed:
            return AIResponse(
                request_id=uuid4().hex,
                feature="chat",
                message=blocked_message(guard.reason),
                data={"blocked_reason": guard.reason or "security_policy"},
                tools_used=[],
                mode=self.ai_service.settings.ai_mode,
            )
        payload = request.model_dump()
        destination = request.destination or self._destination_from_message(request.message) or "Florianópolis"
        payload["destination"] = destination
        plan = self._mock_tool_plan(request.message, destination)
        planned_tools = list(dict.fromkeys(name for name, _arguments in plan))
        history = [message.model_dump() for message in request.history]
        return self.ai_service.generate(
            feature="chat",
            messages=build_messages(CHAT_PROMPT, payload, history),
            payload=payload,
            allowed_tools=planned_tools,
            mock_tool_plan=plan,
        )

    @staticmethod
    def _destination_from_message(message: str) -> str | None:
        match = re.search(r"(?:sobre|para|em)\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][\wÀ-ÿ -]{1,40})", message)
        return match.group(1).strip(" ?.!,") if match else None

    @staticmethod
    def _money_from_message(message: str, default: float) -> float:
        match = re.search(r"(?:R\$\s*)?(\d{2,}(?:[.,]\d{1,2})?)", message)
        if not match:
            return default
        raw = match.group(1).replace(".", "").replace(",", ".")
        return float(raw)

    @classmethod
    def _mock_tool_plan(cls, message: str, destination: str) -> List[Tuple[str, Dict[str, Any]]]:
        lowered = message.lower()
        if any(term in lowered for term in ("clima", "tempo", "temperatura", "previsão", "previsao")):
            return [("get_live_destination_context", {"destination": destination})]
        compare_match = re.search(r"compar\w*\s+(.+?)\s+(?:com|e|versus|vs\.?)\s+(.+?)(?:[?.!]|$)", message, re.IGNORECASE)
        if compare_match:
            return [
                (
                    "compare_destinations_data",
                    {
                        "first_destination": compare_match.group(1).strip(),
                        "second_destination": compare_match.group(2).strip(),
                        "traveler_profile": "viajante geral",
                        "interests": [],
                        "budget": cls._money_from_message(message, 500.0),
                    },
                )
            ]
        if any(term in lowered for term in ("orçamento", "orcamento", "custo", "gasto")):
            days_match = re.search(r"(\d+)\s*dias?", lowered)
            days = int(days_match.group(1)) if days_match else 7
            available = cls._money_from_message(message, days * 500.0)
            return [
                (
                    "calculate_trip_budget",
                    {
                        "days": days,
                        "available_budget": available,
                        "accommodation": available * 0.35,
                        "food": available * 0.20,
                        "transport": available * 0.15,
                        "activities": available * 0.20,
                        "other": available * 0.05,
                    },
                )
            ]
        if any(term in lowered for term in ("roteiro", "itinerário", "itinerario")):
            days_match = re.search(r"(\d+)\s*dias?", lowered)
            return [("generate_itinerary_base", {"destination": destination, "days": int(days_match.group(1)) if days_match else 5, "interests": [], "available_budget": cls._money_from_message(message, 1500.0)})]
        return [("get_destination_information", {"destination": destination}), ("search_destination_reports", {"destination": destination, "limit": 5})]
