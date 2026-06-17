from __future__ import annotations

import time
from contextlib import contextmanager
from typing import Any, Generator

import httpx


class FlowwatchClient:
    """Synchronous FlowWatch sidecar client. Use as a context manager for connection cleanup."""

    def __init__(self, base_url: str = "http://localhost:9400", token: str | None = None) -> None:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        self._http = httpx.Client(base_url=base_url, headers=headers)

    def evaluate_flag(self, key: str, context: dict[str, Any] | None = None) -> bool:
        r = self._http.post("/api/flag", json={"key": key, "context": context or {}})
        r.raise_for_status()
        return bool(r.json().get("enabled", False))

    def trigger_workflow(self, name: str, input: Any = None) -> dict[str, Any]:
        r = self._http.post("/api/trigger", json={"name": name, "input": input})
        r.raise_for_status()
        return r.json()

    def log_trace_span(
        self,
        name: str,
        type: str,
        duration_ms: float,
        status: str = "ok",
        metadata: dict[str, Any] | None = None,
    ) -> None:
        r = self._http.post(
            "/api/trace-span",
            json={"name": name, "type": type, "durationMs": duration_ms, "status": status, "metadata": metadata},
        )
        r.raise_for_status()

    def capture_error(
        self,
        message: str,
        name: str = "Error",
        stack: str | None = None,
        source: str | None = None,
        **options: Any,
    ) -> None:
        r = self._http.post(
            "/api/capture-error",
            json={
                "error": {"message": message, "name": name, "stack": stack},
                "options": {"source": source, **options},
            },
        )
        r.raise_for_status()

    def health(self) -> dict[str, Any]:
        r = self._http.get("/api/health")
        r.raise_for_status()
        return r.json()

    @contextmanager
    def trace_span(
        self, name: str, type: str, metadata: dict[str, Any] | None = None
    ) -> Generator[None, None, None]:
        """Auto-times the wrapped block and submits a trace span on exit."""
        start = time.monotonic()
        status = "ok"
        try:
            yield
        except Exception:
            status = "error"
            raise
        finally:
            self.log_trace_span(name, type, (time.monotonic() - start) * 1000, status, metadata)

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> FlowwatchClient:
        return self

    def __exit__(self, *_: Any) -> None:
        self.close()


class AsyncFlowwatchClient:
    """Async FlowWatch sidecar client. Use as an async context manager for connection cleanup."""

    def __init__(self, base_url: str = "http://localhost:9400", token: str | None = None) -> None:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        self._http = httpx.AsyncClient(base_url=base_url, headers=headers)

    async def evaluate_flag(self, key: str, context: dict[str, Any] | None = None) -> bool:
        r = await self._http.post("/api/flag", json={"key": key, "context": context or {}})
        r.raise_for_status()
        return bool(r.json().get("enabled", False))

    async def trigger_workflow(self, name: str, input: Any = None) -> dict[str, Any]:
        r = await self._http.post("/api/trigger", json={"name": name, "input": input})
        r.raise_for_status()
        return r.json()

    async def log_trace_span(
        self,
        name: str,
        type: str,
        duration_ms: float,
        status: str = "ok",
        metadata: dict[str, Any] | None = None,
    ) -> None:
        r = await self._http.post(
            "/api/trace-span",
            json={"name": name, "type": type, "durationMs": duration_ms, "status": status, "metadata": metadata},
        )
        r.raise_for_status()

    async def capture_error(
        self,
        message: str,
        name: str = "Error",
        stack: str | None = None,
        source: str | None = None,
        **options: Any,
    ) -> None:
        r = await self._http.post(
            "/api/capture-error",
            json={
                "error": {"message": message, "name": name, "stack": stack},
                "options": {"source": source, **options},
            },
        )
        r.raise_for_status()

    async def health(self) -> dict[str, Any]:
        r = await self._http.get("/api/health")
        r.raise_for_status()
        return r.json()

    async def aclose(self) -> None:
        await self._http.aclose()

    async def __aenter__(self) -> AsyncFlowwatchClient:
        return self

    async def __aexit__(self, *_: Any) -> None:
        await self.aclose()
