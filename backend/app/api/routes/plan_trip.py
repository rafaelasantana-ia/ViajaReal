"""Endpoint específico de planejamento que reutiliza a camada central de IA."""

import logging

from fastapi import APIRouter, HTTPException

from app.schemas.ai import DetailedTripPlanRequest, DetailedTripPlanResponse
from app.services.ai_service import AIServiceError
from app.services.trip_planner_service import TripPlannerService

router = APIRouter(prefix="/api/ai", tags=["IA principal"])
logger = logging.getLogger("viajareal.ai.plan_trip")


@router.post("/plan-trip", response_model=DetailedTripPlanResponse, summary="Gera planejamento detalhado com IA")
def plan_trip(payload: DetailedTripPlanRequest) -> DetailedTripPlanResponse:
    try:
        return TripPlannerService().plan_detailed(payload)
    except AIServiceError as exc:
        status = 504 if "tempo limite" in str(exc).lower() else 502
        raise HTTPException(status_code=status, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("plan_trip_unexpected_failure error_type=%s", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Não foi possível gerar o planejamento agora.") from None
