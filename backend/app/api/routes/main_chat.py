"""Endpoint público principal da IA."""

import logging

from fastapi import APIRouter

from app.schemas.ai import MainChatRequest, MainChatResponse
from app.services.ai_service import AIServiceError
from app.services.main_chat_service import MainChatService

router = APIRouter(prefix="/api/ai", tags=["IA principal"])
logger = logging.getLogger("viajareal.ai.route")


@router.post("/chat", response_model=MainChatResponse, summary="Endpoint principal do assistente de viagens")
def main_chat(payload: MainChatRequest) -> MainChatResponse:
    service = MainChatService()
    try:
        return service.answer(payload)
    except AIServiceError as exc:
        return service.friendly_failure(exc)
    except Exception as exc:  # última barreira: não registra payload, segredo ou mensagem da exceção
        logger.error("main_chat_unexpected_failure error_type=%s", type(exc).__name__)
        return MainChatResponse(
            answer="Não foi possível consultar o assistente agora. Tente novamente em instantes.",
            type="general",
            tools_used=[],
            suggestions=["Tentar novamente"],
            data={},
            limitations=["O assistente está temporariamente indisponível."],
        )
