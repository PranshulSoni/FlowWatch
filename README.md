<h1 align="center">
  <img src="assets/logo.png?v=6" alt="Flowwatch Logo" width="450" />
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@pranshulsoni/flowwatch"><img src="https://img.shields.io/npm/v/@pranshulsoni/flowwatch.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@pranshulsoni/flowwatch"><img src="https://img.shields.io/npm/dm/@pranshulsoni/flowwatch.svg" alt="npm downloads" /></a>
  <a href="https://www.npmjs.com/package/@pranshulsoni/flowwatch"><img src="https://img.shields.io/npm/l/@pranshulsoni/flowwatch.svg" alt="npm license" /></a>
</p>

<p align="center">
  <strong>The complete backend operations layer for Express — workflows, feature flags, tracing, error capture, rate limiting, caching, WebSockets, metrics, and more. Free. Self-hosted. One package.</strong>
</p>

<p align="center">
  No SaaS. No monthly bill. No third-party cloud. Your Postgres, your Redis, your data.
</p>

---

## Table of Contents

- [Getting started](#getting-started)
- [Features](#features)
- [Quick Reference](#quick-reference)
- [Client SDKs](#client-sdks)
  - [Python](#python-sdk)
  - [Go](#go-sdk)
  - [Rust](#rust-sdk)
- [License](#license)

---

```bash
npm i @pranshulsoni/flowwatch
```

---

## Getting started

```ts
import express from "express";
import { createFlowwatch } from "@pranshulsoni/flowwatch";

const app = express();
app.use(express.json());

const fw = await createFlowwatch({
  db: { connectionString: process.env.DATABASE_URL },
  migrations: { autoRun: true },
  runtime: { serviceName: "my-api", environment: "production" },
  // optional:
  redis: { url: process.env.REDIS_URL },
  elasticsearch: { node: process.env.ELASTICSEARCH_URL },
  ai: { groqApiKey: process.env.GROQ_API_KEY },
});

app.use(fw.requestTracer);     // mount first
app.use("/ops", fw.dashboard);
app.use(fw.errorHandler);      // mount last

app.listen(3000);

// graceful shutdown
process.on("SIGTERM", async () => { await fw.close(); process.exit(0); });
```

---

## Features

<details>
<summary><strong>Dashboard</strong> — 10-page admin UI served from your Express app</summary>

```ts
app.use("/ops", fw.dashboard);
```

Secure it with your existing auth middleware before the mount. Includes pages for workflows, flags, traces, errors, logs, metrics, and AI chat.

</details>

<details>
<summary><strong>Durable Workflows</strong> — multi-step processes that survive server crashes</summary>

```ts
fw.workflow("send-order", [
  { name: "charge",    handler: async (ctx) => charge(ctx.input.userId, ctx.input.amount) },
  { name: "inventory", handler: async (ctx) => deductStock(ctx.input.itemId) },
  { name: "email",     handler: async (ctx) => sendConfirmation(ctx.input.email) },
]);

app.post("/orders", async (req, res) => {
  await fw.trigger("send-order", req.body);
  res.json({ queued: true });
});
```

Each step records its result. If your server crashes mid-workflow, the next restart picks up from the last completed step.

</details>

<details>
<summary><strong>Feature Flags</strong> — toggle features and run percentage rollouts from the dashboard</summary>

```ts
app.get("/checkout", async (req, res) => {
  const newUI = await fw.flag("new-checkout", { userId: req.user.id });
  res.json({ layout: newUI ? "v2" : "v1" });
});
```

Evaluated with Redis caching. Percentage rollouts are sticky per user. No redeploys needed.

</details>

<details>
<summary><strong>Request Tracing</strong> — see what every request did and how long each part took</summary>

```ts
app.use(fw.requestTracer); // mount first

app.get("/products", async (req, res) => {
  const products = await fw.trace("db-query", () => db.query("SELECT * FROM products"));
  res.json(products);
});
```

All traces stored in Postgres and searchable from the dashboard.

</details>

<details>
<summary><strong>Error Reporting</strong> — capture and search errors with full stack traces and context</summary>

```ts
app.use(fw.errorHandler); // mount last

// manual capture
try {
  await riskyThing();
} catch (err) {
  fw.captureError(err, { userId: req.user.id, route: req.path });
}
```

Only use `captureError` for 5xx errors — it's a no-op on 4xx.

</details>

<details>
<summary><strong>Caching</strong> — HTTP ETag cache, Redis response cache, query cache with tag invalidation</summary>

**HTTP ETag cache** — zero-config 304 responses:

```ts
app.get("/config", fw.httpCache(), handler);
app.get("/config", fw.httpCache({ maxAge: 300 }), handler);
```

**Redis response cache** — cache full response bodies:

```ts
app.get("/products", fw.responseCache({ ttl: 60 }), handler);
app.get("/prices",   fw.responseCache({ ttl: 30, key: (req) => `prices:${req.query.currency}` }), handler);
```

**Query cache with tag invalidation** — cache DB results, bust by tag:

```ts
const rows = await fw.queryCache.get(
  "SELECT * FROM products WHERE category = $1",
  ["electronics"],
  { ttl: 300, tags: ["products"] }
);

await fw.queryCache.invalidate("products"); // bust everything tagged "products"
```

</details>

<details>
<summary><strong>Full-Text Search</strong> — Postgres tsvector search with ranked results</summary>

```ts
const results = await fw.search({
  table: "articles",
  columns: ["title", "body"],
  query: req.query.q as string,
  limit: 20,
  offset: 0,
});
// results.rows — ranked by relevance
// results.total — total count for pagination
```

Table and column names are validated against a regex allowlist to prevent SQL injection.

</details>

<details>
<summary><strong>Rate Limiting</strong> — Redis-backed limiter with graceful degradation</summary>

```ts
// global limit per IP
app.use(fw.rateLimit({ max: 100, windowSeconds: 60 }));

// stricter on auth routes
app.post("/login", fw.rateLimit({ max: 5, windowSeconds: 60, keyBy: "ip" }), loginHandler);

// per-user on authenticated routes
app.use("/api", fw.rateLimit({ max: 1000, windowSeconds: 60, keyBy: "userId" }));
```

Sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers. Falls through silently if Redis is unavailable.

</details>

<details>
<summary><strong>IP Filtering</strong> — CIDR allowlist and blocklist</summary>

```ts
// allowlist — only these IPs pass
app.use("/admin", fw.ipFilter({ allow: ["203.0.113.0/24", "10.0.0.0/8"] }));

// blocklist — these IPs are rejected
app.use(fw.ipFilter({ deny: ["198.51.100.5", "192.0.2.0/24"] }));
```

Supports individual IPs and CIDR ranges. Strips IPv4-mapped IPv6 prefixes automatically.

</details>

<details>
<summary><strong>API Versioning</strong> — version detection middleware and isolated version routers</summary>

```ts
// detect version from header or query param
app.use(fw.versionMiddleware()); // sets req.apiVersion
app.use(fw.versionMiddleware({ defaultVersion: 2, header: "x-api-version" }));

// isolated route groups per version
const v1 = fw.version();
const v2 = fw.version();

v1.get("/users", handleUsersV1);
v2.get("/users", handleUsersV2);

app.use("/v1", v1);
app.use("/v2", v2);
```

</details>

<details>
<summary><strong>Bulkhead Isolation</strong> — limit concurrency and queue excess to protect slow dependencies</summary>

```ts
const dbBulkhead = fw.bulkhead({ limit: 10, queue: 20 });

app.get("/reports", async (req, res) => {
  const result = await dbBulkhead.execute(() => runExpensiveQuery());
  res.json(result);
});

console.log(dbBulkhead.active);  // in-flight count
console.log(dbBulkhead.queued);  // waiting count
```

Throws `"Bulkhead full"` when both `limit` and `queue` slots are exhausted.

</details>

<details>
<summary><strong>Circuit Breaker</strong> — stop calling a failing dependency until it recovers</summary>

```ts
const paymentBreaker = fw.circuitBreaker({ threshold: 5, timeout: 30_000 });

app.post("/pay", async (req, res) => {
  try {
    const result = await paymentBreaker.execute(() => callPaymentService(req.body));
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: "Payment service unavailable, try again shortly." });
  }
});
```

States: `CLOSED` → `OPEN` → `HALF_OPEN`. Opens after `threshold` failures, resets after `timeout` ms.

</details>

<details>
<summary><strong>WebSockets</strong> — attach a WebSocket server to your HTTP server</summary>

```ts
import http from "http";

const server = http.createServer(app);
const ws = fw.websocket(server, "/ws"); // path defaults to "/ws"

ws.server.on("connection", (socket) => {
  socket.on("message", (msg) => {
    ws.broadcast(msg); // fan out to all open connections
  });
});

server.listen(3000);
process.on("SIGTERM", async () => { await ws.close(); });
```

</details>

<details>
<summary><strong>CRON Scheduler</strong> — recurring background jobs backed by BullMQ</summary>

```ts
fw.cron("cleanup-old-sessions", "0 3 * * *", async () => {
  await db.query("DELETE FROM sessions WHERE expires_at < NOW()");
});

fw.cron("send-digest-emails", "0 9 * * 1", async () => {
  const { rows } = await db.query("SELECT * FROM users WHERE digest_enabled = true");
  for (const user of rows) await sendDigest(user);
});
```

Standard cron syntax. Jobs persist across restarts and are deduplicated in Redis.

</details>

<details>
<summary><strong>Outbound Webhooks</strong> — signed event delivery with automatic retries</summary>

```ts
await fw.webhook.register({
  url: "https://partner.example.com/hooks",
  events: ["order.created", "order.shipped"],
  secret: process.env.WEBHOOK_SECRET,
});

await fw.webhook.deliver("order.created", {
  orderId: "ord_123",
  userId: "usr_456",
  total: 4999,
});
```

Deliveries stored in Postgres, retried with exponential backoff via BullMQ.

</details>

<details>
<summary><strong>Prometheus Metrics</strong> — expose /metrics and add custom counters and histograms</summary>

```ts
app.get("/metrics", fw.metrics.handler);

fw.metrics.counter("orders_created_total").inc();
fw.metrics.histogram("payment_duration_seconds").observe(duration);
```

Default Node.js process metrics included (memory, CPU, event loop lag).

</details>

<details>
<summary><strong>Structured Log Store</strong> — write structured logs to Postgres and query them</summary>

```ts
// logs written automatically by the Flowwatch logger
const logs = await fw.logs.query({
  level: "error",
  from: new Date(Date.now() - 3_600_000), // last hour
  limit: 50,
});
```

Stored in `flowwatch_logs` with a GIN index on the message column.

</details>

<details>
<summary><strong>Auto-Instrumented Query & Fetch</strong> — automatic trace spans on DB calls and HTTP requests</summary>

```ts
// use instead of raw pool.query() — creates a trace span automatically
const { rows } = await fw.query("SELECT * FROM orders WHERE user_id = $1", [userId]);

// use instead of raw fetch() — creates a trace span automatically
const data = await fw.fetch("https://api.stripe.com/v1/charges", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.STRIPE_KEY}` },
  body: JSON.stringify(payload),
});
```

Spans appear in the dashboard under the parent request trace with no manual `fw.trace()` wrapping.

</details>

<details>
<summary><strong>Internal Event Bus</strong> — emit and subscribe to application-level events</summary>

```ts
fw.events.emit("order:created", { orderId: "ord_123", total: 4999 });

fw.events.on("order:created", async (payload) => {
  await sendOrderConfirmationEmail(payload.orderId);
});

fw.events.once("user:first-login", async ({ userId }) => {
  await sendWelcomeEmail(userId);
});
```

Node.js `EventEmitter` under the hood — zero overhead, synchronous dispatch.

</details>

<details>
<summary><strong>Server-Sent Events</strong> — push real-time updates over plain HTTP</summary>

```ts
import { createSseConnection } from "@pranshulsoni/flowwatch";

app.get("/events", (req, res) => {
  const sse = createSseConnection(req, res);

  const interval = setInterval(() => {
    sse.send({ type: "heartbeat", ts: Date.now() });
  }, 30_000);

  sse.onClose(() => clearInterval(interval));
});
```

No WebSocket handshake. Works through proxies and load balancers that support streaming.

</details>

<details>
<summary><strong>Testing Utilities</strong> — drop-in mocks for Postgres and Redis</summary>

```ts
import { createMockPool, createMockRedis } from "@pranshulsoni/flowwatch";

const pool  = createMockPool([{ id: 1, name: "Widget" }]); // query() returns these rows
const redis = createMockRedis();                            // in-memory store

const cache = createQueryCache(pool, redis);
```

`createMockRedis` supports `get`, `set`, `setex`, `del`, `incr`, `sadd`, `smembers`, and `expire` with a real in-memory store.

</details>

<details>
<summary><strong>Migration Rollback</strong> — roll back the last applied migration</summary>

```ts
await fw.rollbackMigration();
```

Runs the migration's `down` SQL inside a transaction and removes the row from `flowwatch_migrations`. Useful in staging and CI.

</details>

<details>
<summary><strong>Multi-Language Sidecar</strong> — use Flowwatch from Python, Go, or Rust</summary>

```ts
import { startSidecar } from "@pranshulsoni/flowwatch";

startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN });
```

```python
from flowwatch import FlowwatchClient

client = FlowwatchClient("http://localhost:9400", token="your-token")
enabled = client.evaluate_flag("new-ui", {"userId": "user_123"})
```

SDK packages: `flowwatch-client` (Python), `flowwatch-go` (Go), `flowwatch-client` (Rust crate).

</details>

<details>
<summary><strong>AI Diagnostics</strong> — automated incident analysis and chat over your own data</summary>

```ts
const fw = await createFlowwatch({
  // ...
  ai: { groqApiKey: process.env.GROQ_API_KEY },
});
```

Available from the dashboard. Analyzes traces and errors to explain incidents and suggest fixes.

</details>

---

## Quick Reference

```ts
// Middleware
fw.requestTracer              // mount first
fw.errorHandler               // mount last
fw.httpCache(opts?)           // ETag/304 per route
fw.responseCache(opts)        // Redis cache per route
fw.rateLimit(opts)            // rate limit per route or global
fw.ipFilter(opts)             // IP allowlist/blocklist
fw.versionMiddleware(opts?)   // sets req.apiVersion

// Core
fw.workflow(name, steps)      // register durable workflow
fw.trigger(name, input)       // trigger workflow
fw.flag(name, context)        // evaluate feature flag
fw.trace(name, fn)            // manual trace span
fw.captureError(err, ctx?)    // capture 5xx error
fw.dashboard                  // Router — mount anywhere

// Resilience
fw.bulkhead(opts)             // → { execute, active, queued }
fw.circuitBreaker(opts?)      // → { execute, state }

// Transport & Scheduling
fw.websocket(server, path?)   // → { server, broadcast, close }
fw.webhook                    // → { register, deliver }
fw.cron(name, expr, fn)       // register recurring job

// Caching & Search
fw.queryCache                 // → { get, invalidate }
fw.search(opts)               // Postgres full-text search
fw.version()                  // → Express Router (versioned routes)

// Observability
fw.metrics                    // → { handler, counter, histogram }
fw.logs.query(opts)           // query Postgres log store
fw.query(sql, params)         // auto-traced pg query
fw.fetch(url, opts?)          // auto-traced fetch
fw.events                     // → { on, once, emit, off }

// Teardown
fw.rollbackMigration()        // roll back last migration
fw.close()                    // drain all connections
```

---

## Client SDKs

All three SDKs talk to the lightweight sidecar you start alongside your Node.js app:

```ts
import { startSidecar } from "@pranshulsoni/flowwatch";
startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN });
```

---

### Python SDK

**Package:** [`flowwatch-client`](https://pypi.org/project/flowwatch-client) &nbsp;·&nbsp; **Source:** [`sdks/python`](./sdks/python)

```bash
pip install flowwatch-client
```

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

client.close()
```

---

### Go SDK

**Module:** [`github.com/PranshulSoni/flowwatch-go`](https://github.com/PranshulSoni/flowwatch-go) &nbsp;·&nbsp; **Source:** [`sdks/go`](./sdks/go)

```bash
go get github.com/PranshulSoni/flowwatch-go
```

```go
import (
    "context"
    fw "github.com/PranshulSoni/flowwatch-go/flowwatch"
)

client := fw.New("http://localhost:9400", "your-token")
ctx := context.Background()

// Feature flag
enabled, _ := client.EvaluateFlag(ctx, "new-checkout", map[string]any{"userId": "user_123"})

// Trigger a workflow
client.TriggerWorkflow(ctx, "send-order", map[string]any{"orderId": "ord_456"})

// Capture an error
client.CaptureError(ctx, fw.CaptureErrorOptions{
    Message: "something broke",
    Name:    "OrderError",
    Source:  "checkout-service",
})

// Submit a trace span
client.LogTraceSpan(ctx, fw.TraceSpanOptions{
    Name:       "db-query",
    Type:       "db",
    DurationMs: 42.5,
    Status:     "ok",
})
```

---

### Rust SDK

**Crate:** [`flowwatch-client`](https://crates.io/crates/flowwatch-client) &nbsp;·&nbsp; **Source:** [`sdks/rust`](./sdks/rust)

```toml
# Cargo.toml
[dependencies]
flowwatch-client = "3.0"
```

```rust
use flowwatch_client::{FlowwatchClient, CaptureErrorOptions};
use std::collections::HashMap;

#[tokio::main]
async fn main() {
    let client = FlowwatchClient::new("http://localhost:9400", Some("your-token"));

    // Feature flag
    let enabled = client.evaluate_flag("new-checkout", HashMap::new()).await.unwrap();

    // Trigger a workflow
    client.trigger_workflow("send-order", Some(serde_json::json!({
        "orderId": "ord_456",
        "amount": 4999
    }))).await.unwrap();

    // Capture an error
    client.capture_error(CaptureErrorOptions {
        message: "something broke".into(),
        name: Some("OrderError".into()),
        source: Some("checkout".into()),
        stack: None,
    }).await.unwrap();
}
```

---

## License

MIT
