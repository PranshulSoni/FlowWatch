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

- [Getting started](#getting-started)
- [Features](#features)
- [Quick Reference](#quick-reference)
- [Client SDKs](#client-sdks)
  - [Python](#python-sdk)
  - [Go](#go-sdk)
  - [Rust](#rust-sdk)
- [License](#license)

---

## Getting started

Pick your language:

<details>
<summary><strong>Node.js / TypeScript</strong></summary>

```bash
npm i @pranshulsoni/flowwatch
```

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

app.use(fw.requestTracer);     // mount first — assigns trace ID to every request
app.use("/ops", fw.dashboard); // admin UI
app.use(fw.errorHandler);      // mount last — catches everything thrown in routes

app.listen(3000);

process.on("SIGTERM", async () => { await fw.close(); process.exit(0); });
```

`autoRun: true` runs any pending database migrations on startup. Postgres is the only required dependency — Redis, Elasticsearch, and Groq are optional and degrade gracefully when not configured.

</details>

<details>
<summary><strong>Python</strong></summary>

> **Prerequisite:** Flowwatch is a Node.js package. To use it from Python you need to run the Node.js app (with the sidecar enabled) alongside your Python service. The Python SDK is a thin HTTP client that talks to that sidecar.

**Step 1 — Set up and run the Node.js sidecar**

```bash
npm i @pranshulsoni/flowwatch
```

```ts
// server.ts
import express from "express";
import { createFlowwatch, startSidecar } from "@pranshulsoni/flowwatch";

const app = express();
const fw = await createFlowwatch({ db: { connectionString: process.env.DATABASE_URL }, migrations: { autoRun: true } });

startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN });

app.use(fw.requestTracer);
app.use("/ops", fw.dashboard);
app.use(fw.errorHandler);
app.listen(3000);
```

**Step 2 — Install and use the Python client**

```bash
pip install flowwatch-client
```

```python
from flowwatch import FlowwatchClient

client = FlowwatchClient("http://localhost:9400", token="your-token")

if client.evaluate_flag("new-ui", {"userId": "user_123"}):
    render_new_ui()

client.trigger_workflow("send-order", {"orderId": "ord_456"})
client.close()
```

See the [Python SDK](#python-sdk) section for the full API.

</details>

<details>
<summary><strong>Go</strong></summary>

> **Prerequisite:** Flowwatch is a Node.js package. To use it from Go you need to run the Node.js app (with the sidecar enabled) alongside your Go service. The Go SDK is a thin HTTP client that talks to that sidecar.

**Step 1 — Set up and run the Node.js sidecar**

```bash
npm i @pranshulsoni/flowwatch
```

```ts
// server.ts
import express from "express";
import { createFlowwatch, startSidecar } from "@pranshulsoni/flowwatch";

const app = express();
const fw = await createFlowwatch({ db: { connectionString: process.env.DATABASE_URL }, migrations: { autoRun: true } });

startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN });

app.use(fw.requestTracer);
app.use("/ops", fw.dashboard);
app.use(fw.errorHandler);
app.listen(3000);
```

**Step 2 — Install and use the Go client**

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

enabled, _ := client.EvaluateFlag(ctx, "new-ui", map[string]any{"userId": "user_123"})
client.TriggerWorkflow(ctx, "send-order", map[string]any{"orderId": "ord_456"})
```

See the [Go SDK](#go-sdk) section for the full API.

</details>

<details>
<summary><strong>Rust</strong></summary>

> **Prerequisite:** Flowwatch is a Node.js package. To use it from Rust you need to run the Node.js app (with the sidecar enabled) alongside your Rust service. The Rust SDK is a thin HTTP client that talks to that sidecar.

**Step 1 — Set up and run the Node.js sidecar**

```bash
npm i @pranshulsoni/flowwatch
```

```ts
// server.ts
import express from "express";
import { createFlowwatch, startSidecar } from "@pranshulsoni/flowwatch";

const app = express();
const fw = await createFlowwatch({ db: { connectionString: process.env.DATABASE_URL }, migrations: { autoRun: true } });

startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN });

app.use(fw.requestTracer);
app.use("/ops", fw.dashboard);
app.use(fw.errorHandler);
app.listen(3000);
```

**Step 2 — Install and use the Rust client**

```toml
# Cargo.toml
[dependencies]
flowwatch-client = "3.0"
```

```rust
use flowwatch_client::{FlowwatchClient};
use std::collections::HashMap;

#[tokio::main]
async fn main() {
    let client = FlowwatchClient::new("http://localhost:9400", Some("your-token"));
    let enabled = client.evaluate_flag("new-ui", HashMap::new()).await.unwrap();
    client.trigger_workflow("send-order", Some(serde_json::json!({"orderId": "ord_456"}))).await.unwrap();
}
```

See the [Rust SDK](#rust-sdk) section for the full API.

</details>

---

## Features

<details>
<summary><strong>Dashboard</strong> — 10-page admin UI served directly from your Express app</summary>

### What it is

The dashboard is a full admin UI bundled inside the npm package itself. You mount it as a standard Express Router at any path you choose. There's no separate frontend service to deploy, no external hosting, and no build step — it's just static assets that get served from your existing Node.js process.

### What's inside

| Page | What you can do |
|---|---|
| **Overview** | Health status of Postgres, Redis, Elasticsearch; request rate and error rate graphs |
| **Workflows** | Browse all workflow executions, see which step each is on, retry failed steps |
| **Feature Flags** | Create flags, toggle them on/off, set percentage rollouts, target user segments |
| **Traces** | Search traces by route, status code, duration; view waterfall timelines |
| **Errors** | Browse grouped errors, see stack traces and request context, filter by severity |
| **Logs** | Tail and search structured logs stored in Postgres |
| **Metrics** | Live Prometheus metrics graphs |
| **AI Chat** | Ask questions about your traces and errors; get automated incident analysis |

### How to use it

```ts
// mount it anywhere — protect it with your auth middleware first
app.use("/ops", requireAdminAuth, fw.dashboard);
```

Visit `http://localhost:3000/ops` after starting your server.

</details>

<details>
<summary><strong>Durable Workflows</strong> — multi-step processes that survive server crashes and retry failed steps automatically</summary>

### The problem it solves

Imagine a checkout: charge the card → deduct inventory → send confirmation email. If your server crashes after the charge but before the email, the customer paid but got nothing. If you retry the whole thing, they get charged twice.

Durable workflows solve this by checkpointing every step. Each step's result is written to Postgres before the next step starts. If the process crashes, the next startup scans for incomplete executions and resumes from the last successful step — the charge doesn't run again, only the remaining steps do.

### How it works

- Workflows are defined as an array of named steps, each with an async handler function
- Triggering a workflow writes a row to `flowwatch_executions` in Postgres and enqueues a job in BullMQ (Redis-backed)
- A background worker picks up the job and runs steps sequentially, saving each result
- If a step throws, it's retried with backoff up to a configurable max
- The step handler receives a `ctx` object with the original `input` and the results of all previous steps via `ctx.results`

```ts
fw.workflow("checkout", [
  {
    name: "charge",
    handler: async (ctx) => {
      // ctx.input is whatever you passed to fw.trigger()
      const charge = await stripe.charges.create({
        amount: ctx.input.amount,
        customer: ctx.input.customerId,
      });
      return { chargeId: charge.id }; // returned value is saved to Postgres
    },
  },
  {
    name: "inventory",
    handler: async (ctx) => {
      // ctx.results.charge is the return value from the previous step
      await db.query("UPDATE products SET stock = stock - 1 WHERE id = $1", [ctx.input.productId]);
    },
  },
  {
    name: "email",
    handler: async (ctx) => {
      await sendEmail({
        to: ctx.input.email,
        subject: "Order confirmed",
        chargeId: ctx.results.charge.chargeId,
      });
    },
  },
]);

// trigger from any route or job
app.post("/checkout", async (req, res) => {
  const execution = await fw.trigger("checkout", {
    amount: req.body.amount,
    customerId: req.body.customerId,
    productId: req.body.productId,
    email: req.body.email,
  });
  res.json({ executionId: execution.id });
});
```

</details>

<details>
<summary><strong>Feature Flags</strong> — toggle features at runtime from the dashboard without redeploying</summary>

### The problem it solves

Changing a feature requires a redeploy. A redeploy takes time, has risk, and needs coordination. Feature flags decouple *shipping code* from *enabling features* — you merge and deploy the code with the flag off, then turn it on from the dashboard whenever you're ready, for whoever you want, at whatever percentage you want.

### How it works

Flags are stored in Postgres. When you call `fw.flag()`, it checks Redis first (fast). If there's a cache miss, it reads from Postgres and caches the result. This means flag changes from the dashboard propagate within the cache TTL (a few seconds), not on the next redeploy.

**Percentage rollouts** use a consistent hash of the `userId` so the same user always sees the same variant — they don't flip between old and new UI on every page reload.

### Flag types

- **Boolean** — on or off globally
- **Percentage rollout** — e.g. enable for 20% of users, gradually increase
- **User segment** — enable for users matching specific context fields (e.g. `{ plan: "pro" }`)

```ts
app.get("/checkout", async (req, res) => {
  // pass any context — userId is used for consistent rollout hashing
  const newCheckout = await fw.flag("new-checkout-flow", {
    userId: req.user.id,
    plan: req.user.plan,
    country: req.user.country,
  });

  if (newCheckout) {
    return res.json({ layout: "v2", features: ["express-pay", "saved-cards"] });
  }
  res.json({ layout: "v1" });
});
```

</details>

<details>
<summary><strong>Request Tracing</strong> — see exactly what happened inside every request and how long each part took</summary>

### The problem it solves

When a request is slow or fails, you have logs — but logs from 50 concurrent requests are jumbled together. You can't tell which log line belonged to which request, or what order things happened in. Request tracing solves this by giving every request a unique trace ID and recording a timeline of exactly what happened inside it.

### How it works

`fw.requestTracer` is a middleware that runs before your routes. It:
1. Assigns a UUID trace ID to the request and stores it in async local storage (so it's accessible anywhere in the call stack without passing it as a parameter)
2. Records the start time
3. On response, writes a trace record to Postgres with the path, method, status code, and total duration

Inside your handlers, `fw.trace("span-name", fn)` creates a *child span* — a timed sub-operation attached to the current request's trace. When you view the trace in the dashboard, you see a waterfall: the full request at the top, with each span shown as a bar underneath it.

`fw.query()` and `fw.fetch()` (see Auto-Instrumentation) create spans automatically, so you don't need to wrap every DB call manually.

```ts
app.use(fw.requestTracer); // must be first

app.get("/order/:id", async (req, res) => {
  // this creates a span named "load-order" in the current request's trace
  const order = await fw.trace("load-order", async () => {
    return db.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
  });

  // nest spans for sub-operations
  const enriched = await fw.trace("enrich-order", async () => {
    const user = await fw.trace("load-user", () => loadUser(order.userId));
    const items = await fw.trace("load-items", () => loadItems(order.id));
    return { ...order, user, items };
  });

  res.json(enriched);
});
```

</details>

<details>
<summary><strong>Error Reporting</strong> — capture errors with full context, group duplicates, and search from the dashboard</summary>

### The problem it solves

In production, errors are lost. PM2 restarts the process and the stack trace is gone. You find out from a user email. Even if you log errors, the same crash repeats hundreds of times and floods your logs — you lose signal in the noise.

Error reporting captures errors with their full stack trace and request context, stores them in Postgres, groups identical errors together (so you see "this error happened 847 times" not 847 separate entries), and makes them searchable from the dashboard.

### How it works

`fw.errorHandler` is a standard Express error middleware (4 parameters: `err, req, res, next`). Mount it *after* all your routes. Any error thrown in a route or passed to `next(err)` flows into it.

The error is fingerprinted (based on the error message and top stack frame) to group identical errors. A new occurrence increments the count rather than creating a new record.

`fw.captureError()` is for errors you catch yourself — background jobs, async operations outside Express, third-party webhooks. **Only use it for 5xx errors (server bugs).** Validation errors, 404s, and auth failures are not bugs — don't capture them.

```ts
app.use(fw.errorHandler); // last middleware — catches everything

// manual capture: background job that failed
async function processPayment(orderId: string) {
  try {
    await stripe.charges.create({ ... });
  } catch (err) {
    // capture with extra context to help with debugging
    fw.captureError(err, {
      source: "payment-worker",
      orderId,
      severity: "critical",
    });
    // decide whether to rethrow based on your retry logic
  }
}
```

</details>

<details>
<summary><strong>Caching</strong> — three caching layers: HTTP ETag, Redis response cache, and query cache with tag invalidation</summary>

### Why three layers?

Each layer caches at a different level of your stack and has different tradeoffs:

| Layer | Where it caches | Best for |
|---|---|---|
| HTTP ETag | Browser/CDN ↔ server | Semi-static data sent to the same client |
| Redis response | Server-side, per route | Expensive routes shared across many users |
| Query cache | Database query results | Frequent identical queries with infrequent writes |

### HTTP ETag cache

Computes a SHA1 hash of the response body and sends it as an `ETag` header. On subsequent requests, the client sends `If-None-Match: <etag>`. If it matches, the server returns `304 Not Modified` with no body — saving bandwidth and skipping serialization. No Redis needed.

```ts
app.get("/config", fw.httpCache(), getConfigHandler);
app.get("/config", fw.httpCache({ maxAge: 300 }), getConfigHandler); // also sets Cache-Control
```

### Redis response cache

Serializes the full response body to Redis with a TTL. The middleware intercepts the response, stores it under a key (default: the request path + query string, or a custom key function), and on the next request returns the stored value without calling your handler.

```ts
app.get("/products", fw.responseCache({ ttl: 60 }), getProductsHandler);

// custom key — different currencies get different cache entries
app.get("/prices", fw.responseCache({
  ttl: 30,
  key: (req) => `prices:${req.query.currency}`,
}), getPricesHandler);
```

### Query cache with tag invalidation

Caches the raw rows from a database query. You attach *tags* to each cache entry — logical names that group related queries. When you write to the database, you call `invalidate()` with the relevant tags, and all queries tagged with that name are deleted from Redis at once. This lets you use long TTLs without ever serving stale data after a write.

Under the hood, each tag maps to a Redis Set (`flowwatch:qtag:<tag>`) that stores all cache keys belonging to that tag. `invalidate()` reads the Set, deletes all the keys in it, then deletes the Set itself.

```ts
// reading — cache for 5 minutes, tag as "products"
const rows = await fw.queryCache.get(
  "SELECT * FROM products WHERE category = $1 ORDER BY name",
  ["electronics"],
  { ttl: 300, tags: ["products", "category:electronics"] }
);

// writing — invalidate the tag so the cache is immediately fresh
app.post("/products", async (req, res) => {
  await db.query("INSERT INTO products (...) VALUES (...)", [...]);
  await fw.queryCache.invalidate("products"); // all "products" cache entries gone
  res.json({ created: true });
});
```

</details>

<details>
<summary><strong>Full-Text Search</strong> — Postgres tsvector search with relevance ranking, no Elasticsearch needed</summary>

### What it is

Postgres has a powerful built-in full-text search engine. `tsvector` is a preprocessed representation of a document (it strips stop words, applies stemming), and `plainto_tsquery` converts a search string into a query that matches against it. `ts_rank` scores matches by relevance. This is good enough for most in-app search — searching your own articles, products, users, etc.

### How it works

`fw.search()` dynamically builds a SQL query that:
1. Concatenates the specified columns into a single text blob
2. Converts it to a `tsvector` at query time
3. Matches it against a `plainto_tsquery` of your search string
4. Ranks results by `ts_rank` (higher = more relevant)
5. Returns paginated rows + a total count for pagination controls

Table and column names are validated with a strict regex allowlist (`/^[a-zA-Z_][a-zA-Z0-9_]*$/`) before being interpolated into SQL. User-provided search text goes in as a parameterized value — no injection risk.

```ts
app.get("/search", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;

  const results = await fw.search({
    table: "articles",
    columns: ["title", "body", "tags"], // searched together
    query: req.query.q as string,
    limit,
    offset: (page - 1) * limit,
    language: "english", // affects stemming — "running" matches "run"
  });

  res.json({
    results: results.rows,
    total: results.total,
    pages: Math.ceil(results.total / limit),
  });
});
```

</details>

<details>
<summary><strong>Rate Limiting</strong> — Redis-backed request limiter per IP, user, or API key, with graceful degradation</summary>

### The problem it solves

Without rate limiting, a single client can hammer your server with thousands of requests per second — whether it's a bot, a misconfigured client, or an attacker. Rate limiting caps how many requests a given client can make in a time window.

### How it works

Uses a Redis `INCR` + `EXPIRE` pattern (atomic, no race conditions):
1. `INCR flowwatch:rl:ip:<client-ip>` — increments a counter, returns the new value
2. If the counter was just created (value = 1), sets it to expire after `windowSeconds`
3. If the counter exceeds `max`, returns `429 Too Many Requests` with a `Retry-After` header telling the client when to try again

**Graceful degradation:** if Redis is unavailable, the middleware calls `next()` and lets the request through rather than blocking your entire API. It never takes down your app because of a cache failure.

**Key strategies:**
- `"ip"` — limits per client IP. Good for public endpoints
- `"userId"` — limits per authenticated user (`req.user.id`). Good for authenticated APIs
- `"apiKey"` — limits per API key (`x-api-key` header). Good for developer APIs
- Custom function — limit by anything: `(req) => req.body.email` for login attempts per email

```ts
// base limit for all traffic
app.use(fw.rateLimit({ max: 500, windowSeconds: 60 }));

// tighter limit on login — prevent credential stuffing
app.post("/auth/login",
  fw.rateLimit({ max: 5, windowSeconds: 60, keyBy: "ip" }),
  loginHandler
);

// per-user limit for authenticated API
app.use("/api/v1",
  authenticate,
  fw.rateLimit({ max: 1000, windowSeconds: 60, keyBy: "userId" })
);

// custom key — limit by the target email being looked up (prevents user enumeration)
app.post("/auth/forgot-password",
  fw.rateLimit({
    max: 3,
    windowSeconds: 3600,
    keyBy: (req) => `forgot:${req.body.email}`,
  }),
  forgotPasswordHandler
);
```

</details>

<details>
<summary><strong>IP Filtering</strong> — CIDR-based allowlist and blocklist middleware</summary>

### What it is

IP filtering lets you control which IP addresses can reach certain routes. It works at the request level before any business logic runs, so blocked requests never touch your database or application code.

### How it works

Pure in-process CIDR matching — no external calls, no Redis. For each request:
- The client IP is extracted from `req.ip`
- The `::ffff:` prefix is stripped (Node.js adds this to IPv4 addresses when listening on a dual-stack IPv6 socket)
- The IP is tested against the allow/deny list using bitwise arithmetic on the 32-bit integer representation of the IPv4 address

**Allow mode** is a strict allowlist: *only* IPs on the list pass. Everything else gets `403`. Use this when you want to restrict access entirely to known sources (your office, a VPN, another service's IP range).

**Deny mode** is a blocklist: listed IPs get `403`, everyone else passes. Use this to block specific bad actors without restricting all other traffic.

Both modes can be combined on the same middleware call.

```ts
// restrict the admin panel to internal network and VPN only
app.use("/admin",
  fw.ipFilter({ allow: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"] }),
  adminRouter
);

// block a specific abusive IP range from your public API
app.use(fw.ipFilter({ deny: ["198.51.100.0/24"] }));

// allow only your payment provider's webhook IPs
app.post("/webhooks/stripe",
  fw.ipFilter({ allow: ["3.18.12.63", "3.130.192.231", "13.235.14.237"] }),
  stripeWebhookHandler
);
```

</details>

<details>
<summary><strong>API Versioning</strong> — version detection middleware and isolated version routers</summary>

### The problem it solves

When you make breaking API changes, existing clients break if you change the route they're calling. API versioning lets you run multiple versions of the same endpoint simultaneously — old clients keep calling v1, new clients call v2 — and you retire old versions only when you're ready.

### How it works

**`fw.versionMiddleware()`** reads the API version from either:
- A request header (default: `api-version`, configurable via `header` option)
- A query parameter (`?version=2`)

It parses the value to an integer and sets `req.apiVersion`. If neither is present, it uses `defaultVersion` (default: `1`). This runs on every request so you always know what version the client wants.

**`fw.version()`** returns a plain Express `Router`. You create one per version, register routes on each, and mount them at versioned path prefixes. The routers are fully independent — a route registered on v1 is never called by a v2 request.

```ts
// detect version on all requests
app.use(fw.versionMiddleware({ defaultVersion: 1, header: "api-version" }));

// create isolated routers per version
const v1 = fw.version();
const v2 = fw.version();

// v1 returns a flat user object
v1.get("/users/:id", async (req, res) => {
  const user = await db.query("SELECT id, name, email FROM users WHERE id = $1", [req.params.id]);
  res.json(user.rows[0]);
});

// v2 returns a richer user object with nested profile
v2.get("/users/:id", async (req, res) => {
  const user = await db.query("SELECT u.*, p.* FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = $1", [req.params.id]);
  res.json({ user: user.rows[0] });
});

app.use("/v1", v1);
app.use("/v2", v2);
```

</details>

<details>
<summary><strong>Bulkhead Isolation</strong> — cap concurrent calls to slow dependencies so one bottleneck can't exhaust your entire server</summary>

### The problem it solves

Named after the watertight compartments in a ship's hull. If one compartment floods, the bulkhead walls stop it from sinking the whole ship. In backend systems: if your database is slow and every incoming request starts a DB query, you end up with hundreds of open connections waiting. Eventually your server runs out of threads/memory and crashes entirely — even routes that don't use the database stop responding.

A bulkhead caps how many concurrent calls to a slow resource are allowed at any one time. Excess calls queue up briefly or fail fast, instead of piling up indefinitely.

### How it works

The bulkhead is a semaphore — an `active` counter and a `pending` queue of resolve functions.

- If `active < limit`: increment `active`, run `fn()`, decrement `active` when done, wake up the next pending caller
- If `active >= limit` and `pending.length < queue`: add a Promise resolver to the pending queue and wait
- If both are full: throw immediately with `"Bulkhead full"`

The `active` and `queued` properties let you monitor pressure in real time — you can expose them as metrics or log them when they're high.

```ts
// create one bulkhead per resource type — not per request
const dbBulkhead    = fw.bulkhead({ limit: 20, queue: 50 });
const paymentBulkhead = fw.bulkhead({ limit: 5,  queue: 10 });

app.get("/reports", async (req, res) => {
  try {
    const result = await dbBulkhead.execute(() => runExpensiveReport(req.query));
    res.json(result);
  } catch (err) {
    if (err.message.includes("Bulkhead full")) {
      res.status(503).json({ error: "Server is at capacity, please retry in a moment." });
    } else {
      throw err;
    }
  }
});

// monitor pressure
setInterval(() => {
  if (dbBulkhead.active > 15) {
    logger.warn({ active: dbBulkhead.active, queued: dbBulkhead.queued }, "DB bulkhead under pressure");
  }
}, 5000);
```

</details>

<details>
<summary><strong>Circuit Breaker</strong> — stop sending requests to a failing dependency and give it time to recover</summary>

### The problem it solves

If an external service (payment provider, email API, third-party data source) starts failing, your code will keep retrying — which hammers the already-struggling service and ties up your own threads waiting for timeouts. A circuit breaker detects repeated failures and "opens" — subsequent calls fail immediately without even attempting the request. After a cooldown period it allows one test request through to check if the service has recovered.

### The three states

- **CLOSED** (normal): all calls go through. If failures exceed `threshold` within a window, the breaker opens
- **OPEN** (blocking): all calls fail immediately with an error, no network attempt made. After `timeout` ms, moves to HALF_OPEN
- **HALF_OPEN** (testing): the next single call is allowed through. If it succeeds, the breaker closes. If it fails, it opens again

### How to use it

```ts
// one breaker per external service
const stripeBreaker    = fw.circuitBreaker({ threshold: 3, timeout: 15_000 });
const sendgridBreaker  = fw.circuitBreaker({ threshold: 5, timeout: 30_000 });

app.post("/checkout", async (req, res) => {
  try {
    const charge = await stripeBreaker.execute(() =>
      stripe.charges.create({ amount: req.body.amount, customer: req.body.customerId })
    );
    res.json({ chargeId: charge.id });
  } catch (err) {
    if (err.message === "Circuit open") {
      // don't even try — tell the user to retry later
      res.status(503).json({
        error: "Payment service is temporarily unavailable. Please try again in a minute.",
      });
    } else {
      throw err; // real error — let the error handler deal with it
    }
  }
});
```

</details>

<details>
<summary><strong>WebSockets</strong> — real-time bidirectional communication attached to your existing HTTP server</summary>

### What it is

WebSockets allow persistent, bidirectional connections between browser and server. Unlike HTTP, where the client always initiates and the server always responds, WebSockets let the server push data to clients at any time. Use this for live dashboards, notifications, collaborative features, chat, real-time game state, etc.

### How it works

`fw.websocket()` wraps the `ws` library and attaches a `WebSocketServer` to your existing Node.js `http.Server` — no separate port needed. The WebSocket path defaults to `/ws` but is configurable.

`ws.broadcast()` sends a message to every currently connected client whose `readyState` is `OPEN`. It skips clients that are connecting or closing.

**Important:** use `http.createServer(app)` instead of `app.listen()` so you have access to the raw server object to pass to `fw.websocket()`.

```ts
import http from "http";

const server = http.createServer(app);
const ws = fw.websocket(server, "/ws");

// handle incoming messages
ws.server.on("connection", (socket, req) => {
  const userId = parseUserFromCookie(req.headers.cookie);

  socket.send(JSON.stringify({ type: "connected", userId }));

  socket.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());

    if (msg.type === "chat") {
      // broadcast to everyone — including the sender
      ws.broadcast(JSON.stringify({ type: "chat", from: userId, text: msg.text }));
    }
  });

  socket.on("close", () => {
    ws.broadcast(JSON.stringify({ type: "user-left", userId }));
  });
});

// push events to all clients from anywhere in your app
fw.events.on("order:shipped", (order) => {
  ws.broadcast(JSON.stringify({ type: "order-update", orderId: order.id, status: "shipped" }));
});

server.listen(3000);
```

</details>

<details>
<summary><strong>CRON Scheduler</strong> — recurring background jobs defined in code, backed by BullMQ and Redis</summary>

### What it is

A CRON scheduler lets you run code on a schedule — every hour, every day at midnight, every Monday, etc. Instead of running a separate cron container or relying on system cron, you define jobs in your application code and they run inside your Node.js process.

### How it works

Jobs are registered with a name, a standard cron expression, and an async handler function. Under the hood they're stored as BullMQ repeatable jobs in Redis. This means:
- Jobs persist across restarts — if your server restarts, Redis still knows the job is due
- Deduplication — if multiple instances of your app are running, only one worker picks up each scheduled job execution
- Failure handling — if a job throws, it's retried with backoff

```ts
// standard 5-field cron: minute hour day-of-month month day-of-week

// run at 3am every day — clean up expired sessions
fw.cron("cleanup-sessions", "0 3 * * *", async () => {
  const result = await db.query(
    "DELETE FROM sessions WHERE expires_at < NOW() RETURNING id"
  );
  logger.info({ deleted: result.rowCount }, "Cleaned up expired sessions");
});

// run every hour — sync exchange rates from external API
fw.cron("sync-exchange-rates", "0 * * * *", async () => {
  const rates = await fetch("https://api.exchangerate.host/latest").then(r => r.json());
  await db.query("INSERT INTO exchange_rates (currency, rate, fetched_at) VALUES ...", [...]);
});

// run every Monday at 9am — weekly digest emails
fw.cron("weekly-digest", "0 9 * * 1", async () => {
  const { rows: users } = await db.query("SELECT * FROM users WHERE digest_enabled = true");
  for (const user of users) {
    await sendWeeklyDigest(user);
  }
});
```

</details>

<details>
<summary><strong>Outbound Webhooks</strong> — deliver signed events to external URLs with automatic retries and delivery logs</summary>

### What it is

Outbound webhooks let external services subscribe to events from your app. When something happens in your system (an order is placed, a payment succeeds, a user is created), you deliver a signed HTTP POST to the subscriber's URL. If delivery fails (their server is down, times out, returns a 5xx), you retry automatically with exponential backoff.

### How it works

- `fw.webhook.register()` stores a webhook subscription in Postgres (URL, which events it listens for, a shared secret for signing)
- `fw.webhook.deliver()` writes a pending delivery to Postgres and enqueues a BullMQ job
- The worker makes the HTTP POST with an `X-Flowwatch-Signature` header (HMAC-SHA256 of the payload using the subscription's secret)
- If the delivery fails, it retries with exponential backoff up to a max attempt count
- All delivery attempts (success or failure) are logged in Postgres and viewable in the dashboard

Subscribers verify the signature on their end to confirm the request came from you and wasn't tampered with.

```ts
// register a subscription (typically done by the subscriber via your API)
app.post("/webhooks/subscribe", async (req, res) => {
  const subscription = await fw.webhook.register({
    url: req.body.url,
    events: req.body.events,      // e.g. ["order.created", "order.shipped"]
    secret: crypto.randomBytes(32).toString("hex"),
  });
  res.json({ id: subscription.id, secret: subscription.secret });
});

// deliver events from your business logic
app.post("/orders", async (req, res) => {
  const order = await createOrder(req.body);

  // fire-and-forget — delivery happens in background with retries
  await fw.webhook.deliver("order.created", {
    orderId: order.id,
    customerId: order.customerId,
    total: order.total,
    items: order.items,
  });

  res.status(201).json(order);
});
```

</details>

<details>
<summary><strong>Prometheus Metrics</strong> — expose /metrics for scraping and record custom application metrics</summary>

### What it is

Prometheus is the industry standard for collecting and querying metrics from backend services. It scrapes a `/metrics` endpoint on your service at regular intervals and stores time-series data. You can then graph it in Grafana, set up alerts, and track trends over time.

### What's included by default

When you expose `fw.metrics.handler`, it automatically includes:
- `process_cpu_seconds_total` — CPU usage
- `process_resident_memory_bytes` — memory usage
- `nodejs_eventloop_lag_seconds` — event loop lag (a key indicator of being overloaded)
- `nodejs_active_handles_total`, `nodejs_active_requests_total`
- HTTP request duration histograms (if you integrate with the request tracer)

### Custom metrics

```ts
// expose the /metrics endpoint
app.get("/metrics", fw.metrics.handler);

// counter — a value that only goes up (requests, errors, events)
const ordersCreated = fw.metrics.counter("orders_created_total");
const paymentErrors  = fw.metrics.counter("payment_errors_total");

// histogram — records distributions (response times, payload sizes)
const paymentDuration  = fw.metrics.histogram("payment_duration_seconds");
const responseBodySize = fw.metrics.histogram("response_body_size_bytes");

app.post("/checkout", async (req, res) => {
  const start = Date.now();
  try {
    const result = await processPayment(req.body);
    ordersCreated.inc();
    paymentDuration.observe((Date.now() - start) / 1000);
    res.json(result);
  } catch (err) {
    paymentErrors.inc();
    throw err;
  }
});
```

</details>

<details>
<summary><strong>Structured Log Store</strong> — write JSON logs to Postgres and query them programmatically or from the dashboard</summary>

### The problem it solves

`console.log` output goes to stdout and disappears when the process restarts. Third-party log services (Datadog, Papertrail, Logtail) cost money and send your data off your infrastructure. The log store writes structured JSON logs to your own Postgres database so they're queryable, filterable, and persistent — without any external service.

### How it works

Flowwatch uses a [Pino](https://getpino.io/) logger internally. The log store adds a writable stream to Pino's multistream output — logs are written to both stdout (for your terminal/PM2) and to the `flowwatch_logs` Postgres table simultaneously. The table has a GIN index on the `message` column for fast text search.

Logs are queryable by level (`debug`, `info`, `warn`, `error`), time range, and message text.

```ts
// the Flowwatch internal logger writes here automatically
// you can also query logs from your own code:

app.get("/admin/logs", requireAdmin, async (req, res) => {
  const logs = await fw.logs.query({
    level: req.query.level as string,     // filter by level
    from: new Date(req.query.from as string),
    to: new Date(req.query.to as string),
    limit: 100,
  });
  res.json(logs);
});

// search the last hour of errors for a specific message
const recentErrors = await fw.logs.query({
  level: "error",
  from: new Date(Date.now() - 3_600_000),
  limit: 50,
});
```

</details>

<details>
<summary><strong>Auto-Instrumented Query & Fetch</strong> — DB queries and HTTP calls automatically appear as trace spans, no manual wrapping needed</summary>

### The problem it solves

`fw.trace("span-name", fn)` works but requires you to manually wrap every database call and outbound HTTP request. It's easy to forget, and retrofitting it across an existing codebase is tedious. Auto-instrumentation solves this by giving you drop-in replacements that look identical to the standard APIs but automatically record spans.

### How it works

`fw.query()` is a thin wrapper around `pool.query()`. It reads the current trace ID from async local storage (set by `fw.requestTracer`), records the start time, runs the query, and writes a span to the trace with the SQL statement and duration. If there's no active trace, it just runs the query normally.

`fw.fetch()` does the same for outbound HTTP — it wraps the global `fetch` API and records a span with the URL, method, and response status.

```ts
// BEFORE — no tracing
const { rows } = await pool.query("SELECT * FROM orders WHERE user_id = $1", [userId]);
const stripeData = await fetch("https://api.stripe.com/v1/customers/" + customerId);

// AFTER — identical API, automatic trace spans
const { rows } = await fw.query("SELECT * FROM orders WHERE user_id = $1", [userId]);
const stripeData = await fw.fetch("https://api.stripe.com/v1/customers/" + customerId);
```

Both calls appear in the dashboard waterfall under their parent request trace — you can see exactly how long each DB query and external API call took without changing anything else about your code.

</details>

<details>
<summary><strong>Internal Event Bus</strong> — decouple modules with in-process publish/subscribe events</summary>

### The problem it solves

As your app grows, modules start depending on each other directly. Your order module calls your notification module, which calls your analytics module, which calls your billing module. This creates tight coupling — changing one module requires changing all its callers. An event bus inverts this: the order module emits `"order:created"` and doesn't know or care who's listening. The notification module, analytics module, and billing module each subscribe independently.

### How it works

`fw.events` is a thin wrapper around Node.js's built-in `EventEmitter`. It has zero overhead and synchronous dispatch — when you emit an event, all listeners run before `emit()` returns. This is intentional: it keeps the flow predictable. If you need async listeners, make the listener function async and handle it yourself.

```ts
// order.service.ts — emits events, knows nothing about who listens
async function createOrder(data) {
  const order = await db.query("INSERT INTO orders ...", [...]);
  fw.events.emit("order:created", { orderId: order.id, userId: data.userId, total: data.total });
  return order;
}

// notifications.service.ts — listens, knows nothing about order internals
fw.events.on("order:created", async ({ orderId, userId }) => {
  const user = await loadUser(userId);
  await sendEmail(user.email, `Order ${orderId} confirmed!`);
});

// analytics.service.ts — also listens independently
fw.events.on("order:created", ({ total, userId }) => {
  analytics.track(userId, "Order Placed", { revenue: total });
});

// one-time listeners
fw.events.once("user:first-order", async ({ userId }) => {
  await sendWelcomeSeries(userId); // runs only for the user's first order ever
});
```

</details>

<details>
<summary><strong>Server-Sent Events</strong> — push updates from server to browser over a plain HTTP connection</summary>

### SSE vs WebSockets

| | SSE | WebSocket |
|---|---|---|
| Direction | Server → client only | Bidirectional |
| Protocol | Plain HTTP | Custom upgrade |
| Browser support | Native `EventSource` API | Native `WebSocket` API |
| Proxy/load balancer support | Better (it's just HTTP) | Can require special config |
| Reconnect | Automatic | Manual |
| Use when | You need to push updates to browser | You need two-way communication |

Use SSE for: live dashboards, notification feeds, progress bars for long-running tasks, order status updates. Use WebSockets when the client also needs to send messages.

### How it works

`createSseConnection()` sets the correct headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`), calls `res.flushHeaders()` to start streaming immediately, and returns an object with a `send()` method and an `onClose()` callback.

```ts
import { createSseConnection } from "@pranshulsoni/flowwatch";

// client subscribes to live order updates
app.get("/orders/:id/stream", authenticate, async (req, res) => {
  const sse = createSseConnection(req, res);

  // send current state immediately on connection
  const order = await db.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
  sse.send({ type: "order-state", order: order.rows[0] });

  // listen for updates and push them
  const listener = (update) => {
    if (update.orderId === req.params.id) {
      sse.send({ type: "order-update", status: update.status });
    }
  };
  fw.events.on("order:updated", listener);

  // clean up when client disconnects
  sse.onClose(() => {
    fw.events.off("order:updated", listener);
  });
});
```

On the client:

```js
const source = new EventSource("/orders/ord_123/stream");
source.onmessage = (e) => {
  const data = JSON.parse(e.data);
  updateOrderStatus(data);
};
```

</details>

<details>
<summary><strong>Testing Utilities</strong> — drop-in mocks for Postgres Pool and Redis so you can unit test without real infrastructure</summary>

### What it is

Writing unit tests for code that uses `pool.query()` or `redis.get()` normally requires either a real database (slow, brittle) or a mocking library with complex setup. `createMockPool` and `createMockRedis` are zero-dependency, in-process fakes that match the real APIs closely enough to test your code without any external services.

### `createMockPool(rows)`

Returns an object shaped like a `pg.Pool`. Every call to `.query()` resolves with the rows you passed to `createMockPool`. Pass different row arrays for different tests. If you need different responses for different queries in the same test, create multiple pools or use a spy library on top.

### `createMockRedis()`

Returns an object shaped like an `ioredis.Redis`. It has a real in-memory `Map` and `Set` store, so get/set/incr/sadd/smembers all behave correctly. It does NOT simulate TTLs (expire/pttl return fixed values) — for TTL-sensitive tests, use a real Redis instance.

**Supported methods:** `get`, `set`, `setex`, `del`, `incr`, `sadd`, `smembers`, `expire`, `pttl`

```ts
import { createMockPool, createMockRedis } from "@pranshulsoni/flowwatch";
import { createQueryCache } from "@pranshulsoni/flowwatch";

describe("queryCache", () => {
  it("returns cached rows on second call", async () => {
    const pool  = createMockPool([{ id: 1, name: "Widget" }]);
    const redis = createMockRedis();
    const cache = createQueryCache(pool, redis);

    const first  = await cache.get("SELECT * FROM products", [], { ttl: 60, tags: ["products"] });
    const second = await cache.get("SELECT * FROM products", [], { ttl: 60, tags: ["products"] });

    expect(first).toEqual(second);  // second call hits Redis, not Postgres
  });

  it("invalidates by tag", async () => {
    const pool  = createMockPool([{ id: 1, name: "Widget" }]);
    const redis = createMockRedis();
    const cache = createQueryCache(pool, redis);

    await cache.get("SELECT * FROM products", [], { ttl: 60, tags: ["products"] });
    await cache.invalidate("products");

    const cachedValue = await redis.get("products");
    expect(cachedValue).toBeNull();
  });
});
```

</details>

<details>
<summary><strong>Migration Rollback</strong> — undo the last applied database migration in a single call</summary>

### What it is

Database migrations normally only go forward. But in development and CI you often need to undo a migration — if you made a mistake in the schema, if you're testing the migration itself, or if you need to reset a staging environment. `rollbackLastMigration()` runs the `down` SQL of the most recently applied migration inside a transaction, then removes its record from the `flowwatch_migrations` table.

### How it works

Each migration in `migrations.ts` can have an optional `down` property containing the SQL to reverse it. `rollbackLastMigration()`:

1. Acquires a Postgres advisory lock (so concurrent rollbacks don't interfere)
2. Queries `flowwatch_migrations ORDER BY id DESC LIMIT 1` to find the last applied migration
3. Looks up the corresponding migration object and checks for a `down` script
4. Runs the `down` SQL and the `DELETE FROM flowwatch_migrations` in a single transaction — either both succeed or neither does

```ts
// in a management script or CLI
await fw.rollbackMigration();

// or expose it as an internal API endpoint (protect this!)
app.post("/internal/db/rollback", requireInternalAuth, async (req, res) => {
  await fw.rollbackMigration();
  res.json({ rolledBack: true });
});
```

</details>

<details>
<summary><strong>Multi-Language Sidecar</strong> — use Flowwatch from Python, Go, or Rust via a local HTTP API</summary>

### The problem it solves

Flowwatch is a Node.js package. If your backend is in Python, Go, or Rust, you can't import it directly. The sidecar pattern solves this: you run a tiny Express server alongside your main app that exposes Flowwatch's core features (flags, workflows, tracing, errors) as a simple JSON HTTP API. Your non-Node service calls localhost, not an external SaaS.

### How it works

`startSidecar(fw, { port, token })` starts a second HTTP server on a different port inside the same Node.js process. It exposes endpoints like `POST /api/flag`, `POST /api/trigger`, `POST /api/trace-span`, and `POST /api/capture-error`. The `token` option enables bearer token auth — any request without the correct `Authorization` header is rejected.

The Python, Go, and Rust client SDKs wrap these endpoints so you write idiomatic code in your language and don't have to construct HTTP calls yourself.

```ts
// in your Node.js app
import { startSidecar } from "@pranshulsoni/flowwatch";

startSidecar(fw, {
  port: 9400,
  token: process.env.SIDECAR_TOKEN, // set the same value in your Python/Go/Rust env
});
```

See the [Client SDKs](#client-sdks) section below for usage in each language.

</details>

<details>
<summary><strong>AI Diagnostics</strong> — automated incident analysis and a chat interface that knows your actual trace and error data</summary>

### What it is

The AI diagnostics feature connects Flowwatch to the [Groq](https://groq.com) inference API (fast, free tier available) and adds two capabilities to the dashboard:

1. **Automated incident analysis** — when a spike in errors or slow traces is detected, the AI is given the actual trace data and error messages and asked to explain what happened and suggest fixes. You see a plain English summary instead of raw stack traces.

2. **Chat interface** — a chat window in the dashboard where you can ask questions about your own data. "Why was the API slow between 2pm and 3pm?" gives you an answer based on the actual traces from that window, not generic advice.

### What it doesn't do

It doesn't send your data to OpenAI or any third-party that stores it. Groq processes the request and returns a response — it's stateless inference, not training data. Your Postgres data stays in your Postgres.

```ts
const fw = await createFlowwatch({
  db: { connectionString: process.env.DATABASE_URL },
  // add a Groq API key — free at console.groq.com
  ai: { groqApiKey: process.env.GROQ_API_KEY },
});

// that's it — the dashboard /ops page now has AI chat enabled
app.use("/ops", fw.dashboard);
```

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
