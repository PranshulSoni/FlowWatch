# flowwatch-client (Python)

Python client for [FlowWatch](https://github.com/PranshulSoni/FlowWatch) — connects to a running FlowWatch sidecar over HTTP.

## Install

```bash
pip install flowwatch-client
```

## Usage

Start the FlowWatch sidecar in your Node.js app:

```ts
import { createFlowwatch, startSidecar } from "@pranshulsoni/flowwatch"

const fw = await createFlowwatch({ ... })
startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN })
```

Then use the Python client:

```python
from flowwatch import FlowwatchClient

fw = FlowwatchClient(base_url="http://localhost:9400", token="your-token")

# Feature flag
enabled = fw.flag("new-checkout", context={"userId": "u_123", "plan": "pro"})

# Trigger a workflow
result = fw.trigger("send-welcome-email", input={"userId": "u_123"})

# Record a trace span
fw.trace_span(name="db.query", type="db", duration_ms=42)

# Capture an error
fw.capture_error(message="Something broke", source="api", name="ValueError")

# Health check
status = fw.health()  # {"status": "ok", "sidecar": "flowwatch"}

fw.close()
```

Use as a context manager:

```python
with FlowwatchClient("http://localhost:9400", token="your-token") as fw:
    enabled = fw.flag("dark-mode")
```

## API

| Method | Description |
|--------|-------------|
| `flag(key, context?)` | Evaluate a feature flag → `bool` |
| `trigger(name, input?)` | Trigger a workflow → `dict` |
| `trace_span(name, type, duration_ms, metadata?, status?)` | Record a trace span |
| `capture_error(message, source, name?, stack?)` | Capture an error |
| `health()` | Sidecar health check → `dict` |
| `close()` | Close the HTTP connection |
