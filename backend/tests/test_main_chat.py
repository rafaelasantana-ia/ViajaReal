import os
import unittest
from unittest.mock import patch

os.environ["AI_MODE"] = "mock"

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.ai import MainChatRequest
from app.services.main_chat_service import MainChatService
from app.services.ai_service import AIService
from app.services.llm_provider import ProviderTimeoutError


class MainChatSchemaTest(unittest.TestCase):
    def test_sanitizes_and_keeps_only_last_ten_history_messages(self):
        history = [{"role": "user", "content": f" mensagem {index} \x00 "} for index in range(12)]
        history.insert(0, {"role": "system", "content": "não permitido"})
        request = MainChatRequest(message=" Olá \x00 ", session_id="session-1", conversation_history=history, context={})
        self.assertEqual(request.message, "Olá")
        self.assertEqual(len(request.conversation_history), 10)
        self.assertEqual(request.conversation_history[0].content, "mensagem 2")

    def test_rejects_invalid_session_and_oversized_message(self):
        with self.assertRaises(ValidationError):
            MainChatRequest(message="ok", session_id="sessão com espaço", conversation_history=[], context={})
        with self.assertRaises(ValidationError):
            MainChatRequest(message="x" * 3001, session_id="session-1", conversation_history=[], context={})


class MainChatServiceTest(unittest.TestCase):
    def test_local_chat_prompt_is_compact_and_preserves_security_rules(self):
        messages = AIService._ollama_chat_messages({"message": "Olá", "intent": "general"})
        self.assertEqual(len(messages), 2)
        self.assertIn("Nunca invente", messages[0]["content"])
        self.assertIn("JSON válido", messages[0]["content"])
        self.assertIn('"message": "Olá"', messages[1]["content"])

    def test_mock_budget_uses_same_tool_and_public_contract(self):
        request = MainChatRequest(
            message="Calcule meu orçamento",
            session_id="session-budget",
            conversation_history=[],
            context={
                "current_page": "/costs",
                "selected_destination": "Bonito",
                "form_data": {"days": 5, "available_budget": 4000, "accommodation": 1500, "food": 700, "transport": 400, "activities": 900, "other": 200},
            },
        )
        response = MainChatService().answer(request)
        self.assertEqual(response.type, "budget")
        self.assertEqual(response.tools_used, ["calculate_trip_budget"])
        self.assertIn("classification", response.data["budget"])

    def test_missing_information_asks_only_one_question_without_tool(self):
        request = MainChatRequest(
            message="Planeje minha viagem",
            session_id="session-plan",
            conversation_history=[],
            context={"current_page": "/planner", "form_data": {}},
        )
        response = MainChatService().answer(request)
        self.assertEqual(response.type, "trip_plan")
        self.assertEqual(response.tools_used, [])
        self.assertEqual(response.answer.count("?"), 1)
        self.assertEqual(response.data["missing_information"], "destination")

    def test_pending_intent_and_form_data_continue_the_same_flow(self):
        request = MainChatRequest(
            message="5 dias",
            session_id="session-plan-continuation",
            conversation_history=[
                {"role": "user", "content": "Planejar uma viagem"},
                {"role": "assistant", "content": "Qual destino você quer consultar?"},
            ],
            context={
                "current_page": "/",
                "selected_destination": "Bonito",
                "form_data": {"intent": "trip_plan", "destination": "Bonito", "days": 5},
            },
        )
        response = MainChatService().answer(request)
        self.assertEqual(response.type, "trip_plan")
        self.assertEqual(response.data["missing_information"], "available_budget")
        self.assertEqual(response.answer.count("?"), 1)

    def test_trip_plan_collects_interests_then_generates_itinerary(self):
        missing_interests = MainChatService().answer(MainChatRequest(
            message="R$ 5.000",
            session_id="session-plan-interests",
            conversation_history=[],
            context={
                "current_page": "/",
                "selected_destination": "Bonito",
                "form_data": {
                    "intent": "trip_plan",
                    "destination": "Bonito",
                    "days": 5,
                    "available_budget": 5000,
                },
            },
        ))
        self.assertEqual(missing_interests.data["missing_information"], "interests")
        self.assertIn("interesses", missing_interests.answer.lower())

        response = MainChatService().answer(MainChatRequest(
            message="natureza e aventura",
            session_id="session-plan-generate",
            conversation_history=[],
            context={
                "current_page": "/",
                "selected_destination": "Bonito",
                "form_data": {
                    "intent": "trip_plan",
                    "destination": "Bonito",
                    "days": 5,
                    "available_budget": 5000,
                    "interests": ["natureza", "aventura"],
                },
            },
        ))
        self.assertEqual(response.type, "trip_plan")
        self.assertEqual(response.tools_used, ["get_live_destination_context", "get_destination_information", "generate_itinerary_base"])
        self.assertEqual(response.data["itinerary_base"]["destination"]["name"], "Bonito")

    def test_quick_report_suggestion_selects_report_tool(self):
        request = MainChatRequest(
            message="Buscar relatos",
            session_id="session-reports-suggestion",
            conversation_history=[],
            context={"current_page": "/", "selected_destination": "Bonito", "form_data": {"report_focus": "custos e segurança"}},
        )
        response = MainChatService().answer(request)
        self.assertEqual(response.type, "reports")
        self.assertEqual(response.tools_used, ["search_destination_reports"])

    def test_report_search_continues_by_asking_destination_then_focus(self):
        first = MainChatService().answer(MainChatRequest(
            message="Buscar relatos",
            session_id="session-report-follow-up-1",
            conversation_history=[],
            context={"current_page": "/", "form_data": {}},
        ))
        self.assertEqual(first.data["missing_information"], "destination")
        self.assertIn("destino", first.answer.lower())

        second = MainChatService().answer(MainChatRequest(
            message="Bonito",
            session_id="session-report-follow-up-2",
            conversation_history=[],
            context={"current_page": "/", "selected_destination": "Bonito", "form_data": {"intent": "reports", "destination": "Bonito"}},
        ))
        self.assertEqual(second.data["missing_information"], "report_focus")
        self.assertIn("custos", second.answer.lower())
        self.assertIn("segurança", second.answer.lower())

        third = MainChatService().answer(MainChatRequest(
            message="Quero saber sobre segurança e passeios",
            session_id="session-report-follow-up-3",
            conversation_history=[],
            context={"current_page": "/", "selected_destination": "Bonito", "form_data": {"intent": "reports", "destination": "Bonito", "report_focus": "segurança e passeios"}},
        ))
        self.assertEqual(third.type, "reports")
        self.assertEqual(third.tools_used, ["search_destination_reports"])

    def test_general_message_does_not_expose_unrelated_tools_to_model(self):
        request = MainChatRequest(
            message="Olá, o que você pode fazer?",
            session_id="session-general",
            conversation_history=[],
            context={"current_page": "/", "form_data": {}},
        )
        captured = {}

        class CapturingAIService:
            def generate(self, **kwargs):
                captured.update(kwargs)
                return AIService().generate(**kwargs)

        response = MainChatService(ai_service=CapturingAIService()).answer(request)
        self.assertEqual(captured["allowed_tools"], [])
        self.assertEqual(response.tools_used, [])

    def test_ollama_failure_uses_safe_backend_fallback(self):
        settings = MainChatService().ai_service.settings
        ollama_settings = type(settings)(**{
            **settings.__dict__,
            "ai_mode": "real",
            "ai_provider": "ollama",
        })
        service = MainChatService(ai_service=AIService(ollama_settings))
        request = MainChatRequest(
            message="Buscar relatos",
            session_id="session-ollama-fallback",
            conversation_history=[],
            context={"current_page": "/", "selected_destination": "Bonito", "form_data": {"report_focus": "visão geral"}},
        )
        with patch("app.services.ai_service.AIService._run_real", side_effect=ProviderTimeoutError("tempo limite")):
            response = service.answer(request)

        self.assertEqual(response.tools_used, ["search_destination_reports"])
        self.assertEqual(response.data["provider_fallback"], True)
        self.assertTrue(any("contingência" in item for item in response.limitations))


class MainChatEndpointTest(unittest.TestCase):
    def test_post_api_ai_chat_returns_exact_public_shape(self):
        client = TestClient(app)
        response = client.post(
            "/api/ai/chat",
            json={
                "message": "Resuma os relatos",
                "session_id": "web-test-1",
                "conversation_history": [],
                "context": {"current_page": "/community", "selected_destination": "Salvador", "form_data": {"report_focus": "visão geral"}},
            },
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(set(body), {"answer", "type", "tools_used", "suggestions", "data", "limitations"})
        self.assertEqual(body["type"], "reports")
        self.assertEqual(body["tools_used"], ["search_destination_reports"])

    def test_unexpected_failure_returns_friendly_response_without_stack_trace(self):
        client = TestClient(app, raise_server_exceptions=False)
        with patch("app.api.routes.main_chat.MainChatService.answer", side_effect=RuntimeError("segredo-interno")):
            response = client.post(
                "/api/ai/chat",
                json={
                    "message": "Ajude com minha viagem",
                    "session_id": "web-test-error",
                    "conversation_history": [],
                    "context": {},
                },
            )
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("segredo-interno", response.text)
        self.assertNotIn("traceback", response.text.lower())
        self.assertEqual(response.json()["tools_used"], [])

    def test_post_plan_trip_returns_detailed_contract(self):
        client = TestClient(app)
        response = client.post(
            "/api/ai/plan-trip",
            json={
                "destination": "Bonito",
                "days": 5,
                "budget": 6500,
                "travel_type": "Ecoturismo",
                "company": "Casal",
                "interests": ["natureza", "aventura"],
                "comfort_level": "Confortável",
                "approximate_date": "2026-09-15",
                "observations": "Preferimos atividades ao ar livre.",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.json()),
            {"summary", "profile_fit", "estimated_total", "budget_status", "positive_points", "attention_points", "itinerary", "limitations", "tools_used", "mock_data", "live_context", "data_sources"},
        )

    def test_post_improve_report_returns_exact_contract(self):
        client = TestClient(app)
        response = client.post(
            "/api/ai/improve-report",
            json={
                "destination": "Bonito",
                "original_text": "visitei o Rio Sucuri e gostei muito. O passeio custou R$ 250 e o transporte foi demorado",
                "trip_type": "casal",
                "expenses": {"passeios": 250},
                "rating": 4.5,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.json()),
            {"improved_text", "summary", "positive_points", "negative_points", "mentioned_places", "suggested_tags", "missing_information", "limitations"},
        )
        self.assertIn("250", response.json()["improved_text"])

    def test_post_summarize_destination_reports_separates_statistics_and_synthesis(self):
        client = TestClient(app)
        response = client.post("/api/ai/summarize-destination-reports", json={"destination": "Bonito"})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["reports_analyzed"], 3)
        self.assertIn("calculated_statistics", body)
        self.assertIn("textual_synthesis", body)
        self.assertEqual(body["tools_used"], ["search_destination_reports"])
        self.assertTrue(any("conclusões fortes" in limitation for limitation in body["limitations"]))


if __name__ == "__main__":
    unittest.main()
