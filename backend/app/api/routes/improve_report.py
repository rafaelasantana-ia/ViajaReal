"""Endpoint específico para organizar relatos sem alterar gastos ou avaliações."""

import logging

from fastapi import APIRouter, HTTPException

from app.schemas.ai import ImproveReportRequest, ImproveReportResponse
from app.services.ai_service import AIServiceError
from app.services.report_ai_service import ReportAIService

router = APIRouter(prefix="/api/ai", tags=["IA principal"])
logger = logging.getLogger("viajareal.ai.improve_report")


@router.post("/improve-report", response_model=ImproveReportResponse, summary="Organiza um relato preservando os fatos")
def improve_report(payload: ImproveReportRequest) -> ImproveReportResponse:
    try:
        return ReportAIService().improve_detailed(payload)
    except AIServiceError as exc:
        status = 504 if "tempo limite" in str(exc).lower() else 502
        raise HTTPException(status_code=status, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("improve_report_unexpected_failure error_type=%s", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Não foi possível organizar o relato agora.") from None
