<h1 align="center">
  <img src="https://raw.githubusercontent.com/PranshulSoni/FlowWatch/main/assets/logo.png?v=5" alt="Flowwatch Logo" width="450" />
</h1>

<p align="center">
  <a href="https://pkg.go.dev/github.com/PranshulSoni/flowwatch-go/flowwatch"><img src="https://pkg.go.dev/badge/github.com/PranshulSoni/flowwatch-go/flowwatch.svg" alt="Go Reference" /></a>
</p>

<p align="center">
  <strong>Go client SDK for FlowWatch — durable workflows, feature flags, request tracing, and error capture.</strong>
</p>

<p align="center">
  Zero non-stdlib dependencies. Uses only <code>net/http</code> and <code>encoding/json</code>.
</p>

---

## Before you start: the sidecar is required

This package is a **thin HTTP client**. It does not connect to any database and does not run any background processes. All the actual logic lives in the **FlowWatch Node.js sidecar**, which must be running and reachable before any method in this SDK will work.

**What this package does:**
- Wraps the five sidecar REST endpoints in a clean Go API
- Handles auth headers, JSON encoding/decoding, and HTTP errors
- Uses `context.Context` on every call for timeouts and cancellation

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

---

## Step 2 — Install the Go SDK

```bash
go get github.com/PranshulSoni/flowwatch-go
```

Requires Go 1.21+.

---

## Step 3 — Use it

```go
import "github.com/PranshulSoni/flowwatch-go/flowwatch"

c := flowwatch.New(
    "http://localhost:9400",
    os.Getenv("SIDECAR_TOKEN"),  // must match the token set in startSidecar
)
```

Pass an empty string for token if the sidecar has no auth configured (dev only).

---

## Authentication

If your sidecar was started with a `token`, every request must include it. Pass it as the second argument to `New`:

```go
c := flowwatch.New("http://localhost:9400", "my-secret-token")
```

The SDK sends it automatically as `Authorization: Bearer <token>`. Pass `""` if no auth is configured.

---

## API Reference

### `EvaluateFlag(ctx, key, flagCtx) (bool, error)`

Returns `true` if the feature flag is enabled for the given user context. Evaluation logic (percentage rollouts, targeting rules) runs in the sidecar.

```go
ctx := context.Background()

enabled, err := c.EvaluateFlag(ctx, "new-checkout-flow", map[string]any{
    "userId": "user_123",
    "plan":   "pro",
})
if err != nil {
    log.Printf("flag check failed: %v", err)
}
if enabled {
    useNewCheckout()
}
```

Pass `nil` for `flagCtx` if the flag has no targeting rules.

---

### `TriggerWorkflow(ctx, name, input) (TriggerResult, error)`

Starts a durable workflow execution. The workflow steps run in the Node.js process — this call just enqueues the job and returns immediately.

```go
result, err := c.TriggerWorkflow(ctx, "order-fulfillment", map[string]any{
    "orderId": "order_456",
    "userId":  "user_123",
})
if err == nil {
    log.Printf("started execution %s", result.ExecutionID)
}
```

The workflow must be registered in the Node.js sidecar with `fw.workflow(name, steps)`.

---

### `LogTraceSpan(ctx, TraceSpanOptions) error`

Submits a pre-timed performance span. You are responsible for measuring the duration.

```go
start := time.Now()
rows, err := db.QueryContext(ctx, "SELECT * FROM products")
duration := time.Since(start)

c.LogTraceSpan(ctx, flowwatch.TraceSpanOptions{
    Name:       "fetch-products",
    Type:       "database",
    DurationMs: float64(duration.Milliseconds()),
    Metadata:   map[string]any{"rowCount": len(rows)},
})
```

`Type` can be any string: `"database"`, `"http"`, `"function"`, `"cache"`, etc.

---

### `CaptureError(ctx, CaptureErrorOptions) error`

Reports an error to FlowWatch. Use in `if err != nil` blocks where you want the error visible in the dashboard.

```go
_, err := processPayment(order)
if err != nil {
    c.CaptureError(ctx, flowwatch.CaptureErrorOptions{
        Message: err.Error(),
        Name:    "PaymentError",
        Source:  "go-payment-service",
    })
    return fmt.Errorf("payment failed: %w", err)
}
```

`CaptureError` only records the error — it does not affect the current request's control flow.

---

### `Health(ctx) (map[string]any, error)`

Checks whether the sidecar is reachable and healthy.

```go
status, err := c.Health(ctx)
if err != nil {
    log.Fatal("flowwatch sidecar unreachable")
}
log.Printf("sidecar status: %v", status)
```

Use this in startup checks or health-check endpoints.

---

## Deployment

The sidecar and your Go app are separate processes. A common setup:

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

  my-go-app:
    build: .
    environment:
      - FLOWWATCH_URL=http://flowwatch-sidecar:9400
      - SIDECAR_TOKEN=my-secret-token
```

```go
c := flowwatch.New(os.Getenv("FLOWWATCH_URL"), os.Getenv("SIDECAR_TOKEN"))
```

---

## Error handling

Every method returns a standard Go `error`. A non-2xx HTTP response is returned as an error with the status code and body included in the message.

```go
enabled, err := c.EvaluateFlag(ctx, "my-flag", nil)
if err != nil {
    // e.g. "flowwatch: POST /api/flag → 401: {"error":{"code":"unauthorized"}}"
    log.Printf("flag check failed: %v", err)
    enabled = false  // fall back to default behavior
}
```

FlowWatch is observability infrastructure. A down sidecar should generally not crash your application — decide at each call site whether to propagate or swallow the error.
