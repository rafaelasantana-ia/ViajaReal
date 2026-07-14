"""Rotas finas da camada de IA; validação é feita pelos schemas Pydantic."""

from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.schemas.ai import AIResponse, ChatRequest, DestinationSummaryRequest, ReportSummaryRequest, TravelReportInput, TripPlanRequest
from app.services.ai_service import AIServiceError
from app.services.chat_service import ChatService
from app.services.destination_summary_service import DestinationSummaryService
from app.services.report_ai_service import ReportAIService
from app.services.trip_planner_service import TripPlannerService

router = APIRouter(prefix="/ai", tags=["IA generativa"])


def _service_error(exc: AIServiceError) -> HTTPException:
    status = 504 if "tempo limite" in str(exc).lower() else 502
    return HTTPException(status_code=status, detail=str(exc))


@router.get("/status", summary="Informa o modo da camada de IA")
def ai_status():
    settings = get_settings()
    return {"status": "ok", "mode": settings.ai_mode, "model_configured": bool(settings.ai_model)}


@router.post("/chat", response_model=AIResponse, summary="Conversa com o assistente de viagens")
def chat(payload: ChatRequest):
    try:
        return ChatService().answer(payload)
    except AIServiceError as exc:
        raise _service_error(exc) from exc


@router.post("/trip-planner", response_model=AIResponse, summary="Gera um planejamento estruturado")
def plan_trip(payload: TripPlanRequest):
    try:
        return TripPlannerService().plan(payload)
    except AIServiceError as exc:
        raise _service_error(exc) from exc


@router.post("/reports/improve", response_model=AIResponse, summary="Melhora a redação de um relato")
def improve_report(payload: TravelReportInput):
    try:
        return ReportAIService().improve(payload)
    except AIServiceError as exc:
        raise _service_error(exc) from exc


@router.post("/reports/summary", response_model=AIResponse, summary="Resume relatos de um destino")
def summarize_reports(payload: ReportSummaryRequest):
    try:
        return ReportAIService().summarize(payload)
    except AIServiceError as exc:
        raise _service_error(exc) from exc


@router.post("/destinations/summary", response_model=AIResponse, summary="Resume informações e relatos do destino")
def summarize_destination(payload: DestinationSummaryRequest):
    try:
        return DestinationSummaryService().summarize(payload)
    except AIServiceError as exc:
        raise _service_error(exc) from exc
