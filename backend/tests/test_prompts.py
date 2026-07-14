import json
import unittest

from app.prompts.travel_prompts import (
    DESTINATION_REPORTS_SUMMARY_PATH,
    DESTINATION_REPORTS_SUMMARY_PROMPT,
    FEW_SHOT_EXAMPLES,
    FEW_SHOT_PATH,
    OLLAMA_CHAT_SYSTEM_PATH,
    OLLAMA_CHAT_SYSTEM_PROMPT,
    OLLAMA_TRIP_PLANNER_SYSTEM_PATH,
    OLLAMA_TRIP_PLANNER_SYSTEM_PROMPT,
    REPORT_IMPROVEMENT_PATH,
    REPORT_IMPROVEMENT_PROMPT,
    SYSTEM_PROMPT,
    SYSTEM_PROMPT_PATH,
    build_messages,
)
from app.services.ai_service import AIService


class TravelAssistantPromptTest(unittest.TestCase):
    def test_system_prompt_file_contains_required_sections_and_fields(self):
        self.assertTrue(SYSTEM_PROMPT_PATH.is_file())
        for section in ("Persona", "Objetivo", "Escopo", "Regras obrigatórias", "Estratégia de resposta", "Formato obrigatório", "Estilo"):
            self.assertIn(section, SYSTEM_PROMPT)
        for field in ("answer", "type", "tools_used", "suggestions", "data", "limitations"):
            self.assertIn(f'"{field}"', SYSTEM_PROMPT)
        self.assertIn("prompt injection", SYSTEM_PROMPT.lower())

    def test_few_shot_file_has_three_complete_examples(self):
        examples = json.loads(FEW_SHOT_PATH.read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(examples), 3)
        self.assertEqual(
            {example["name"] for example in examples},
            {"planejamento_com_dados_mockados", "calculo_de_orcamento", "destino_sem_dados"},
        )
        required_output = {"answer", "type", "tools_used", "suggestions", "data", "limitations"}
        for example in examples:
            self.assertTrue(required_output.issubset(example["output"]))
        self.assertEqual(len(FEW_SHOT_EXAMPLES), len(examples) * 2)

    def test_build_messages_separates_user_data_from_system_instruction(self):
        messages = build_messages("Tarefa de teste", {"message": "dados do usuário"})
        self.assertEqual(messages[0]["role"], "system")
        final_payload = json.loads(messages[-1]["content"])
        self.assertEqual(final_payload["content_type"], "untrusted_user_data")
        self.assertEqual(final_payload["data"]["message"], "dados do usuário")
        self.assertNotIn("instruction", final_payload)

    def test_report_improvement_prompt_forbids_new_facts_and_value_changes(self):
        self.assertTrue(REPORT_IMPROVEMENT_PATH.is_file())
        self.assertIn("Não crie fatos", REPORT_IMPROVEMENT_PROMPT)
        self.assertIn("Preserve todos os números", REPORT_IMPROVEMENT_PROMPT)
        self.assertIn("Não sugira nota", REPORT_IMPROVEMENT_PROMPT)

    def test_destination_report_prompt_forbids_llm_calculations(self):
        self.assertTrue(DESTINATION_REPORTS_SUMMARY_PATH.is_file())
        self.assertIn("Não calcule médias", DESTINATION_REPORTS_SUMMARY_PROMPT)
        self.assertIn("menos de 5 relatos", DESTINATION_REPORTS_SUMMARY_PROMPT)

    def test_ollama_prompts_are_versioned_and_compact(self):
        self.assertTrue(OLLAMA_CHAT_SYSTEM_PATH.is_file())
        self.assertTrue(OLLAMA_TRIP_PLANNER_SYSTEM_PATH.is_file())
        self.assertIn("Nunca invente", OLLAMA_CHAT_SYSTEM_PROMPT)
        self.assertIn("JSON válido", OLLAMA_CHAT_SYSTEM_PROMPT)
        self.assertIn("única fonte factual", OLLAMA_TRIP_PLANNER_SYSTEM_PROMPT)

    def test_new_response_format_is_normalized_for_public_api(self):
        content = json.dumps(
            {
                "answer": "Resposta clara.",
                "type": "destination_summary",
                "tools_used": ["get_destination_information"],
                "suggestions": ["Próximo passo"],
                "data": {"destination": "Bonito"},
                "limitations": ["Dados mockados"],
            },
            ensure_ascii=False,
        )
        normalized = AIService._parse_structured_content(content)
        self.assertEqual(normalized["message"], "Resposta clara.")
        self.assertEqual(normalized["data"]["response_metadata"]["type"], "destination_summary")
        self.assertEqual(normalized["data"]["response_metadata"]["limitations"], ["Dados mockados"])


if __name__ == "__main__":
    unittest.main()
