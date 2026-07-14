import unittest
import httpx
from types import SimpleNamespace
from unittest.mock import Mock

from app.core.config import Settings
from app.services.llm_provider import GroqChatCompletionProvider, OllamaChatCompletionProvider, get_chat_completion_provider


def _fake_client(content='{"answer":"ok","type":"general","tools_used":[],"suggestions":[],"data":{},"limitations":[]}'):
    message = SimpleNamespace(content=content, model_dump=lambda exclude_none=True: {"role": "assistant", "content": content})
    create = Mock(return_value=SimpleNamespace(choices=[SimpleNamespace(message=message)]))
    return SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))


class GroqChatCompletionProviderTest(unittest.TestCase):
    def setUp(self):
        self.settings = Settings(
            ai_mode="real",
            ai_api_key="test-key",
            ai_api_url="https://api.groq.com/openai/v1/chat/completions",
            ai_model="test-model",
            ai_timeout_seconds=10,
            frontend_origins=("http://localhost:5173",),
            ai_temperature=0.3,
            ai_top_p=0.9,
            ai_max_tokens=900,
            ai_max_tool_cycles=2,
        )

    def test_tool_call_uses_sdk_settings_without_json_mode(self):
        client = _fake_client()
        provider = GroqChatCompletionProvider(self.settings, client=client)
        tools = [{"type": "function", "function": {"name": "test_tool", "parameters": {"type": "object"}}}]
        provider.complete([{"role": "user", "content": "teste"}], tools)
        request = client.chat.completions.create.call_args.kwargs
        self.assertEqual(request["temperature"], 0.3)
        self.assertEqual(request["top_p"], 0.9)
        self.assertEqual(request["max_completion_tokens"], 900)
        self.assertEqual(request["tools"], tools)
        self.assertNotIn("response_format", request)

    def test_final_response_uses_json_mode_without_tools(self):
        client = _fake_client()
        provider = GroqChatCompletionProvider(self.settings, client=client)
        provider.complete([{"role": "user", "content": "teste"}], None)
        request = client.chat.completions.create.call_args.kwargs
        self.assertEqual(request["response_format"], {"type": "json_object"})
        self.assertNotIn("tools", request)


class OllamaChatCompletionProviderTest(unittest.TestCase):
    def setUp(self):
        self.settings = Settings(
            ai_mode="real", ai_api_key=None, ai_api_url="", ai_model="llama3.2",
            ai_timeout_seconds=10, frontend_origins=("http://localhost:5173",),
            ai_provider="ollama", ollama_api_url="http://127.0.0.1:11434/v1",
            ai_max_tokens=900,
        )

    def test_uses_openai_compatible_tool_contract(self):
        requests = []

        def handler(request):
            requests.append(request)
            return httpx.Response(200, json={"choices": [{"message": {"role": "assistant", "content": None, "tool_calls": [{"id": "call-1", "type": "function", "function": {"name": "test_tool", "arguments": "{}"}}]}}]})

        with httpx.Client(transport=httpx.MockTransport(handler)) as client:
            provider = OllamaChatCompletionProvider(self.settings, client)
            result = provider.complete([{"role": "user", "content": "teste"}], [{"type": "function", "function": {"name": "test_tool", "parameters": {"type": "object"}}}])
        payload = __import__("json").loads(requests[0].content)
        self.assertEqual(payload["model"], "llama3.2")
        self.assertEqual(payload["tool_choice"], "auto")
        self.assertNotIn("response_format", payload)
        self.assertEqual(result.tool_calls[0]["function"]["name"], "test_tool")

    def test_factory_selects_ollama(self):
        self.assertIsInstance(get_chat_completion_provider(self.settings), OllamaChatCompletionProvider)


if __name__ == "__main__":
    unittest.main()
