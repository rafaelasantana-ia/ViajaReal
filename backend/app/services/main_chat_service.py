"""Serviço do endpoint principal de chat, sem persistir conversas no backend."""

import re
from typing import Any, Dict, List, Tuple

from app.prompts.travel_prompts import CHAT_PROMPT, build_messages
from app.schemas.ai import MainChatRequest, MainChatResponse
from app.security.ai_guard import blocked_message, evaluate_chat_message
from app.services.ai_service import AIService, AIServiceError


PUBLIC_TYPES = {"general", "trip_plan", "budget", "reports", "comparison", "report_improvement", "destination_summary"}


class MainChatService:
    def __init__(self, ai_service: AIService | None = None):
        self.ai_service = ai_service or AIService()

    def answer(self, request: MainChatRequest) -> MainChatResponse:
        guard = evaluate_chat_message(request.message)
        if not guard.allowed:
            return self._blocked_response(guard.reason)
        context = request.context.model_dump()
        form_data = context.get("form_data") or {}
        requested_intent = form_data.get("intent")
        intent = requested_intent if requested_intent in PUBLIC_TYPES else self._identify_intent(request.message, request.context.current_page)
        destination = form_data.get("destination") or request.context.selected_destination or self._destination_from_message(request.message)
        tool_plan, missing = self._mock_tool_plan(intent, request.message, destination, form_data)
        if missing:
            return self._missing_information_response(intent, missing, destination)
        payload = {
            "message": request.message,
            "intent": intent,
            "context": context,
            "destination": destination,
            "missing_information": missing,
        }
        history = [message.model_dump() for message in request.conversation_history]
        planned_tools = list(dict.fromkeys(name for name, _arguments in tool_plan))
        # O modelo escolhe somente entre tools compatíveis com a intenção já
        # validada no backend. Isso evita chamadas aleatórias em mensagens gerais.
        allowed_tools = [] if intent == "report_improvement" else planned_tools
        internal = self.ai_service.generate(
            feature="chat",
            messages=build_messages(CHAT_PROMPT, payload, history),
            payload=payload,
            allowed_tools=allowed_tools,
            mock_tool_plan=tool_plan,
        )

        if tool_plan and not internal.tools_used:
            return MainChatResponse(
                answer="Não foi possível consultar os dados necessários para responder com segurança. Tente novamente.",
                type=intent,
                tools_used=[],
                suggestions=["Tentar novamente"],
                data={},
                limitations=["Nenhuma tool necessária foi executada; a aplicação não retornou uma resposta factual sem fonte."],
            )

        data = dict(internal.data)
        metadata = data.pop("response_metadata", {})
        response_type = metadata.get("type") if metadata.get("type") in PUBLIC_TYPES else intent
        suggestions = metadata.get("suggestions") if isinstance(metadata.get("suggestions"), list) else self._default_suggestions(intent, missing)
        limitations = metadata.get("limitations") if isinstance(metadata.get("limitations"), list) else []
        if data.get("provider_fallback"):
            limitations.append(
                "O modelo local não respondeu corretamente; foi usada uma resposta de contingência baseada nas validações e tools do backend."
            )
        if internal.mode == "mock" and not limitations:
            limitations = ["A resposta usa dados mockados e não representa informações atuais ou oficiais."]
        return MainChatResponse(
            answer=internal.message,
            type=response_type,
            tools_used=[tool.name for tool in internal.tools_used],
            suggestions=suggestions[:3],
            data=data,
            limitations=limitations,
        )

    @staticmethod
    def _blocked_response(reason: str | None) -> MainChatResponse:
        return MainChatResponse(
            answer=blocked_message(reason),
            type="general",
            tools_used=[],
            suggestions=["Perguntar sobre um destino", "Planejar uma viagem"],
            data={"blocked_reason": reason or "security_policy"},
            limitations=["A solicitação foi bloqueada pelas validações de segurança da aplicação."],
        )

    @staticmethod
    def friendly_failure(exc: AIServiceError) -> MainChatResponse:
        timeout = "tempo limite" in str(exc).lower()
        return MainChatResponse(
            answer="A resposta demorou mais que o esperado. Tente novamente." if timeout else "Não foi possível consultar o assistente agora. Tente novamente em instantes.",
            type="general",
            tools_used=[],
            suggestions=["Tentar novamente"],
            data={},
            limitations=["O provedor de IA está temporariamente indisponível."],
        )

    @staticmethod
    def _missing_information_response(intent: str, missing: str, destination: str | None) -> MainChatResponse:
        questions = {
            ("reports", "destination"): "Sobre qual destino ou local você quer buscar relatos?",
            ("reports", "report_focus"): f"O que você quer saber nos relatos sobre {destination}: custos, segurança, hospedagem, passeios ou outra informação?",
            ("trip_plan", "destination"): "Para qual destino você quer planejar a viagem?",
            ("trip_plan", "days"): "Quantos dias você pretende ficar nessa viagem?",
            ("trip_plan", "available_budget"): "Qual é o orçamento disponível para essa viagem?",
            ("comparison", "first_destination"): "Qual é o primeiro destino que você quer comparar?",
            ("comparison", "second_destination"): "Qual é o segundo destino que você quer comparar?",
            ("report_improvement", "report_text"): "Qual texto de relato você quer melhorar?",
        }
        answer = questions.get((intent, missing), "Qual informação falta para eu continuar?")
        return MainChatResponse(
            answer=answer,
            type=intent,
            tools_used=[],
            suggestions=[],
            data={"missing_information": missing},
            limitations=[],
        )

    @staticmethod
    def _identify_intent(message: str, current_page: str | None) -> str:
        text = message.lower()
        page = (current_page or "").lower()
        if any(term in text for term in ("melhore meu relato", "melhorar relato", "revisar relato", "corrigir relato")):
            return "report_improvement"
        if any(term in text for term in ("comparar", "compare", "comparação", "versus", " vs ")):
            return "comparison"
        if any(term in text for term in ("orçamento", "orcamento", "gastos", "quanto custa", "calcular custo")):
            return "budget"
        if any(term in text for term in ("planejar", "roteiro", "itinerário", "itinerario")) or "planner" in page:
            return "trip_plan"
        if any(term in text for term in ("relato", "relatos", "experiência de viajante", "experiencias de viajantes", "o que os viajantes")) or "community" in page:
            return "reports"
        if any(term in text for term in ("resumir destino", "resumo do destino", "informações do destino", "informacoes do destino")) or "destination" in page:
            return "destination_summary"
        return "general"

    @staticmethod
    def _destination_from_message(message: str) -> str | None:
        match = re.search(r"(?:sobre|para|em|destino)\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][\wÀ-ÿ -]{1,50})", message)
        return match.group(1).strip(" ?.!,") if match else None

    @staticmethod
    def _number(data: Dict[str, Any], key: str, default: float | int | None = None):
        value = data.get(key, default)
        return value if isinstance(value, (int, float)) and not isinstance(value, bool) else default

    @classmethod
    def _mock_tool_plan(
        cls,
        intent: str,
        message: str,
        destination: str | None,
        form: Dict[str, Any],
    ) -> Tuple[List[Tuple[str, Dict[str, Any]]], str | None]:
        if intent in {"reports", "destination_summary", "trip_plan"} and not destination:
            return [], "destination"
        if intent == "reports":
            if not str(form.get("report_focus") or "").strip():
                return [], "report_focus"
            return [("search_destination_reports", {"destination": destination, "travel_type": form.get("travel_type"), "minimum_rating": cls._number(form, "minimum_rating"), "limit": int(cls._number(form, "limit", 10))})], None
        if intent == "destination_summary":
            return [("get_destination_information", {"destination": destination}), ("search_destination_reports", {"destination": destination, "limit": 5})], None
        if intent == "trip_plan":
            days = cls._number(form, "days")
            budget = cls._number(form, "available_budget", cls._number(form, "budget"))
            if days is None:
                return [], "days"
            if budget is None:
                return [], "available_budget"
            return [("get_live_destination_context", {"destination": destination, "travel_date": form.get("travel_date") or form.get("approximate_date")}), ("get_destination_information", {"destination": destination}), ("generate_itinerary_base", {"destination": destination, "days": int(days), "interests": form.get("interests") or [], "available_budget": float(budget)})], None
        if intent == "budget":
            required = ("days", "available_budget", "accommodation", "food", "transport", "activities", "other")
            missing = next((field for field in required if cls._number(form, field) is None), None)
            if missing:
                return [], missing
            return [("calculate_trip_budget", {field: int(form[field]) if field == "days" else float(form[field]) for field in required})], None
        if intent == "comparison":
            first = form.get("first_destination")
            second = form.get("second_destination")
            if not first:
                return [], "first_destination"
            if not second:
                return [], "second_destination"
            return [("compare_destinations_data", {"first_destination": first, "second_destination": second, "traveler_profile": form.get("traveler_profile") or "viajante geral", "interests": form.get("interests") or [], "budget": float(cls._number(form, "budget", 0))})], None
        if intent == "report_improvement":
            if not form.get("report_text"):
                return [], "report_text"
            return [], None
        if destination and any(term in message.lower() for term in ("clima", "tempo", "temperatura", "previsão", "previsao")):
            return [("get_live_destination_context", {"destination": destination, "travel_date": form.get("travel_date")})], None
        if destination:
            return [("get_destination_information", {"destination": destination})], None
        return [], None

    @staticmethod
    def _default_suggestions(intent: str, missing: str | None) -> List[str]:
        if missing:
            return ["Preencher a informação solicitada e tentar novamente."]
        suggestions = {
            "trip_plan": ["Revisar o orçamento do roteiro."],
            "budget": ["Manter uma margem para imprevistos."],
            "reports": ["Filtrar os relatos por tipo de viagem."],
            "comparison": ["Ajustar perfil, interesses ou orçamento para uma nova comparação."],
            "report_improvement": ["Revisar o texto antes de publicá-lo."],
            "destination_summary": ["Usar o resumo como ponto de partida para o planejamento."],
        }
        return suggestions.get(intent, [])
