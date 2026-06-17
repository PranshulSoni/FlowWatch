# flowwatch (Python)

Python client for [FlowWatch](https://github.com/PranshulSoni/flowwatch). Wraps the FlowWatch sidecar REST API — requires the [sidecar server](https://github.com/PranshulSoni/flowwatch#multi-language-support-sidecar-server) to be running.

## Install

```bash
pip install flowwatch-client
```

## Usage

```python
from flowwatch import FlowwatchClient

client = FlowwatchClient("http://localhost:9400", token="your-sidecar-token")

# Feature flag
if client.evaluate_flag("new-billing-flow", {"userId": "u123", "plan": "pro"}):
    use_new_flow()

# Durable workflow
result = client.trigger_workflow("checkout", {"cartId": "cart_1"})
print(result["executionId"])

# Auto-timed trace span
with client.trace_span("process-order", "function"):
    process_order()

# Error capture
try:
    risky()
except Exception as e:
    import traceback
    client.capture_error(str(e), stack=traceback.format_exc(), source="my-service")

# Health check
print(client.health())

client.close()
```

### Async

```python
from flowwatch import AsyncFlowwatchClient

async with AsyncFlowwatchClient("http://localhost:9400", token="your-token") as client:
    enabled = await client.evaluate_flag("dark-mode", {"userId": "u1"})
    result = await client.trigger_workflow("send-email", {"to": "user@example.com"})
```
