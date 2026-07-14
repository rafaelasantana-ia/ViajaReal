"""Contratos de entrada e saída da camada central de IA."""

from datetime import date
from typing import Any, Dict, List, Literal

import json
import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_CHAT_MESSAGE_LENGTH = 3000
MAX_HISTORY_MESSAGES = 10
MAX_HISTORY_MESSAGE_LENGTH = 2000


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=MAX_HISTORY_MESSAGE_LENGTH)

    @field_validator("content")
    @classmethod
    def clean_content(cls, value: str) -> str:
        cleaned = value.replace("\x00", "").strip()
        if not cleaned:
            raise ValueError("content não pode estar vazio.")
        return cleaned


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_CHAT_MESSAGE_LENGTH)
    destination: str | None = Field(default=None, max_length=120)
    history: List[ChatMessage] = Field(default_factory=list, max_length=MAX_HISTORY_MESSAGES)

    @field_validator("message")
    @classmethod
    def clean_legacy_message(cls, value: str) -> str:
        cleaned = value.replace("\x00", "").strip()
        if not cleaned:
            raise ValueError("message não pode estar vazia.")
        return cleaned

    @field_validator("history", mode="before")
    @classmethod
    def limit_legacy_history(cls, value: Any) -> List[Any]:
        if not isinstance(value, list):
            return []
        return value[-MAX_HISTORY_MESSAGES:]


class MainChatContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_page: str | None = Field(default=None, max_length=120)
    selected_destination: str | None = Field(default=None, max_length=120)
    form_data: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("current_page", "selected_destination")
    @classmethod
    def clean_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.replace("\x00", "").strip()
        return cleaned or None

    @field_validator("form_data")
    @classmethod
    def limit_form_data(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        if len(json.dumps(value, ensure_ascii=False, default=str)) > 8000:
            raise ValueError("form_data excede o limite permitido.")
        return value


class MainChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=MAX_CHAT_MESSAGE_LENGTH)
    session_id: str = Field(min_length=1, max_length=128)
    conversation_history: List[ChatMessage] = Field(default_factory=list, max_length=100)
    context: MainChatContext = Field(default_factory=MainChatContext)

    @field_validator("message")
    @classmethod
    def clean_message(cls, value: str) -> str:
        cleaned = value.replace("\x00", "").strip()
        if not cleaned:
            raise ValueError("message não pode estar vazia.")
        return cleaned

    @field_validator("session_id")
    @classmethod
    def sanitize_session_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not re.fullmatch(r"[A-Za-z0-9._:-]+", cleaned):
            raise ValueError("session_id contém caracteres inválidos.")
        return cleaned

    @field_validator("conversation_history", mode="before")
    @classmethod
    def sanitize_history(cls, value: Any) -> List[Dict[str, str]]:
        if not isinstance(value, list):
            return []
        sanitized: List[Dict[str, str]] = []
        for item in value:
            if not isinstance(item, dict) or item.get("role") not in {"user", "assistant"}:
                continue
            content = str(item.get("content", "")).replace("\x00", "").strip()[:MAX_HISTORY_MESSAGE_LENGTH]
            if content:
                sanitized.append({"role": item["role"], "content": content})
        return sanitized[-MAX_HISTORY_MESSAGES:]


class MainChatResponse(BaseModel):
    answer: str
    type: Literal["general", "trip_plan", "budget", "reports", "comparison", "report_improvement", "destination_summary"]
    tools_used: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list, max_length=3)
    data: Dict[str, Any] = Field(default_factory=dict)
    limitations: List[str] = Field(default_factory=list)


class TripPlanRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=120)
    days: int = Field(ge=1, le=60)
    budget: float = Field(gt=0)
    style: str = Field(default="Confortável", min_length=2, max_length=80)
    travelers: int = Field(default=1, ge=1, le=30)
    interests: List[str] = Field(default_factory=list, max_length=12)


class DetailedTripPlanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    destination: str = Field(min_length=2, max_length=120)
    days: int = Field(ge=1, le=30)
    budget: float = Field(gt=0, le=1_000_000)
    travel_type: str = Field(min_length=2, max_length=80)
    company: str = Field(min_length=2, max_length=80)
    interests: List[str] = Field(min_length=1, max_length=12)
    comfort_level: str = Field(min_length=2, max_length=80)
    approximate_date: date
    observations: str | None = Field(default=None, max_length=2000)

    @field_validator("destination", "travel_type", "company", "comfort_level", "observations")
    @classmethod
    def clean_trip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.replace("\x00", "").strip()
        if not cleaned:
            raise ValueError("O campo não pode ficar vazio.")
        return cleaned

    @field_validator("interests")
    @classmethod
    def clean_interests(cls, value: List[str]) -> List[str]:
        cleaned = [item.replace("\x00", "").strip() for item in value if item.strip()]
        if not cleaned:
            raise ValueError("Informe pelo menos um interesse.")
        return list(dict.fromkeys(cleaned))


class DetailedPlanDay(BaseModel):
    day: int = Field(ge=1)
    activities: List[str] = Field(default_factory=list)
    estimated_activities_cost: float = Field(default=0, ge=0)


class DetailedTripPlanResponse(BaseModel):
    summary: str
    profile_fit: str
    estimated_total: float = Field(ge=0)
    budget_status: str
    positive_points: List[str] = Field(default_factory=list)
    attention_points: List[str] = Field(default_factory=list)
    itinerary: List[DetailedPlanDay] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    tools_used: List[str]
    mock_data: bool
    live_context: Dict[str, Any] = Field(default_factory=dict)
    data_sources: Dict[str, str] = Field(default_factory=dict)


class TravelReportInput(BaseModel):
    destination: str = Field(min_length=2, max_length=120)
    title: str = Field(default="Relato de viagem", max_length=160)
    text: str = Field(min_length=10, max_length=12000)
    travel_type: str | None = Field(default=None, max_length=80)
    cost: float | None = Field(default=None, ge=0)
    safety: str | None = Field(default=None, max_length=80)


class ImproveReportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    destination: str = Field(min_length=2, max_length=120)
    original_text: str = Field(min_length=20, max_length=12000)
    trip_type: str | None = Field(default=None, max_length=80)
    expenses: Dict[str, float] = Field(default_factory=dict)
    rating: float | None = Field(default=None, ge=0, le=5)

    @field_validator("destination", "original_text", "trip_type")
    @classmethod
    def clean_report_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.replace("\x00", "").strip()
        if not cleaned:
            raise ValueError("O campo não pode ficar vazio.")
        return cleaned

    @field_validator("expenses")
    @classmethod
    def validate_expenses(cls, value: Dict[str, float]) -> Dict[str, float]:
        if len(value) > 20 or any(amount < 0 for amount in value.values()):
            raise ValueError("As despesas devem conter até 20 valores não negativos.")
        return value


class ImproveReportResponse(BaseModel):
    improved_text: str
    summary: str = Field(max_length=400)
    positive_points: List[str] = Field(default_factory=list)
    negative_points: List[str] = Field(default_factory=list)
    mentioned_places: List[str] = Field(default_factory=list)
    suggested_tags: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)


class ReportSummaryRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=120)
    reports: List[TravelReportInput] = Field(default_factory=list, max_length=50)


class DestinationSummaryRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=120)
    interests: List[str] = Field(default_factory=list, max_length=12)


class DestinationReportsSummaryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    destination: str = Field(min_length=2, max_length=120)

    @field_validator("destination")
    @classmethod
    def clean_destination(cls, value: str) -> str:
        cleaned = value.replace("\x00", "").strip()
        if not cleaned:
            raise ValueError("Informe o destino.")
        return cleaned


class RecurringReportItem(BaseModel):
    label: str
    count: int = Field(ge=1)


class DestinationReportStatistics(BaseModel):
    average_expenses: float = Field(ge=0)
    average_rating: float = Field(ge=0, le=5)
    minimum_expenses: float = Field(ge=0)
    maximum_expenses: float = Field(ge=0)
    minimum_rating: float = Field(ge=0, le=5)
    maximum_rating: float = Field(ge=0, le=5)
    compatible_traveler_profile: str
    recurring_positive_points: List[RecurringReportItem] = Field(default_factory=list)
    recurring_negative_points: List[RecurringReportItem] = Field(default_factory=list)
    most_mentioned_places: List[RecurringReportItem] = Field(default_factory=list)


class DestinationReportTextSynthesis(BaseModel):
    opinion_general: str
    recurring_recommendations: List[str] = Field(default_factory=list)
    divergences: List[str] = Field(default_factory=list)


class DestinationReportsSummaryResponse(BaseModel):
    destination: str
    reports_analyzed: int = Field(ge=0)
    calculated_statistics: DestinationReportStatistics
    textual_synthesis: DestinationReportTextSynthesis
    limitations: List[str] = Field(default_factory=list)
    tools_used: List[str]
    mock_data: bool = True


class BudgetBreakdown(BaseModel):
    lodging: float = Field(ge=0)
    food: float = Field(ge=0)
    transport: float = Field(ge=0)
    activities: float = Field(ge=0)
    contingency: float = Field(ge=0)
    total: float = Field(ge=0)
    per_person: float = Field(ge=0)
    currency: str = "BRL"


class ItineraryBlock(BaseModel):
    period: str
    city: str
    description: str
    activities: List[str] = Field(default_factory=list)


class Itinerary(BaseModel):
    destination: str
    days: int
    style: str
    summary: str
    blocks: List[ItineraryBlock]
    budget: BudgetBreakdown
    safety: str
    best_season: str


class ToolUsed(BaseModel):
    name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    result_summary: str


class AIResponse(BaseModel):
    request_id: str
    feature: Literal["chat", "trip_planner", "report_improvement", "report_summary", "destination_summary"]
    message: str
    data: Dict[str, Any] = Field(default_factory=dict)
    tools_used: List[ToolUsed] = Field(default_factory=list)
    mode: Literal["mock", "real"]

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("A resposta da IA não pode ser vazia.")
        return value.strip()
