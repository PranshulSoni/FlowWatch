<h1 align="center">
  <img src="https://raw.githubusercontent.com/PranshulSoni/FlowWatch/main/assets/logo.png?v=4" alt="Flowwatch Logo" width="450" />
</h1>

<p align="center">
  <a href="https://crates.io/crates/flowwatch-client"><img src="https://img.shields.io/crates/v/flowwatch-client.svg" alt="Crates.io version" /></a>
  <a href="https://crates.io/crates/flowwatch-client"><img src="https://img.shields.io/crates/d/flowwatch-client.svg" alt="Crates.io downloads" /></a>
  <a href="https://crates.io/crates/flowwatch-client"><img src="https://img.shields.io/crates/l/flowwatch-client.svg" alt="Crates.io license" /></a>
</p>

<p align="center">
  <strong>Rust client SDK for FlowWatch — durable workflows, feature flags, request tracing, and error capture.</strong>
</p>

---

## Before you start: the sidecar is required

This crate is a **thin HTTP client**. It does not connect to any database and does not run any background processes. All the actual logic lives in the **FlowWatch Node.js sidecar**, which must be running and reachable before any method in this SDK will work.

**What this crate does:**
- Wraps the five sidecar REST endpoints in a clean async Rust API
- Handles auth headers, JSON serialization, and HTTP errors via `reqwest`
- All methods are `async` and work with any `tokio` runtime

**What this crate does NOT do:**
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

## Step 2 — Add the crate

```toml
# Cargo.toml
[dependencies]
flowwatch-client = "2.1.0"
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
```

---

## Step 3 — Use it

```rust
use flowwatch_client::FlowwatchClient;

let client = FlowwatchClient::new(
    "http://localhost:9400",
    Some("your-sidecar-token"),  // must match the token set in startSidecar
);
```

Pass `None` for token if the sidecar has no auth configured (dev only).

---

## Authentication

If your sidecar was started with a `token`, every request must include it. Pass it as the second argument to `new`:

```rust
let client = FlowwatchClient::new("http://localhost:9400", Some("my-secret-token"));
```

The SDK sends it automatically as `Authorization: Bearer <token>`. Pass `None` if no auth is configured.

---

## API Reference

### `evaluate_flag(key, context) → Result<bool>`

Returns `true` if the feature flag is enabled for the given user context. Evaluation logic (percentage rollouts, targeting rules) runs in the sidecar.

```rust
use std::collections::HashMap;
use serde_json::json;

let mut context = HashMap::new();
context.insert("userId".into(), json!("user_123"));
context.insert("plan".into(), json!("pro"));

let enabled = client.evaluate_flag("new-checkout-flow", context).await?;
if enabled {
    use_new_checkout();
}
```

Pass `HashMap::new()` if the flag has no targeting rules.

---

### `trigger_workflow(name, input) → Result<TriggerResult>`

Starts a durable workflow execution. The workflow steps run in the Node.js process — this call just enqueues the job and returns immediately.

```rust
use serde_json::json;

let result = client
    .trigger_workflow("order-fulfillment", Some(json!({
        "orderId": "order_456",
        "userId": "user_123",
    })))
    .await?;

println!("execution id: {}", result.execution_id);
```

The workflow must be registered in the Node.js sidecar with `fw.workflow(name, steps)`. Pass `None` for `input` if the workflow takes no input.

---

### `log_trace_span(TraceSpanOptions) → Result<()>`

Submits a pre-timed performance span. You are responsible for measuring the duration.

```rust
use flowwatch_client::TraceSpanOptions;
use std::time::Instant;

let start = Instant::now();
let rows = db.query("SELECT * FROM products", &[]).await?;
let duration_ms = start.elapsed().as_millis() as f64;

client.log_trace_span(TraceSpanOptions {
    name: "fetch-products".into(),
    span_type: "database".into(),
    duration_ms,
    status: Some("ok".into()),
    metadata: None,
}).await?;
```

`span_type` can be any string: `"database"`, `"http"`, `"function"`, `"cache"`, etc.

---

### `capture_error(CaptureErrorOptions) → Result<()>`

Reports an error to FlowWatch. Use in error handling paths where you want the error visible in the dashboard.

```rust
use flowwatch_client::CaptureErrorOptions;

if let Err(e) = process_payment(&order).await {
    client.capture_error(CaptureErrorOptions {
        message: e.to_string(),
        name: Some("PaymentError".into()),
        stack: None,
        source: Some("rust-payment-service".into()),
    }).await.ok();  // .ok() so a sidecar failure doesn't shadow the original error
    return Err(e);
}
```

`capture_error` only records the error — it does not affect your control flow. Call `.ok()` on the result if you want to ignore sidecar failures.

---

### `health() → Result<Value>`

Checks whether the sidecar is reachable and healthy.

```rust
let status = client.health().await?;
println!("{:?}", status);
// Object {"status": String("ok"), "postgres": String("connected"), ...}
```

---

## Complete example

```rust
use flowwatch_client::{FlowwatchClient, TraceSpanOptions, CaptureErrorOptions};
use std::collections::HashMap;
use std::time::Instant;

#[tokio::main]
async fn main() {
    let client = FlowwatchClient::new(
        std::env::var("FLOWWATCH_URL").unwrap_or("http://localhost:9400".into()),
        std::env::var("SIDECAR_TOKEN").ok().as_deref(),
    );

    // Health check at startup
    client.health().await.expect("FlowWatch sidecar not reachable");

    // Feature flag
    let enabled = client
        .evaluate_flag("beta-dashboard", HashMap::new())
        .await
        .unwrap_or(false);   // fall back to false if sidecar is down

    // Timed span
    let start = Instant::now();
    do_work();
    client.log_trace_span(TraceSpanOptions {
        name: "do-work".into(),
        span_type: "function".into(),
        duration_ms: start.elapsed().as_millis() as f64,
        status: None,
        metadata: None,
    }).await.ok();
}
```

---

## Deployment

The sidecar and your Rust binary are separate processes. A common setup:

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

  my-rust-app:
    build: .
    environment:
      - FLOWWATCH_URL=http://flowwatch-sidecar:9400
      - SIDECAR_TOKEN=my-secret-token
```

---

## Error handling

Every method returns `Result<T, reqwest::Error>`. A non-2xx HTTP response is converted to an error by `reqwest`'s `error_for_status()`.

FlowWatch is observability infrastructure. A down sidecar should generally not crash your application. Use `.unwrap_or(default)` or `.ok()` at call sites that are not critical:

```rust
// Non-critical: fall back silently
let enabled = client.evaluate_flag("my-flag", ctx).await.unwrap_or(false);

// Critical: propagate
client.health().await?;
```
