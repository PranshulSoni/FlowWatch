# flowwatch-client (Python)

Python client SDK for [FlowWatch](https://github.com/PranshulSoni/flowwatch) — feature flags, durable workflows, request tracing, and error capture.

---

## Before you start: the sidecar is required

This package is a **thin HTTP client**. It does not connect to any database and does not run any background processes. All the actual logic lives in the **FlowWatch Node.js sidecar**, which must be running and reachable before any method in this SDK will work.

**What this package does:**
- Wraps the five sidecar REST endpoints in a clean Python API
- Handles auth headers, JSON serialization, and HTTP errors for you
- Provides both sync (`FlowwatchClient`) and async (`AsyncFlowwatchClient`) variants

**What this package does NOT do:**
- Does not connect to Postgres or Redis
- Does not run workflows, evaluate flags, or store traces by itself
- Does not start the sidecar — you must start it separately

---

## Step 1 — Start the FlowWatch sidecar

The sidecar is a Node.js process. In your infrastructure (Docker container, separate server, or just another terminal):

```ts
// sidecar.ts  — requires Node.js and @pranshulsoni/flowwatch installed
import { createFlowwatch, startSidecar } from "@pranshulsoni/flowwatch";

const fw = await createFlowwatch({
  db: { connectionString: process.env.DATABASE_URL },
  redis: { url: process.env.REDIS_URL },
  migrations: { autoRun: true },
});

startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN });
// API available at http://localhost:9400/api/*
```

The sidecar handles Postgres, Redis, the workflow queue, and the dashboard. Your Python app talks to it over HTTP.

---

## Step 2 — Install the Python SDK

```bash
pip install flowwatch-client
```

Requires Python 3.8+. The only dependency is `httpx`.

---

## Step 3 — Use it

```python
from flowwatch import FlowwatchClient

client = FlowwatchClient(
    base_url="http://localhost:9400",
    token="your-sidecar-token",   # must match the token set in startSidecar
)
```

---

## Authentication

If your sidecar was started with a `token`, every request must include it. Pass it to the client constructor:

```python
client = FlowwatchClient("http://localhost:9400", token="my-secret-token")
```

The SDK sends it automatically as `Authorization: Bearer <token>` on every request. If your sidecar has no token (dev only), omit the `token` argument.

---

## API Reference

### `evaluate_flag(key, context=None) → bool`

Returns `True` if the feature flag is enabled for the given user context. The flag rules and percentage rollout are evaluated by the sidecar, not this SDK.

```python
enabled = client.evaluate_flag("new-checkout-flow", {
    "userId": "user_123",
    "plan": "pro",
    "email": "user@example.com",
})
if enabled:
    use_new_checkout()
```

`context` is optional. Omit it for flags with no targeting rules.

---

### `trigger_workflow(name, input=None) → dict`

Starts a durable workflow execution. The workflow steps run in the Node.js process — this call just enqueues the job and returns immediately.

```python
result = client.trigger_workflow("order-fulfillment", {
    "orderId": "order_456",
    "userId": "user_123",
})
print(result["executionId"])   # track progress in the dashboard
```

The workflow must be registered in the Node.js sidecar with `fw.workflow(name, steps)`.

---

### `log_trace_span(name, type, duration_ms, status="ok", metadata=None)`

Submits a pre-timed performance span. You are responsible for measuring the duration.

```python
import time

start = time.monotonic()
rows = db.execute("SELECT * FROM products")
duration_ms = (time.monotonic() - start) * 1000

client.log_trace_span(
    name="fetch-products",
    type="database",
    duration_ms=duration_ms,
    metadata={"rowCount": len(rows)},
)
```

`type` can be any string: `"database"`, `"http"`, `"function"`, `"cache"`, etc. It's used for grouping in the dashboard.

---

### `trace_span(name, type, metadata=None)` — context manager

Auto-times the wrapped block and calls `log_trace_span` on exit. Sets `status="error"` automatically if an exception is raised.

```python
with client.trace_span("send-email", "http", metadata={"to": "user@example.com"}):
    send_email(to="user@example.com", subject="Your order shipped")
```

---

### `capture_error(message, name="Error", stack=None, source=None, **options)`

Reports an error to FlowWatch. Use in `except` blocks to get stack traces and context visible in the dashboard.

```python
import traceback

try:
    process_payment(order)
except Exception as e:
    client.capture_error(
        message=str(e),
        name=type(e).__name__,
        stack=traceback.format_exc(),
        source="python-payment-service",
        category="payment",
        level="error",
    )
    raise
```

Do not swallow the exception unless you intend to — `capture_error` just records it, it does not re-raise.

---

### `health() → dict`

Checks whether the sidecar is reachable and healthy. Returns the sidecar's status object.

```python
status = client.health()
print(status)
# {"status": "ok", "postgres": "connected", "redis": "connected", ...}
```

Use this for readiness checks or startup validation.

---

## Async variant

All methods above are available on `AsyncFlowwatchClient` with `await`:

```python
import asyncio
from flowwatch import AsyncFlowwatchClient

async def main():
    async with AsyncFlowwatchClient("http://localhost:9400", token="secret") as client:
        enabled = await client.evaluate_flag("dark-mode", {"userId": "u1"})
        result = await client.trigger_workflow("send-welcome-email", {"userId": "u1"})
        status = await client.health()

asyncio.run(main())
```

`AsyncFlowwatchClient` uses `httpx.AsyncClient` under the hood. Use `async with` or call `aclose()` manually to release the connection pool.

---

## Deployment

The sidecar and your Python app are separate processes. A common setup:

```yaml
# docker-compose.yml
services:
  flowwatch-sidecar:
    image: node:20
    command: node sidecar.js
    environment:
      - DATABASE_URL=postgres://...
      - SIDECAR_TOKEN=my-secret-token
    ports:
      - "9400:9400"

  my-python-app:
    build: .
    environment:
      - FLOWWATCH_URL=http://flowwatch-sidecar:9400
      - SIDECAR_TOKEN=my-secret-token
```

```python
import os
client = FlowwatchClient(os.environ["FLOWWATCH_URL"], token=os.environ["SIDECAR_TOKEN"])
```

---

## Error handling

Every method raises `httpx.HTTPStatusError` on a non-2xx response. Wrap calls that can fail:

```python
from httpx import HTTPStatusError

try:
    client.log_trace_span("slow-query", "database", 450.0)
except HTTPStatusError as e:
    print(f"FlowWatch sidecar returned {e.response.status_code}")
except Exception:
    pass  # sidecar unreachable — decide whether this should fail your app
```

FlowWatch is observability infrastructure. A down sidecar should generally not crash your application — catch and swallow errors from this SDK at the call sites that are not critical.
