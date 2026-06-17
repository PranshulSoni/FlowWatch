# FlowWatch — Native SDK Packages (pip / Go / Cargo)

FlowWatch already has a **Sidecar Server** — a Node.js process that exposes a REST API at `http://localhost:<port>/api/*`. Non-JS backends call those HTTP endpoints to use FlowWatch features.

The three new packages are **thin HTTP client SDKs** that wrap those five sidecar endpoints:

| Endpoint | Feature |
|---|---|
| `POST /api/flag` | Evaluate a feature flag |
| `POST /api/trigger` | Trigger a durable workflow |
| `POST /api/trace-span` | Log a pre-timed trace span |
| `POST /api/capture-error` | Capture an error with stack trace |
| `GET /api/health` | Liveness check |

All three SDKs follow the same design: a `FlowwatchClient` class/struct initialized with a `base_url` + optional `token`, with one method per endpoint.

---

## Open Questions

> [!IMPORTANT]
> **Package names / registries** — Do you want to publish under your own name or a shared org?
> - PyPI: `flowwatch` or `pranshulsoni-flowwatch`?
> - Go module: `github.com/PranshulSoni/flowwatch-go`?
> - Cargo: `flowwatch` or `flowwatch-client`?
>
> The plan below uses `flowwatch` everywhere as the package name. Let me know if you want different names.

> [!NOTE]
> **Scope** — These packages are purely client-side. They do **not** embed any server, database, or queue. The Node.js sidecar must be running for them to work. This is by design and matches how the README already describes multi-language support.

---

## Proposed Changes

Three new top-level directories will be created. The existing monorepo is **not touched**.

---

### Python SDK — `sdks/python/`

Published to PyPI as `flowwatch`.

#### [NEW] `sdks/python/flowwatch/__init__.py`
Exports `FlowwatchClient` and all types.

#### [NEW] `sdks/python/flowwatch/client.py`
The main client class with methods:
- `evaluate_flag(key, context={})` → `bool`
- `trigger_workflow(name, input=None)` → `dict` with `executionId`
- `log_trace_span(name, type, duration_ms, status="ok", metadata=None)`
- `capture_error(message, name=None, stack=None, source=None, **options)`
- `health()` → `dict`

Plus a context manager `trace_span(name, type)` that auto-times and submits on exit.

#### [NEW] `sdks/python/pyproject.toml`
```toml
[project]
name = "flowwatch"
version = "2.1.0"
requires-python = ">=3.8"
dependencies = ["httpx>=0.27"]
```
Uses `httpx` (sync + async capable) as the only dependency. Async version available via `AsyncFlowwatchClient`.

#### [NEW] `sdks/python/README.md`

---

### Go SDK — `sdks/go/`

Published as a Go module at `github.com/PranshulSoni/flowwatch-go`.

#### [NEW] `sdks/go/go.mod`
Module declaration. Zero non-stdlib dependencies (uses `net/http` + `encoding/json`).

#### [NEW] `sdks/go/flowwatch/client.go`
```go
type Client struct { BaseURL, Token string }
func New(baseURL, token string) *Client
func (c *Client) EvaluateFlag(ctx, key string, context map[string]any) (bool, error)
func (c *Client) TriggerWorkflow(ctx, name string, input any) (TriggerResult, error)
func (c *Client) LogTraceSpan(ctx context.Context, opts TraceSpanOptions) error
func (c *Client) CaptureError(ctx context.Context, opts CaptureErrorOptions) error
func (c *Client) Health(ctx context.Context) (map[string]any, error)
```

#### [NEW] `sdks/go/flowwatch/types.go`
Request/response structs.

#### [NEW] `sdks/go/README.md`

---

### Rust SDK — `sdks/rust/`

Published to crates.io as `flowwatch-client`.

#### [NEW] `sdks/rust/Cargo.toml`
```toml
[package]
name = "flowwatch-client"
version = "2.1.0"

[dependencies]
reqwest = { version = "0.12", features = ["json"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["rt", "macros"], optional = true }
```

#### [NEW] `sdks/rust/src/lib.rs`
`FlowwatchClient` struct with async methods:
- `evaluate_flag(key, context)` → `Result<bool>`
- `trigger_workflow(name, input)` → `Result<TriggerResult>`
- `log_trace_span(opts)` → `Result<()>`
- `capture_error(opts)` → `Result<CaptureErrorResult>`
- `health()` → `Result<Value>`

#### [NEW] `sdks/rust/src/types.rs`
Serde-derive structs for all request/response bodies.

#### [NEW] `sdks/rust/README.md`

---

## Verification Plan

### Manual Verification
- Start the FlowWatch sidecar locally (`startSidecar(fw, 9400)`)
- For Python: `python -c "from flowwatch import FlowwatchClient; c = FlowwatchClient('http://localhost:9400'); print(c.health())"`
- For Go: write a small `cmd/main.go` that calls `Health()` and prints the result
- For Rust: `cargo run --example basic` that calls `health().await`
