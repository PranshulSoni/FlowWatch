<h1 align="center">
  <img src="https://raw.githubusercontent.com/PranshulSoni/FlowWatch/main/assets/logo.png?v=6" alt="Flowwatch Logo" width="450" />
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

- [What you get](#what-you-get)
- [Getting started](#getting-started)
- [Dashboard](#dashboard)
- [Durable Workflows](#durable-workflows)
- [Feature Flags](#feature-flags)
- [Request Tracing](#request-tracing)
- [Error Reporting](#error-reporting)
- [Caching](#caching)
- [Full-Text Search](#full-text-search)
- [Rate Limiting](#rate-limiting)
- [IP Filtering](#ip-filtering)
- [API Versioning](#api-versioning)
- [Bulkhead Isolation](#bulkhead-isolation)
- [Circuit Breaker](#circuit-breaker)
- [WebSockets](#websockets)
- [CRON Scheduler](#cron-scheduler)
- [Outbound Webhooks](#outbound-webhooks)
- [Prometheus Metrics](#prometheus-metrics)
- [Structured Log Store](#structured-log-store)
- [Auto-Instrumented Query & Fetch](#auto-instrumented-query--fetch)
- [Internal Event Bus](#internal-event-bus)
- [Server-Sent Events](#server-sent-events)
- [Testing Utilities](#testing-utilities)
- [Migration Rollback](#migration-rollback)
- [Multi-Language Sidecar](#multi-language-sidecar)
- [AI Diagnostics](#ai-diagnostics)
- [Quick Reference](#quick-reference)

---

## What you get

```bash
npm i @pranshulsoni/flowwatch
```

One `createFlowwatch()` call gives you:

| Category | Features |
|---|---|
| **Core ops** | Durable workflows, feature flags, request tracing, error reporting |
| **Resilience** | Rate limiting, IP filtering, bulkhead isolation, circuit breaker |
| **Caching** | HTTP ETag cache, Redis response cache, query cache with tag invalidation |
| **Transport** | WebSocket server, Server-Sent Events, outbound webhook engine |
| **Scheduling** | CRON scheduler (BullMQ-backed) |
| **Observability** | Prometheus metrics, structured log store, auto-traced queries & fetches |
| **Search** | Postgres full-text search (tsvector) |
| **Routing** | API versioning middleware and router |
| **Messaging** | Internal event bus |
| **Dashboard** | 10-page admin UI served from your Express app |
| **Testing** | `createMockPool` and `createMockRedis` helpers |

Everything runs inside your own infrastructure. Postgres is the only hard requirement.

---

## Getting started

### Minimum setup

```ts
import express from "express";
import { createFlowwatch } from "@pranshulsoni/flowwatch";

const app = express();
app.use(express.json());

const fw = await createFlowwatch({
  db: { connectionString: process.env.DATABASE_URL },
  migrations: { autoRun: true },
  runtime: { serviceName: "my-api", environment: "production" },
});

app.use(fw.requestTracer);     // goes first
app.use("/ops", fw.dashboard);
app.use(fw.errorHandler);      // goes last

app.listen(3000);
```

Visit `http://localhost:3000/ops` to see the dashboard.

### Full setup

```ts
const fw = await createFlowwatch({
  db: { connectionString: process.env.DATABASE_URL },
  redis: { url: process.env.REDIS_URL },
  elasticsearch: { node: process.env.ELASTICSEARCH_URL },
  migrations: { autoRun: true },
  runtime: { serviceName: "my-api", environment: "production" },
});
```

### Cleanup

Call `fw.close()` on process exit to drain connections and workers gracefully.

```ts
process.on("SIGTERM", async () => { await fw.close(); process.exit(0); });
```

---

## Dashboard

A 10-page admin UI served directly from your Express app. Mount it anywhere.

```ts
app.use("/ops", fw.dashboard);
```

Secure it with your existing auth middleware before the mount.

---

## Durable Workflows

Define multi-step processes that survive server crashes and retry automatically.

```ts
fw.workflow("send-order", [
  { name: "charge",    handler: async (ctx) => charge(ctx.input.userId, ctx.input.amount) },
  { name: "inventory", handler: async (ctx) => deductStock(ctx.input.itemId) },
  { name: "email",     handler: async (ctx) => sendConfirmation(ctx.input.email) },
]);

// Trigger from any route
app.post("/orders", async (req, res) => {
  await fw.trigger("send-order", req.body);
  res.json({ queued: true });
});
```

Each step records its result. If your server crashes mid-workflow, the next restart picks up from the last completed step.

---

## Feature Flags

Toggle features and run percentage rollouts from the dashboard — no redeploys.

```ts
app.get("/checkout", async (req, res) => {
  const newUI = await fw.flag("new-checkout", { userId: req.user.id });
  res.json({ layout: newUI ? "v2" : "v1" });
});
```

Flags are evaluated with Redis caching. Percentage rollouts are sticky per user.

---

## Request Tracing

See what every request did, how long each part took, and which parts were slow.

```ts
app.use(fw.requestTracer); // mount first

// Add manual spans anywhere in your handlers
app.get("/products", async (req, res) => {
  const products = await fw.trace("db-query", () => db.query("SELECT * FROM products"));
  res.json(products);
});
```

All traces are stored in Postgres and searchable from the dashboard.

---

## Error Reporting

Capture, group, and search errors with full stack traces and context.

```ts
app.use(fw.errorHandler); // mount last

// Manual capture for non-thrown errors
try {
  await riskyThing();
} catch (err) {
  fw.captureError(err, { userId: req.user.id, route: req.path });
}
```

Only 5xx errors are worth capturing. `captureError` is a no-op on 4xx — don't pass client errors to it.

---

## Caching

### HTTP ETag cache

Zero-config 304 responses using SHA1 ETags.

```ts
app.get("/config", fw.httpCache(), handler);
app.get("/config", fw.httpCache({ maxAge: 300 }), handler);
```

### Redis response cache

Cache full response bodies in Redis with TTL.

```ts
app.get("/products", fw.responseCache({ ttl: 60 }), handler);
app.get("/prices",   fw.responseCache({ ttl: 30, key: (req) => `prices:${req.query.currency}` }), handler);
```

### Query cache with tag invalidation

Cache database query results and invalidate by tag.

```ts
const products = await fw.queryCache.get(
  "SELECT * FROM products WHERE category = $1",
  ["electronics"],
  { ttl: 300, tags: ["products"] }
);

// Bust all queries tagged "products" after a write
await db.query("UPDATE products SET ...");
await fw.queryCache.invalidate("products");
```

---

## Full-Text Search

Postgres `tsvector`-powered search — no Elasticsearch needed for text search.

```ts
const results = await fw.search({
  table: "articles",
  columns: ["title", "body"],
  query: req.query.q as string,
  limit: 20,
  offset: 0,
});
// results.rows — ranked by relevance
// results.total — total match count for pagination
```

Column and table names are validated against a regex allowlist to prevent SQL injection.

---

## Rate Limiting

Redis-backed sliding window limiter. Degrades gracefully if Redis is unavailable (lets requests through).

```ts
// 100 requests per minute per IP
app.use(fw.rateLimit({ max: 100, windowSeconds: 60 }));

// Stricter limits on auth endpoints, keyed by IP
app.post("/login", fw.rateLimit({ max: 5, windowSeconds: 60, keyBy: "ip" }), loginHandler);

// Per-user limits on authenticated routes
app.use("/api", fw.rateLimit({ max: 1000, windowSeconds: 60, keyBy: "userId" }));
```

Sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers automatically.

---

## IP Filtering

CIDR allowlist and blocklist. Strips IPv4-mapped IPv6 prefixes automatically.

```ts
// Only allow traffic from your office and VPN
app.use("/admin", fw.ipFilter({ allow: ["203.0.113.0/24", "10.0.0.0/8"] }));

// Block known bad actors
app.use(fw.ipFilter({ deny: ["198.51.100.5", "192.0.2.0/24"] }));
```

`allow` and `deny` can be individual IPs or CIDR ranges. Both can be combined.

---

## API Versioning

Detect the requested API version from headers or query params, and mount version-specific routes.

```ts
// Detect version on every request (reads "api-version" header or ?version= query)
app.use(fw.versionMiddleware());       // req.apiVersion is now set
app.use(fw.versionMiddleware({ defaultVersion: 2, header: "x-api-version" }));

// Mount version-specific route groups
const v1 = fw.version();
const v2 = fw.version();

v1.get("/users", handleUsersV1);
v2.get("/users", handleUsersV2);

app.use("/v1", v1);
app.use("/v2", v2);
```

---

## Bulkhead Isolation

Limit concurrent execution and queue excess requests to prevent one slow dependency from exhausting your thread pool.

```ts
const dbBulkhead = fw.bulkhead({ limit: 10, queue: 20 });

app.get("/reports", async (req, res) => {
  const result = await dbBulkhead.execute(() => runExpensiveQuery());
  res.json(result);
});

// Check current pressure
console.log(dbBulkhead.active);  // in-flight count
console.log(dbBulkhead.queued);  // waiting count
```

Throws `"Bulkhead full"` when both `limit` and `queue` are exhausted.

---

## Circuit Breaker

Stop hammering a failing dependency and give it time to recover.

```ts
const paymentBreaker = fw.circuitBreaker({ threshold: 5, timeout: 30_000 });

app.post("/pay", async (req, res) => {
  try {
    const result = await paymentBreaker.execute(() => callPaymentService(req.body));
    res.json(result);
  } catch (err) {
    // Circuit is OPEN — payment service is down
    res.status(503).json({ error: "Payment service unavailable, try again shortly." });
  }
});
```

States: `CLOSED` (normal) → `OPEN` (blocking calls) → `HALF_OPEN` (testing recovery).

---

## WebSockets

Attach a WebSocket server to your existing HTTP server.

```ts
import http from "http";

const server = http.createServer(app);
const ws = fw.websocket(server, "/ws");  // path defaults to "/ws"

// Broadcast to all connected clients
ws.server.on("connection", (socket) => {
  socket.on("message", (msg) => {
    ws.broadcast(msg);  // fan out to every open connection
  });
});

server.listen(3000);

// Graceful shutdown
process.on("SIGTERM", async () => { await ws.close(); });
```

---

## CRON Scheduler

Register recurring background jobs backed by BullMQ and Redis.

```ts
fw.cron("cleanup-old-sessions", "0 3 * * *", async () => {
  await db.query("DELETE FROM sessions WHERE expires_at < NOW()");
});

fw.cron("send-digest-emails", "0 9 * * 1", async () => {
  const users = await db.query("SELECT * FROM users WHERE digest_enabled = true");
  for (const user of users.rows) await sendDigest(user);
});
```

Uses standard cron syntax. Jobs persist across restarts and are deduplicated.

---

## Outbound Webhooks

Register webhook endpoints and deliver signed events with automatic retries.

```ts
// Register a webhook delivery target
await fw.webhook.register({
  url: "https://partner.example.com/hooks",
  events: ["order.created", "order.shipped"],
  secret: process.env.WEBHOOK_SECRET,
});

// Deliver an event (retried automatically on failure)
await fw.webhook.deliver("order.created", {
  orderId: "ord_123",
  userId: "usr_456",
  total: 4999,
});
```

Deliveries are stored in Postgres and retried with exponential backoff via BullMQ.

---

## Prometheus Metrics

Expose standard Prometheus metrics with one line.

```ts
// Expose /metrics endpoint
app.get("/metrics", fw.metrics.handler);

// Add custom counters and histograms
fw.metrics.counter("orders_created_total").inc();
fw.metrics.histogram("payment_duration_seconds").observe(duration);
```

Includes default Node.js process metrics (memory, CPU, event loop lag).

---

## Structured Log Store

Write structured logs to Postgres and query them programmatically.

```ts
// Logs are written automatically by the Flowwatch logger
// Query them later:
const logs = await fw.logs.query({
  level: "error",
  from: new Date(Date.now() - 3_600_000),  // last hour
  limit: 50,
});
```

Stored in `flowwatch_logs` with a GIN index on the message column for fast text search.

---

## Auto-Instrumented Query & Fetch

Use `fw.query` and `fw.fetch` instead of raw pg/fetch calls to get automatic trace spans — no manual `fw.trace()` wrapping needed.

```ts
// Automatically creates a trace span for this DB call
const { rows } = await fw.query("SELECT * FROM orders WHERE user_id = $1", [userId]);

// Automatically creates a trace span for this outbound HTTP call
const data = await fw.fetch("https://api.stripe.com/v1/charges", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.STRIPE_KEY}` },
  body: JSON.stringify(payload),
});
```

Spans appear in the dashboard under the parent request trace.

---

## Internal Event Bus

Emit and subscribe to application-level events without coupling modules.

```ts
// In your order module
fw.events.emit("order:created", { orderId: "ord_123", total: 4999 });

// In your notification module
fw.events.on("order:created", async (payload) => {
  await sendOrderConfirmationEmail(payload.orderId);
});

// Listen once
fw.events.once("user:first-login", async ({ userId }) => {
  await sendWelcomeEmail(userId);
});
```

Uses Node.js `EventEmitter` under the hood — zero overhead, synchronous dispatch.

---

## Server-Sent Events

Push real-time updates to browsers over a plain HTTP connection.

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

No WebSocket handshake required. Works through proxies and load balancers that support streaming.

---

## Testing Utilities

Drop-in mocks for unit tests — no real Postgres or Redis needed.

```ts
import { createMockPool, createMockRedis } from "@pranshulsoni/flowwatch";

const pool  = createMockPool([{ id: 1, name: "Widget" }]); // query() returns these rows
const redis = createMockRedis();                            // in-memory get/set/incr/sadd/smembers

// Use them anywhere your code expects a pg Pool or ioredis Redis
const cache = createQueryCache(pool, redis);
```

`createMockPool` accepts a rows array returned by every `query()` call. `createMockRedis` has a real in-memory store and supports `get`, `set`, `setex`, `del`, `incr`, `sadd`, `smembers`, and `expire`.

---

## Migration Rollback

Roll back the most recently applied migration (useful in staging or CI).

```ts
await fw.rollbackMigration();
```

Runs the migration's `down` SQL inside a transaction and removes the row from `flowwatch_migrations`.

---

## Multi-Language Sidecar

Use Flowwatch from Python, Go, or Rust via the lightweight sidecar server.

```ts
import { startSidecar } from "@pranshulsoni/flowwatch";

startSidecar(fw, {
  port: 9400,
  token: process.env.SIDECAR_TOKEN,
});
```

Then from Python:

```python
from flowwatch import FlowwatchClient

client = FlowwatchClient("http://localhost:9400", token="your-token")
enabled = client.evaluate_flag("new-ui", {"userId": "user_123"})
```

SDK packages: `flowwatch-client` (Python), `flowwatch-go` (Go), `flowwatch-client` (Rust crate).

---

## AI Diagnostics

Connect a Groq API key to get automated incident analysis and a chat interface that knows your actual trace and error data.

```ts
const fw = await createFlowwatch({
  // ...
  ai: { groqApiKey: process.env.GROQ_API_KEY },
});
```

Available from the dashboard — no extra setup.

---

## Quick Reference

```ts
const fw = await createFlowwatch(config);

// Middleware
fw.requestTracer              // Express middleware — mount first
fw.errorHandler               // Express middleware — mount last
fw.httpCache(opts?)           // ETag/304 middleware per route
fw.responseCache(opts)        // Redis cache middleware per route
fw.rateLimit(opts)            // Rate limit middleware
fw.ipFilter(opts)             // IP allowlist/blocklist middleware
fw.versionMiddleware(opts?)   // Sets req.apiVersion

// Core features
fw.workflow(name, steps)      // Register a durable workflow
fw.trigger(name, input)       // Trigger a workflow
fw.flag(name, context)        // Evaluate a feature flag
fw.trace(name, fn)            // Manual trace span
fw.captureError(err, ctx?)    // Capture a 5xx error
fw.dashboard                  // Express Router — mount anywhere

// Resilience
fw.bulkhead(opts)             // → Bulkhead { execute, active, queued }
fw.circuitBreaker(opts?)      // → CircuitBreaker { execute, state }

// Transport
fw.websocket(server, path?)   // → FlowwatchWebSocket { server, broadcast, close }
fw.webhook                    // → WebhookEngine { register, deliver }

// Scheduling
fw.cron(name, expr, fn)       // Register a recurring job

// Caching & Search
fw.queryCache                 // → { get, invalidate }
fw.search(opts)               // Postgres full-text search
fw.version()                  // → Express Router for versioned routes

// Observability
fw.metrics                    // → { handler, counter, histogram }
fw.logs.query(opts)           // Query structured Postgres logs
fw.query(sql, params)         // Auto-traced pg query
fw.fetch(url, opts?)          // Auto-traced fetch
fw.events                     // → EventBus { on, once, emit, off }

// Teardown
fw.rollbackMigration()        // Roll back last migration
fw.close()                    // Drain and close all connections
```

---

## License

MIT
