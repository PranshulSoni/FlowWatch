# flowwatch-go

<p>
  <a href="https://pkg.go.dev/github.com/PranshulSoni/flowwatch-go"><img src="https://pkg.go.dev/badge/github.com/PranshulSoni/flowwatch-go.svg" alt="pkg.go.dev" /></a>
  <a href="https://goreportcard.com/report/github.com/PranshulSoni/flowwatch-go"><img src="https://goreportcard.com/badge/github.com/PranshulSoni/flowwatch-go" alt="Go Report Card" /></a>
  <a href="https://github.com/PranshulSoni/FlowWatch/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-ISC-blue.svg" alt="License" /></a>
</p>

Go client SDK for [FlowWatch](https://github.com/PranshulSoni/FlowWatch) — feature flags, durable workflows, request tracing, and error capture.

This SDK talks to a lightweight sidecar HTTP server that you run alongside your Node.js FlowWatch app. See the [full documentation](https://github.com/PranshulSoni/FlowWatch) for setup instructions.

## Installation

```bash
go get github.com/PranshulSoni/flowwatch-go
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

```go
import (
    "context"
    fw "github.com/PranshulSoni/flowwatch-go/flowwatch"
)

client := fw.New("http://localhost:9400", "your-token")
ctx := context.Background()

// Feature flag
enabled, err := client.EvaluateFlag(ctx, "new-checkout", map[string]any{"userId": "user_123"})

// Trigger a workflow
result, err := client.TriggerWorkflow(ctx, "send-order", map[string]any{
    "orderId": "ord_456",
    "amount":  4999,
})

// Capture an error
client.CaptureError(ctx, fw.CaptureErrorOptions{
    Message: "payment failed",
    Name:    "PaymentError",
    Source:  "checkout-service",
})

// Submit a trace span
client.LogTraceSpan(ctx, fw.TraceSpanOptions{
    Name:       "db-query",
    Type:       "db",
    DurationMs: 42.5,
    Status:     "ok",
})

// Health check
status, err := client.Health(ctx)
```

## License

ISC
