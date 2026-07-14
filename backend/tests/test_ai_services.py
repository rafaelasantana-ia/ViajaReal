import os
import unittest

os.environ["AI_MODE"] = "mock"

from app.schemas.ai import ChatRequest, DestinationReportsSummaryRequest, DestinationSummaryRequest, DetailedTripPlanRequest, ImproveReportRequest, ReportSummaryRequest, TravelReportInput, TripPlanRequest
from app.services.chat_service import ChatService
from app.services.destination_summary_service import DestinationSummaryService
from app.services.destination_reports_summary_service import DestinationReportsSummaryService
from app.services.report_ai_service import ReportAIService
from app.services.trip_planner_service import TripPlannerService


class MockAIServicesTest(unittest.TestCase):
    def test_trip_planner_executes_expected_tools(self):
        response = TripPlannerService().plan(
            TripPlanRequest(destination="Florianópolis", days=4, budget=6000, style="Confortável", travelers=2, interests=["praia"])
        )
        self.assertEqual(response.mode, "mock")
        self.assertEqual(len(response.data["itinerary"]["blocks"]), 4)
        self.assertIn("calculate_trip_budget", [tool.name for tool in response.tools_used])

    def test_detailed_trip_planner_returns_grounded_public_fields(self):
        response = TripPlannerService().plan_detailed(
            DetailedTripPlanRequest(
                destination="Bonito",
                days=5,
                budget=6500,
                travel_type="Ecoturismo",
                company="Casal",
                interests=["natureza", "aventura"],
                comfort_level="Confortável",
                approximate_date="2026-09-15",
                observations="Preferimos atividades ao ar livre.",
            )
        )
        self.assertTrue(response.mock_data)
        self.assertEqual(len(response.itinerary), 5)
        self.assertEqual(
            set(response.tools_used),
            {"get_live_destination_context", "get_destination_information", "search_destination_reports", "calculate_trip_budget", "generate_itinerary_base"},
        )
        self.assertEqual(response.live_context["location"]["source_type"], "mock")
        self.assertGreater(response.estimated_total, 0)
        self.assertTrue(response.limitations)

    def test_detailed_trip_planner_returns_controlled_result_for_destination_without_internal_data(self):
        response = TripPlannerService().plan_detailed(
            DetailedTripPlanRequest(
                destination="Portugal",
                days=5,
                budget=6500,
                travel_type="Lazer",
                company="Casal",
                interests=["cultura", "gastronomia"],
                comfort_level="Confortável",
                approximate_date="2026-09-15",
                observations=None,
            )
        )
        self.assertEqual(response.itinerary, [])
        self.assertEqual(response.estimated_total, 0)
        self.assertIn("não calculado", response.budget_status)
        self.assertTrue(any("não há atrações" in item.lower() for item in response.limitations))
        self.assertEqual(response.data_sources["reports_and_itinerary"], "unavailable")

    def test_chat_selects_budget_tool(self):
        response = ChatService().answer(ChatRequest(message="Qual o custo para 5 dias com R$ 4000?", destination="Florianópolis"))
        self.assertEqual([tool.name for tool in response.tools_used], ["calculate_trip_budget"])
        self.assertIn("classification", response.data["budget"])

    def test_report_improvement_preserves_content(self):
        response = ReportAIService().improve(
            TravelReportInput(destination="Salvador", title="Minha viagem", text="gostei muito da cultura e do transporte")
        )
        self.assertIn("transporte", response.data["improved_text"])

    def test_detailed_report_improvement_preserves_numbers_and_extracts_only_mentioned_places(self):
        response = ReportAIService().improve_detailed(
            ImproveReportRequest(
                destination="Bonito",
                original_text="visitei o Rio Sucuri e gostei muito. O passeio custou R$ 250 e o transporte foi demorado",
                trip_type="casal",
                expenses={"passeios": 250},
                rating=4.5,
            )
        )
        self.assertIn("250", response.improved_text)
        self.assertEqual(response.mentioned_places, ["Rio Sucuri"])
        self.assertNotIn("Gruta do Lago Azul", response.mentioned_places)
        self.assertNotIn("gastos detalhados", response.missing_information)
        self.assertNotIn("avaliação do usuário", response.missing_information)

    def test_report_and_destination_summaries_are_structured(self):
        reports = ReportAIService().summarize(ReportSummaryRequest(destination="Bonito"))
        destination = DestinationSummaryService().summarize(DestinationSummaryRequest(destination="Bonito"))
        self.assertIn("attention_points", reports.data)
        self.assertEqual(destination.data["report_count"], 3)

    def test_destination_report_statistics_are_calculated_in_code(self):
        response = DestinationReportsSummaryService().summarize(DestinationReportsSummaryRequest(destination="Bonito"))
        self.assertEqual(response.reports_analyzed, 3)
        self.assertEqual(response.calculated_statistics.average_expenses, 5823.33)
        self.assertEqual(response.calculated_statistics.most_mentioned_places[0].label, "Rio Sucuri")
        self.assertEqual(response.calculated_statistics.most_mentioned_places[0].count, 3)
        self.assertIn("pequena amostra", response.calculated_statistics.compatible_traveler_profile.lower())
        self.assertEqual(response.tools_used, ["search_destination_reports"])
        self.assertTrue(response.textual_synthesis.divergences)


if __name__ == "__main__":
    unittest.main()
