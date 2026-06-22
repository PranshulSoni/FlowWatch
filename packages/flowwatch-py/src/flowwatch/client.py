from typing import Any, Optional
import httpx


class FlowwatchClient:
    def __init__(self, base_url: str = "http://localhost:9400", token: Optional[str] = None):
        headers: dict[str, str] = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        self._http = httpx.Client(base_url=base_url, headers=headers, timeout=10.0)

    def flag(self, key: str, context: Optional[dict] = None) -> bool:
        r = self._http.post("/api/flag", json={"key": key, "context": context or {}})
        r.raise_for_status()
        return r.json()["enabled"]

    def trigger(self, name: str, input: Any = None) -> dict:
        r = self._http.post("/api/trigger", json={"name": name, "input": input})
        r.raise_for_status()
        return r.json()

    def trace_span(self, name: str, type: str, duration_ms: int,
                   metadata: Optional[dict] = None, status: str = "ok") -> None:
        r = self._http.post("/api/trace-span", json={
            "name": name,
            "type": type,
            "durationMs": duration_ms,
            "metadata": metadata or {},
            "status": status,
        })
        r.raise_for_status()

    def capture_error(self, message: str, source: str,
                      name: str = "Error", stack: Optional[str] = None, **options: Any) -> dict:
        r = self._http.post("/api/capture-error", json={
            "error": {"message": message, "name": name, "stack": stack},
            "options": {"source": source, **options},
        })
        r.raise_for_status()
        return r.json()

    def health(self) -> dict:
        r = self._http.get("/api/health")
        r.raise_for_status()
        return r.json()

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> "FlowwatchClient":
        return self

    def __exit__(self, *_: Any) -> None:
        self.close()
