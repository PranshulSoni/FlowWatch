# flowwatch-go

Go client for [FlowWatch](https://github.com/PranshulSoni/flowwatch). Wraps the FlowWatch sidecar REST API — requires the [sidecar server](https://github.com/PranshulSoni/flowwatch#multi-language-support-sidecar-server) to be running. Zero non-stdlib dependencies.

## Install

```bash
go get github.com/PranshulSoni/flowwatch-go
```

## Usage

```go
import (
    "context"
    "time"
    "github.com/PranshulSoni/flowwatch-go/flowwatch"
)

c := flowwatch.New("http://localhost:9400", os.Getenv("SIDECAR_TOKEN"))
ctx := context.Background()

// Feature flag
enabled, err := c.EvaluateFlag(ctx, "new-feature", map[string]any{"userId": "u1", "plan": "pro"})

// Durable workflow
result, err := c.TriggerWorkflow(ctx, "checkout", map[string]any{"cartId": "cart_1"})
fmt.Println(result.ExecutionID)

// Trace span (pre-timed)
start := time.Now()
doWork()
err = c.LogTraceSpan(ctx, flowwatch.TraceSpanOptions{
    Name:       "db-query",
    Type:       "database",
    DurationMs: float64(time.Since(start).Milliseconds()),
})

// Error capture
err = c.CaptureError(ctx, flowwatch.CaptureErrorOptions{
    Message: err.Error(),
    Source:  "my-go-service",
})

// Health
status, err := c.Health(ctx)
```
