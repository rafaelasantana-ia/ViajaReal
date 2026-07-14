"""Caso de uso de planejamento de viagem."""

from app.prompts.travel_prompts import TRIP_PLANNER_PROMPT, build_messages
from app.schemas.ai import AIResponse, DetailedPlanDay, DetailedTripPlanRequest, DetailedTripPlanResponse, TripPlanRequest
from app.services.ai_service import AIService, AIServiceError


class TripPlannerService:
    def __init__(self, ai_service: AIService | None = None):
        self.ai_service = ai_service or AIService()

    def plan(self, request: TripPlanRequest) -> AIResponse:
        payload = request.model_dump()
        destination = request.destination
        planned = request.budget
        return self.ai_service.generate(
            feature="trip_planner",
            messages=build_messages(TRIP_PLANNER_PROMPT, payload),
            payload=payload,
            allowed_tools=["get_live_destination_context", "get_destination_information", "search_destination_reports", "calculate_trip_budget", "generate_itinerary_base"],
            mock_tool_plan=[
                ("get_live_destination_context", {"destination": destination}),
                ("get_destination_information", {"destination": destination}),
                ("search_destination_reports", {"destination": destination, "limit": 8}),
                ("calculate_trip_budget", {"days": request.days, "available_budget": planned, "accommodation": planned * 0.35, "food": planned * 0.20, "transport": planned * 0.15, "activities": planned * 0.20, "other": planned * 0.05}),
                ("generate_itinerary_base", {"destination": destination, "days": request.days, "interests": request.interests, "available_budget": planned * 0.20}),
            ],
        )

    def plan_detailed(self, request: DetailedTripPlanRequest) -> DetailedTripPlanResponse:
        payload = {
            **request.model_dump(mode="json"),
            "style": request.comfort_level,
            "travelers": 1,
            "detailed_plan": True,
        }
        planned = request.budget
        response = self.ai_service.generate_grounded(
            feature="trip_planner",
            messages=build_messages(TRIP_PLANNER_PROMPT, payload),
            payload=payload,
            required_tool_plan=[
                ("get_live_destination_context", {"destination": request.destination, "travel_date": request.approximate_date.isoformat()}),
                ("get_destination_information", {"destination": request.destination}),
                ("search_destination_reports", {"destination": request.destination, "travel_type": request.company.lower(), "limit": 8}),
                ("calculate_trip_budget", {"days": request.days, "available_budget": planned, "accommodation": planned * 0.35, "food": planned * 0.20, "transport": planned * 0.15, "activities": planned * 0.20, "other": planned * 0.05}),
                ("generate_itinerary_base", {"destination": request.destination, "days": request.days, "interests": request.interests, "available_budget": planned * 0.20}),
            ],
        )
        planning = response.data.get("planning")
        required_tools = {
            "get_live_destination_context",
            "get_destination_information",
            "search_destination_reports",
            "calculate_trip_budget",
            "generate_itinerary_base",
        }
        used_tools = {tool.name for tool in response.tools_used}
        if not required_tools.issubset(used_tools):
            raise AIServiceError("A IA não executou todas as ferramentas obrigatórias do planejamento.")
        if not isinstance(planning, dict):
            raise AIServiceError("A IA não retornou o planejamento detalhado esperado.")
        try:
            return DetailedTripPlanResponse(
                summary=planning["summary"],
                profile_fit=planning["profile_fit"],
                estimated_total=planning["estimated_total"],
                budget_status=planning["budget_status"],
                positive_points=planning.get("positive_points") or [],
                attention_points=planning.get("attention_points") or [],
                itinerary=[DetailedPlanDay.model_validate(day) for day in planning.get("itinerary") or []],
                limitations=planning.get("limitations") or [],
                tools_used=[tool.name for tool in response.tools_used],
                mock_data=True,
                live_context=planning.get("live_context") or {},
                data_sources=planning.get("data_sources") or {},
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise AIServiceError("A IA retornou um planejamento detalhado inválido.") from exc
