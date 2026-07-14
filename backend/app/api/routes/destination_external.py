"""Endpoints backend-only para fontes públicas de destinos."""

import logging

from fastapi import APIRouter, HTTPException, Query

from app.services.external_api import ExternalAPIError
from app.services.geocoding_service import GeocodingService
from app.services.image_service import ImageService
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/api/destinations", tags=["Dados externos de destinos"])
logger = logging.getLogger("viajareal.external.routes")


@router.get("/location", summary="Geocodifica um destino com Nominatim")
def destination_location(destination: str = Query(..., min_length=2, max_length=120)) -> dict:
    try:
        return GeocodingService().locate(destination)
    except ExternalAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)}) from exc


@router.get("/weather", summary="Consulta clima e previsão no Open-Meteo")
def destination_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    forecast_days: int = Query(7, ge=1, le=16),
) -> dict:
    try:
        return WeatherService().get_weather(latitude, longitude, forecast_days)
    except ExternalAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)}) from exc


@router.get("/images", summary="Busca imagens de destino na Pexels")
def destination_images(
    destination: str = Query(..., min_length=2, max_length=120),
    limit: int = Query(3, ge=1, le=10),
) -> dict:
    return ImageService().search(destination, limit)
