# flowwatch-client (Rust)

<p>
  <a href="https://crates.io/crates/flowwatch-client"><img src="https://img.shields.io/crates/v/flowwatch-client.svg" alt="crates.io version" /></a>
  <a href="https://crates.io/crates/flowwatch-client"><img src="https://img.shields.io/crates/d/flowwatch-client.svg" alt="Downloads" /></a>
  <a href="https://crates.io/crates/flowwatch-client"><img src="https://img.shields.io/crates/l/flowwatch-client.svg" alt="License" /></a>
  <a href="https://docs.rs/flowwatch-client"><img src="https://img.shields.io/docsrs/flowwatch-client.svg" alt="docs.rs" /></a>
</p>

Rust client SDK for [FlowWatch](https://github.com/PranshulSoni/FlowWatch) — feature flags, durable workflows, request tracing, and error capture.

This SDK talks to a lightweight sidecar HTTP server that you run alongside your Node.js FlowWatch app. See the [full documentation](https://github.com/PranshulSoni/FlowWatch) for setup instructions.

## Installation

```toml
[dependencies]
flowwatch-client = "3.0"
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

```rust
use flowwatch_client::{FlowwatchClient, CaptureErrorOptions, TraceSpanOptions};
use std::collections::HashMap;

#[tokio::main]
async fn main() {
    let client = FlowwatchClient::new("http://localhost:9400", Some("your-token"));

    // Feature flag
    let enabled = client
        .evaluate_flag("new-checkout", HashMap::new())
        .await
        .unwrap();

    // Trigger a workflow
    client
        .trigger_workflow("send-order", Some(serde_json::json!({
            "orderId": "ord_456",
            "amount": 4999,
        })))
        .await
        .unwrap();

    // Capture an error
    client
        .capture_error(CaptureErrorOptions {
            message: "payment failed".into(),
            name: Some("PaymentError".into()),
            source: Some("checkout".into()),
            stack: None,
        })
        .await
        .unwrap();

    // Submit a trace span
    client
        .log_trace_span(TraceSpanOptions {
            name: "db-query".into(),
            r#type: "db".into(),
            duration_ms: 42.5,
            status: "ok".into(),
            metadata: None,
        })
        .await
        .unwrap();
}
```

## License

ISC
