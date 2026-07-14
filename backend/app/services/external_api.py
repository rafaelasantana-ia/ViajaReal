"""Erros e utilitários compartilhados pelas integrações externas."""

from datetime import datetime, timezone


class ExternalAPIError(RuntimeError):
    def __init__(self, code: str, message: str, status_code: int = 503):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")
