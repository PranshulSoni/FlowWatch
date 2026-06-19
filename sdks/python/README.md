# flowwatch-client (Python)

<p>
  <a href="https://pypi.org/project/flowwatch-client"><img src="https://img.shields.io/pypi/v/flowwatch-client.svg" alt="PyPI version" /></a>
  <a href="https://pepy.tech/projects/flowwatch-client"><img src="https://static.pepy.tech/badge/flowwatch-client/month" alt="Monthly downloads" /></a>
  <a href="https://pypi.org/project/flowwatch-client"><img src="https://img.shields.io/pypi/l/flowwatch-client.svg" alt="License" /></a>
  <a href="https://pypi.org/project/flowwatch-client"><img src="https://img.shields.io/pypi/pyversions/flowwatch-client.svg" alt="Python versions" /></a>
</p>

Python client SDK for [FlowWatch](https://github.com/PranshulSoni/FlowWatch) — feature flags, durable workflows, request tracing, and error capture.

This SDK talks to a lightweight sidecar HTTP server that you run alongside your Node.js FlowWatch app. See the [full documentation](https://github.com/PranshulSoni/FlowWatch) for setup instructions.

## Installation

```bash
pip install flowwatch-client
```

## Prerequisites

You need the Node.js FlowWatch package running with the sidecar enabled:

```bash
npm i @pranshulsoni/flowwatch
```

```ts
import { createFlowwatch, startSidecar } from "@pranshulsoni/flowwatch";

const fw = await createFlowwatch({ db: { connectionString: process.env.DATABASE_URL } });
startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN });
```

## Usage

```python
from flowwatch import FlowwatchClient

client = FlowwatchClient("http://localhost:9400", token="your-token")

# Feature flag
if client.evaluate_flag("new-checkout", {"userId": "user_123"}):
    render_new_ui()

# Trigger a workflow
client.trigger_workflow("send-order", {"orderId": "ord_456", "amount": 4999})

# Capture an error
try:
    do_something_risky()
except Exception as e:
    import traceback
    client.capture_error(str(e), stack=traceback.format_exc(), source="worker")

# Auto-timed trace span (context manager)
with client.trace_span("db-query", type="db"):
    rows = db.execute("SELECT * FROM products")

# Health check
status = client.health()

client.close()
```

## Async support

Use `FlowwatchAsyncClient` for async codebases (FastAPI, asyncio):

```python
from flowwatch import FlowwatchAsyncClient

async def handler():
    async with FlowwatchAsyncClient("http://localhost:9400", token="your-token") as client:
        enabled = await client.evaluate_flag("new-checkout", {"userId": "user_123"})
```

## License

ISC
