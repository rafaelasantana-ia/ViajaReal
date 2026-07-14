import unittest

from app.data.mock_destinations import MOCK_DESTINATIONS
from app.data.mock_reports import MOCK_REPORTS, REPORTS_BY_DESTINATION
from app.tools.travel_tools import (
    TOOL_REGISTRY,
    calculate_trip_budget,
    compare_destinations_data,
    generate_itinerary_base,
    get_destination_information,
    search_destination_reports,
)


class MockDataIntegrityTest(unittest.TestCase):
    def test_has_six_destinations_and_three_reports_each(self):
        self.assertGreaterEqual(len(MOCK_DESTINATIONS), 6)
        self.assertEqual(len(MOCK_REPORTS), len(MOCK_DESTINATIONS) * 3)
        for destination in MOCK_DESTINATIONS:
            self.assertEqual(len(REPORTS_BY_DESTINATION[destination["id"]]), 3)

    def test_report_totals_match_categories(self):
        for report in MOCK_REPORTS:
            expected = report["food"] + report["transport"] + report["lodging"] + report["activities"]
            self.assertEqual(report["total_spent"], expected)

    def test_destination_required_fields_are_present(self):
        required = {
            "id", "name", "city", "state", "description", "predominant_climate", "best_season", "cost_range",
            "average_daily_cost", "overall_rating", "safety_rating", "transport_rating", "attractions",
            "related_interests", "latitude", "longitude", "attention_points", "recommended_profile",
        }
        for destination in MOCK_DESTINATIONS:
            self.assertTrue(required.issubset(destination))


class SearchReportsToolTest(unittest.TestCase):
    def test_filters_reports_and_returns_summaries(self):
        result = search_destination_reports("Florianopolis", travel_type="casal", minimum_rating=4.5, limit=2)
        self.assertTrue(result["ok"])
        self.assertEqual(result["data"]["found_count"], 1)
        self.assertEqual(result["data"]["reports"][0]["travel_type"], "casal")

    def test_handles_unknown_destination(self):
        result = search_destination_reports("Destino inexistente")
        self.assertFalse(result["ok"])
        self.assertEqual(result["error"]["code"], "DESTINATION_NOT_FOUND")

    def test_validates_limit_and_rating(self):
        self.assertEqual(search_destination_reports("Salvador", limit=0)["error"]["code"], "INVALID_LIMIT")
        self.assertEqual(search_destination_reports("Salvador", minimum_rating=6)["error"]["code"], "INVALID_MINIMUM_RATING")


class DestinationInformationToolTest(unittest.TestCase):
    def test_returns_complete_destination(self):
        result = get_destination_information("foz do iguacu")
        self.assertTrue(result["ok"])
        self.assertEqual(result["data"]["destination"]["id"], "foz-do-iguacu-pr")

    def test_handles_unknown_destination(self):
        self.assertEqual(get_destination_information("Paris")["error"]["code"], "DESTINATION_NOT_FOUND")


class BudgetToolTest(unittest.TestCase):
    def _calculate(self, available, accommodation, food=100, transport=100, activities=100, other=50):
        return calculate_trip_budget(5, available, accommodation, food, transport, activities, other)

    def test_classifies_below_within_and_above_budget(self):
        self.assertEqual(self._calculate(1000, 400)["data"]["classification"], "abaixo do orçamento")
        self.assertEqual(self._calculate(1000, 550, other=100)["data"]["classification"], "dentro do orçamento")
        self.assertEqual(self._calculate(1000, 700, other=100)["data"]["classification"], "acima do orçamento")

    def test_calculates_total_daily_average_and_balance(self):
        result = calculate_trip_budget(4, 2000, 800, 400, 200, 300, 100)["data"]
        self.assertEqual(result["total"], 1800)
        self.assertEqual(result["daily_average"], 450)
        self.assertEqual(result["balance"], 200)

    def test_rejects_invalid_values(self):
        self.assertEqual(calculate_trip_budget(0, 1000, 1, 1, 1, 1, 1)["error"]["code"], "INVALID_DAYS")
        self.assertEqual(calculate_trip_budget(2, 1000, -1, 1, 1, 1, 1)["error"]["code"], "INVALID_BUDGET_VALUE")


class ItineraryToolTest(unittest.TestCase):
    def test_selects_compatible_attractions_without_repetition(self):
        result = generate_itinerary_base("Florianópolis", 3, ["praia", "natureza"], 500)["data"]
        ids = [attraction["id"] for day in result["itinerary"] for attraction in day["attractions"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertLessEqual(result["estimated_activities_cost"], 500)
        self.assertTrue(all(set(attraction["interests"]).intersection({"praia", "natureza"}) for day in result["itinerary"] for attraction in day["attractions"]))

    def test_reports_insufficient_data(self):
        result = generate_itinerary_base("Gramado", 4, ["mergulho"], 1000)["data"]
        self.assertTrue(result["insufficient_data"])
        self.assertEqual(result["selected_attractions"], 0)


class ComparisonToolTest(unittest.TestCase):
    def test_compares_and_recommends_from_structured_scores(self):
        result = compare_destinations_data("Bonito", "Gramado", "aventureiro", ["natureza", "aventura"], 650)
        self.assertTrue(result["ok"])
        self.assertIn(result["data"]["best_match"], {"bonito-ms", "gramado-rs", None})
        self.assertIn("compatibility_score", result["data"]["first_destination"])
        self.assertTrue(result["data"]["recommendation"])

    def test_handles_missing_destination(self):
        result = compare_destinations_data("Bonito", "Paris", "aventura", ["natureza"], 600)
        self.assertEqual(result["error"]["code"], "DESTINATION_NOT_FOUND")


class ToolSchemaTest(unittest.TestCase):
    def test_all_tools_have_descriptions_and_typed_parameters(self):
        self.assertEqual(len(TOOL_REGISTRY), 6)
        for tool in TOOL_REGISTRY.values():
            schema = tool.provider_schema()["function"]
            self.assertTrue(schema["description"])
            self.assertEqual(schema["parameters"]["type"], "object")
            self.assertFalse(schema["parameters"]["additionalProperties"])


if __name__ == "__main__":
    unittest.main()
