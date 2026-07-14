"""Cache TTL simples, local ao processo e seguro entre threads."""

from copy import deepcopy
from threading import RLock
from time import monotonic
from typing import Any


class TTLCache:
    def __init__(self, ttl_seconds: int):
        self.ttl_seconds = ttl_seconds
        self._items: dict[str, tuple[float, Any]] = {}
        self._lock = RLock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            item = self._items.get(key)
            if item is None:
                return None
            expires_at, value = item
            if expires_at <= monotonic():
                self._items.pop(key, None)
                return None
            return deepcopy(value)

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._items[key] = (monotonic() + self.ttl_seconds, deepcopy(value))

    def clear(self) -> None:
        with self._lock:
            self._items.clear()
