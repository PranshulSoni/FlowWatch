# flowwatch-client (Rust)

Rust client for [FlowWatch](https://github.com/PranshulSoni/FlowWatch) — connects to a running FlowWatch sidecar over HTTP.

## Add to Cargo.toml

```toml
[dependencies]
flowwatch-client = "3.1.3"
tokio = { version = "1", features = ["full"] }
```

## Usage

Start the FlowWatch sidecar in your Node.js app:

```ts
import { createFlowwatch, startSidecar } from "@pranshulsoni/flowwatch"

const fw = await createFlowwatch({ ... })
startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN })
```

Then use the Rust client:

```rust
use flowwatch_client::FlowwatchClient;

#[tokio::main]
async fn main() {
    let fw = FlowwatchClient::new("http://localhost:9400", Some("your-token"));

    // Feature flag
    let enabled = fw.flag("new-checkout", None).await.unwrap();

    // Trigger a workflow
    let result = fw.trigger("send-welcome-email", Some(serde_json::json!({ "userId": "u_123" }))).await.unwrap();

    // Record a trace span
    fw.trace_span("db.query", "db", 42, None, "ok").await.unwrap();

    // Capture an error
    fw.capture_error("Something broke", "api", "RuntimeError", None).await.unwrap();

    // Health check
    let health = fw.health().await.unwrap();
    println!("{}", health.status); // "ok"
}
```

## API

| Method | Description |
|--------|-------------|
| `flag(key, context?)` | Evaluate a feature flag → `bool` |
| `trigger(name, input?)` | Trigger a workflow → `Value` |
| `trace_span(name, type, duration_ms, metadata?, status)` | Record a trace span |
| `capture_error(message, source, name, stack?)` | Capture an error |
| `health()` | Sidecar health check → `HealthResult` |
