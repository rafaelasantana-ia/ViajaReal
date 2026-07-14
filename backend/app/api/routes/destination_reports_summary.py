"""Endpoint de estatísticas e síntese de relatos por destino."""

import logging

from fastapi import APIRouter, HTTPException

from app.schemas.ai import DestinationReportsSummaryRequest, DestinationReportsSummaryResponse
from app.services.ai_service import AIServiceError
from app.services.destination_reports_summary_service import DestinationReportsSummaryService

router = APIRouter(prefix="/api/ai", tags=["IA principal"])
logger = logging.getLogger("viajareal.ai.destination_reports")


@router.post(
    "/summarize-destination-reports",
    response_model=DestinationReportsSummaryResponse,
    summary="Calcula estatísticas e sintetiza relatos de um destino",
)
def summarize_destination_reports(payload: DestinationReportsSummaryRequest) -> DestinationReportsSummaryResponse:
    try:
        return DestinationReportsSummaryService().summarize(payload)
    except AIServiceError as exc:
        message = str(exc)
        status = 404 if "não encontr" in message.lower() or "não há relatos" in message.lower() else (504 if "tempo limite" in message.lower() else 502)
        raise HTTPException(status_code=status, detail=message) from exc
    except Exception as exc:
        logger.error("destination_reports_summary_failure error_type=%s", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Não foi possível analisar os relatos agora.") from None
