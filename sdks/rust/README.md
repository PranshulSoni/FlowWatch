# flowwatch-client

Rust client for [FlowWatch](https://github.com/PranshulSoni/flowwatch). Wraps the FlowWatch sidecar REST API — requires the [sidecar server](https://github.com/PranshulSoni/flowwatch#multi-language-support-sidecar-server) to be running.

## Add to Cargo.toml

```toml
[dependencies]
flowwatch-client = "2.1.0"
```

## Usage

```rust
use flowwatch_client::{FlowwatchClient, TraceSpanOptions, CaptureErrorOptions};
use std::collections::HashMap;

#[tokio::main]
async fn main() {
    let client = FlowwatchClient::new("http://localhost:9400", Some("your-sidecar-token"));

    // Feature flag
    let enabled = client
        .evaluate_flag("new-feature", HashMap::new())
        .await.unwrap();

    // Durable workflow
    let result = client
        .trigger_workflow("checkout", Some(serde_json::json!({"cartId": "c1"})))
        .await.unwrap();
    println!("{}", result.execution_id);

    // Trace span
    client.log_trace_span(TraceSpanOptions {
        name: "db-query".into(),
        span_type: "database".into(),
        duration_ms: 45.0,
        status: None,
        metadata: None,
    }).await.unwrap();

    // Error capture
    client.capture_error(CaptureErrorOptions {
        message: "something failed".into(),
        name: None,
        stack: None,
        source: Some("my-rust-service".into()),
    }).await.unwrap();

    // Health
    println!("{:?}", client.health().await.unwrap());
}
```
