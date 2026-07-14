"""Configurações da aplicação lidas exclusivamente do ambiente."""

from dataclasses import dataclass
import os
from pathlib import Path


def _load_local_env() -> None:
    """Carrega o .env da raiz sem sobrescrever variáveis do processo."""
    env_path = Path(__file__).resolve().parents[3] / ".env"
    if not env_path.is_file():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        if name and name.replace("_", "").isalnum():
            os.environ.setdefault(name, value.strip().strip('"').strip("'"))


def _positive_float(name: str, default: float) -> float:
    try:
        value = float(os.getenv(name, str(default)))
        return value if value > 0 else default
    except ValueError:
        return default


def _bounded_int(name: str, default: int, minimum: int, maximum: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
        return min(max(value, minimum), maximum)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    ai_mode: str
    ai_api_key: str | None
    ai_api_url: str
    ai_model: str
    ai_timeout_seconds: float
    frontend_origins: tuple[str, ...]
    ai_provider: str = "groq"
    ollama_api_url: str = "http://127.0.0.1:11434/v1"
    pexels_api_key: str | None = None
    external_api_timeout: float = 8.0
    cache_ttl: int = 3600
    nominatim_user_agent: str = "ViajaReal/1.0 (+https://github.com/rafaelasantana-ia/ViajaReal)"
    ai_temperature: float = 0.3
    ai_top_p: float = 0.9
    ai_max_tokens: int = 1200
    ai_max_tool_cycles: int = 2


def get_settings() -> Settings:
    _load_local_env()
    mode = os.getenv("AI_MODE", "mock").strip().lower()
    if mode not in {"mock", "real"}:
        raise ValueError("AI_MODE deve ser 'mock' ou 'real'.")
    provider = os.getenv("AI_PROVIDER", "groq").strip().lower()
    if provider not in {"groq", "ollama"}:
        raise ValueError("AI_PROVIDER deve ser 'groq' ou 'ollama'.")

    origins = tuple(
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    )
    return Settings(
        ai_mode=mode,
        ai_api_key=os.getenv("AI_API_KEY") or os.getenv("GROQ_API_KEY") or None,
        ai_api_url=os.getenv("AI_API_URL", "https://api.groq.com/openai/v1/chat/completions").strip(),
        ai_model=os.getenv("AI_MODEL", "llama-3.3-70b-versatile").strip(),
        ai_timeout_seconds=_positive_float("AI_TIMEOUT_SECONDS", 30.0),
        frontend_origins=origins,
        ai_provider=provider,
        ollama_api_url=os.getenv("OLLAMA_API_URL", "http://127.0.0.1:11434/v1").strip().rstrip("/"),
        pexels_api_key=os.getenv("PEXELS_API_KEY") or None,
        external_api_timeout=_positive_float("EXTERNAL_API_TIMEOUT", 8.0),
        cache_ttl=_bounded_int("CACHE_TTL", 3600, 60, 86400),
        nominatim_user_agent=os.getenv(
            "NOMINATIM_USER_AGENT",
            "ViajaReal/1.0 (+https://github.com/rafaelasantana-ia/ViajaReal)",
        ).strip(),
        ai_temperature=0.3,
        ai_top_p=0.9,
        ai_max_tokens=_bounded_int("AI_MAX_TOKENS", 1200, 256, 4096),
        ai_max_tool_cycles=_bounded_int("AI_MAX_TOOL_CYCLES", 2, 1, 4),
    )
