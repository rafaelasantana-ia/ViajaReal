"""Adaptadores de modelo selecionáveis, com contrato único para a aplicação."""

from dataclasses import dataclass
from typing import Any, Dict, List

from groq import APIConnectionError, APIStatusError, APITimeoutError, Groq
import httpx

from app.core.config import Settings


class ProviderError(RuntimeError):
    """Erro seguro e normalizado do provedor externo."""


class ProviderTimeoutError(ProviderError):
    """O provedor excedeu o timeout configurado."""


class InvalidProviderResponseError(ProviderError):
    """O provedor retornou uma resposta sem o contrato esperado."""


@dataclass
class ProviderResponse:
    content: str | None
    tool_calls: List[Dict[str, Any]]
    raw_message: Dict[str, Any]


class GroqChatCompletionProvider:
    def __init__(self, settings: Settings, client: Groq | None = None):
        if not settings.ai_api_key:
            raise ProviderError("GROQ_API_KEY não configurada para AI_MODE=real.")
        if not settings.ai_model:
            raise ProviderError("AI_MODEL deve ser configurado para AI_MODE=real.")
        self.settings = settings
        self.client = client or Groq(
            api_key=settings.ai_api_key,
            timeout=settings.ai_timeout_seconds,
            max_retries=1,
            default_headers={"User-Agent": "ViajaReal/1.0"},
        )

    def complete(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] | None = None) -> ProviderResponse:
        request: Dict[str, Any] = {
            "model": self.settings.ai_model,
            "messages": messages,
            "temperature": self.settings.ai_temperature,
            "top_p": self.settings.ai_top_p,
            "max_completion_tokens": self.settings.ai_max_tokens,
        }
        if tools:
            request.update({"tools": tools, "tool_choice": "auto", "parallel_tool_calls": True})
        else:
            request["response_format"] = {"type": "json_object"}

        try:
            completion = self.client.chat.completions.create(**request)
        except APITimeoutError as exc:
            raise ProviderTimeoutError("O provedor de IA excedeu o tempo limite.") from exc
        except APIConnectionError as exc:
            raise ProviderError("Não foi possível conectar ao provedor de IA.") from exc
        except APIStatusError as exc:
            raise ProviderError(f"O provedor de IA recusou a requisição (HTTP {exc.status_code}).") from exc
        except (TypeError, ValueError) as exc:
            raise ProviderError("A configuração enviada ao provedor de IA é inválida.") from exc

        try:
            message = completion.choices[0].message
            raw_message = message.model_dump(exclude_none=True)
            return ProviderResponse(
                content=message.content,
                tool_calls=raw_message.get("tool_calls") or [],
                raw_message=raw_message,
            )
        except (AttributeError, IndexError, TypeError) as exc:
            raise InvalidProviderResponseError("Resposta do provedor sem choices/message.") from exc


class OllamaChatCompletionProvider:
    """Provider local via API OpenAI-compatible do Ollama."""

    def __init__(self, settings: Settings, client: httpx.Client | None = None):
        if not settings.ai_model:
            raise ProviderError("AI_MODEL deve ser configurado para o Ollama.")
        self.settings = settings
        self.client = client
        self.endpoint = f"{settings.ollama_api_url}/chat/completions"

    def complete(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] | None = None) -> ProviderResponse:
        request: Dict[str, Any] = {
            "model": self.settings.ai_model,
            "messages": messages,
            "temperature": self.settings.ai_temperature,
            "top_p": self.settings.ai_top_p,
            "max_tokens": self.settings.ai_max_tokens,
            "stream": False,
        }
        if tools:
            request.update({"tools": tools, "tool_choice": "auto"})
        else:
            request["response_format"] = {"type": "json_object"}

        try:
            response = self._post(json=request)
        except httpx.TimeoutException as exc:
            raise ProviderTimeoutError("O modelo local excedeu o tempo limite.") from exc
        except httpx.ConnectError as exc:
            raise ProviderError("Não foi possível conectar ao Ollama local. Confirme se ele está em execução.") from exc
        except httpx.HTTPError as exc:
            raise ProviderError("Falha de comunicação com o Ollama local.") from exc
        if response.status_code >= 400:
            if response.status_code == 404:
                raise ProviderError(f"O modelo local '{self.settings.ai_model}' não está instalado no Ollama.")
            raise ProviderError(f"O Ollama recusou a requisição (HTTP {response.status_code}).")
        try:
            body = response.json()
            message = body["choices"][0]["message"]
            if not isinstance(message, dict):
                raise TypeError
            return ProviderResponse(
                content=message.get("content"),
                tool_calls=message.get("tool_calls") or [],
                raw_message={key: value for key, value in message.items() if value is not None},
            )
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise InvalidProviderResponseError("Resposta do Ollama sem choices/message válido.") from exc

    def _post(self, **kwargs) -> httpx.Response:
        if self.client is not None:
            return self.client.post(self.endpoint, **kwargs)
        with httpx.Client(timeout=self.settings.ai_timeout_seconds) as client:
            return client.post(self.endpoint, **kwargs)


def get_chat_completion_provider(settings: Settings):
    if settings.ai_provider == "ollama":
        return OllamaChatCompletionProvider(settings)
    return GroqChatCompletionProvider(settings)
