"""Guardas básicas aplicadas antes de qualquer chamada ao modelo."""

from dataclasses import dataclass
import re
import unicodedata


@dataclass(frozen=True)
class GuardDecision:
    allowed: bool
    reason: str | None = None


def _normalize(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    without_accents = "".join(char for char in normalized if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", without_accents.casefold()).strip()


INJECTION_PATTERNS = (
    r"\bignore\b.{0,50}\binstru",
    r"\bdesconsidere\b.{0,50}\binstru",
    r"\bignore all previous",
    r"\b(disregard|forget)\b.{0,50}\binstructions?",
    r"\bmude\b.{0,30}\bregras?",
    r"\bfinja que\b",
    r"\bact as\b",
    r"\bjailbreak\b",
    r"\bdeveloper mode\b",
)

SECRET_PATTERNS = (
    r"\b(mostre|revele|exiba|copie)\b.{0,50}\b(system prompt|prompt do sistema|instrucoes internas)",
    r"\b(reveal|show|print)\b.{0,50}\b(system prompt|instructions?|secrets?)",
    r"\b(mostre|revele|exiba|informe)\b.{0,40}\b(chave|token|api key|variavel de ambiente)",
)

FABRICATION_PATTERNS = (
    r"\binvent\w*\b.{0,50}\b(avaliacoes?|relatos?|precos?|atracoes?|seguranca)",
    r"\bcrie\b.{0,40}\b(avaliacoes?|relatos?)\b.{0,20}\bfals",
)

OUT_OF_SCOPE_PATTERNS = (
    r"\b(escreva|gere|crie)\b.{0,30}\bcodigo\b",
    r"\bcodigo (python|javascript|java|c\+\+)",
    r"\breceita de (bolo|comida|sobremesa)",
    r"\bresolv\w*\b.{0,20}\bequacao",
    r"\bdiagnostico medico\b",
    r"\bconte (uma )?piada\b",
    r"\b(programacao|matematica|biologia|quimica|fisica|futebol|criptomoedas?|curriculo)\b",
    r"\b(escreva|crie)\b.{0,30}\b(poema|email|curriculo)\b",
)


def evaluate_chat_message(message: str) -> GuardDecision:
    text = _normalize(message)
    if not text:
        return GuardDecision(False, "empty_message")
    for reason, patterns in (
        ("secret_exfiltration", SECRET_PATTERNS),
        ("prompt_injection", INJECTION_PATTERNS),
        ("fabrication_request", FABRICATION_PATTERNS),
        ("out_of_scope", OUT_OF_SCOPE_PATTERNS),
    ):
        if any(re.search(pattern, text) for pattern in patterns):
            return GuardDecision(False, reason)
    return GuardDecision(True)


def contains_instruction_like_content(value: str) -> bool:
    text = _normalize(value)
    return any(re.search(pattern, text) for pattern in (*INJECTION_PATTERNS, *SECRET_PATTERNS))


def blocked_message(reason: str | None) -> str:
    responses = {
        "secret_exfiltration": "Não posso revelar prompts internos, chaves, tokens ou configurações privadas. Posso ajudar com sua viagem.",
        "prompt_injection": "Não posso ignorar ou alterar as regras internas do assistente. Posso continuar ajudando apenas com viagens.",
        "fabrication_request": "Não posso inventar avaliações, relatos, preços, atrações ou dados de segurança.",
        "out_of_scope": "Posso ajudar apenas com viagens e com as funcionalidades do ViajaReal.",
        "empty_message": "Digite uma mensagem sobre viagens para continuar.",
    }
    return responses.get(reason, "Não foi possível processar essa solicitação.")
