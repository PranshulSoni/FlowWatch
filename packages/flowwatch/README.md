<h1 align="center">
  <img src="https://raw.githubusercontent.com/PranshulSoni/FlowWatch/main/assets/logo.png?v=6" alt="Flowwatch Logo" width="450" />
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@pranshulsoni/flowwatch"><img src="https://img.shields.io/npm/v/@pranshulsoni/flowwatch?label=npm&color=CB3837&logo=npm&logoColor=white" alt="npm version" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/@pranshulsoni/flowwatch"><img src="https://img.shields.io/npm/dw/@pranshulsoni/flowwatch?label=npm%20downloads%2Fweek&color=CB3837" alt="npm weekly downloads" /></a>
  &nbsp;
  <a href="https://pypi.org/project/flowwatch-client/"><img src="https://static.pepy.tech/badge/flowwatch-client" alt="PyPI downloads" /></a>
  &nbsp;
  <a href="https://crates.io/crates/flowwatch-client"><img src="https://img.shields.io/crates/d/flowwatch-client?label=cargo%20installs&color=DEA584&logo=rust&logoColor=white" alt="cargo installs" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/@pranshulsoni/flowwatch"><img src="https://img.shields.io/npm/l/@pranshulsoni/flowwatch.svg" alt="license" /></a>
</p>

<p align="center">
  <strong>One npm package. Everything your Express backend needs to run in production — also works on every server.</strong>
</p>

<p align="center">
  Durable workflows · Feature flags · Request tracing · Error capture · Rate limiting · Caching · Auth · WebSockets · Metrics · Webhooks · CRON · Circuit breakers · and more — all backed by <em>your</em> Postgres and Redis.
</p>

<p align="center">
  No SaaS. No monthly bill. No third-party cloud. Your data stays yours.
</p>

---

## The Problem

Building a production backend means assembling a stack of separate SaaS products — each with its own billing, API, account, and integration work:

| What you need | What you'd normally use |
|---|---|
| Feature flags | LaunchDarkly, Unleash |
| Background jobs | Quirrel, Inngest, Trigger.dev |
| Request tracing | Datadog APM, Honeycomb |
| Error monitoring | Sentry, Rollbar |
| Rate limiting | Upstash, custom Redis code |
| Auth | Auth0, Clerk |
| Metrics | Grafana Cloud, Datadog |
| Log aggregation | Logtail, Papertrail |
| Webhooks | Svix |
| CRON | Cron-job.org, Railway CRON |

That's 10 separate accounts, 10 SDKs to install, 10 things to break, and hundreds of dollars per month — before your app has a single user.

**FlowWatch replaces all of them.** It's a single npm package that plugs into your existing Express app and gives you every one of those capabilities, backed by your own Postgres and Redis. No external services required. No data leaving your infrastructure.

```
Before FlowWatch:    your app → LaunchDarkly → Sentry → Datadog → Inngest → Auth0 → Svix → ...
After FlowWatch:     your app → fw.*  (backed by your Postgres + Redis)
```

---

## What is FlowWatch?

FlowWatch is a **single npm package** you add to an existing Express app. After a one-time setup call, you get `fw.*` — a set of production-ready helpers that cover almost everything you'd normally reach for a separate SaaS product to handle.

```
Your Express App
      │
      └── createFlowwatch(config) ──→ fw.*
                │
                ├── fw.requestTracer       (request ID + tracing)
                ├── fw.auth.protect        (JWT auth from @pranshulsoni/authapi)
                ├── fw.rateLimit(opts)     (Redis-backed, 3 algorithms)
                ├── fw.workflow(...)        (durable multi-step jobs)
                ├── fw.flag(name, ctx)     (feature flags with rollouts)
                ├── fw.circuitBreaker(...)  (stop hammering failing deps)
                ├── fw.metrics.handler     (Prometheus /metrics)
                ├── fw.dashboard           (built-in admin UI)
                └── ... 20+ more
```

**Postgres** is the only required dependency. Redis, Elasticsearch, and Auth are optional — each degrades gracefully if not configured.

---

## Installation

**FlowWatch is a Node.js / TypeScript package.** The core is on npm:

```bash
npm install @pranshulsoni/flowwatch
```

If your backend is in Python, Go, or Rust, you still install the npm package on a Node.js sidecar, then use the matching thin client SDK in your language. [Jump to Client SDKs →](#client-sdks)

| Platform | Package | Install |
|---|---|---|
| **Node.js / TypeScript** | [`@pranshulsoni/flowwatch`](https://www.npmjs.com/package/@pranshulsoni/flowwatch) | `npm install @pranshulsoni/flowwatch` |
| **Python** | `flowwatch-client` | `pip install flowwatch-client` |
| **Go** | `github.com/PranshulSoni/flowwatch-go` | `go get github.com/PranshulSoni/flowwatch-go` |
| **Rust** | `flowwatch-client` | `flowwatch-client = "3.0"` in Cargo.toml |

> **Python / Go / Rust:** These are thin HTTP clients. They don't connect to Postgres or Redis directly — they talk to a sidecar HTTP server that you run alongside your app from the npm package. See [Multi-Language Sidecar](#multi-language-sidecar) for setup.

---

## Getting Started (Node.js)

```bash
npm install @pranshulsoni/flowwatch
```

```ts
import express from "express";
import { createFlowwatch } from "@pranshulsoni/flowwatch";

const app = express();

const fw = await createFlowwatch({
  // Required
  db: { connectionString: process.env.DATABASE_URL },

  // Optional — each degrades gracefully if absent
  redis: { url: process.env.REDIS_URL },
  elasticsearch: { node: process.env.ELASTICSEARCH_URL },

  // Auto-run pending DB migrations on startup
  migrations: { autoRun: true },

  // Auth (uses @pranshulsoni/authapi under the hood)
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    email: { provider: "resend", apiKey: process.env.EMAIL_KEY!, from: "noreply@yourapp.com" },
  },

  // Security, body parsing, timeouts
  security: { headers: true },       // helmet defaults
  server: { bodyLimit: "1mb", timeout: 30_000 },

  runtime: { serviceName: "my-api", environment: "production" },
});

// Mount in this order:
app.use(fw.securityHeaders);         // helmet — first
app.use(fw.bodyParser);              // JSON + URL-encoded body parsing
app.use(fw.requestTracer);           // assigns a trace ID to every request
app.use(fw.timeout());               // returns 503 if a handler hangs

// Mount your routes
app.post("/auth/login", fw.auth!.router);
app.get("/dashboard", fw.auth!.protect, yourHandler);

// Admin UI at /ops
app.use("/ops", fw.dashboard);

// Error handler — always last
app.use(fw.errorHandler);

app.listen(3000);

process.on("SIGTERM", async () => {
  await fw.close(); // gracefully drains all connections
  process.exit(0);
});
```

That's it. Flowwatch runs `migrations: { autoRun: true }` and creates all the tables it needs on first start.

---

## What's included

<details>
<summary><strong>Auth</strong> — JWT sessions, email verification, password reset, Google OAuth</summary>

### What it is

FlowWatch wires in [`@pranshulsoni/authapi`](https://github.com/PranshulSoni/AuthAPI) — a separate package that handles the full authentication lifecycle. You get a ready-made Express router with login, register, email verification, password reset, and Google OAuth endpoints. You don't write any of that code.

### What you need

- `auth.jwtSecret` — used to sign and verify JWT tokens
- `auth.email` — (optional) nodemailer-compatible config for verification/reset emails
- `auth.oauth.google` — (optional) Google OAuth credentials

### Steps

**1. Add auth config to createFlowwatch:**

```ts
const fw = await createFlowwatch({
  db: { connectionString: process.env.DATABASE_URL },
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    accessTokenExpiry: "15m",   // default
    refreshTokenExpiry: "7d",   // default
    email: {
      provider: "resend",
      apiKey: process.env.RESEND_API_KEY!,
      from: "noreply@yourapp.com",
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackUrl: "http://localhost:3000/auth/google/callback",
      },
    },
    urls: {
      apiBaseUrl: "http://localhost:3000",
      frontendBaseUrl: "http://localhost:5173",
    },
  },
});
```

**2. Mount the auth router:**

```ts
// All auth endpoints live here:
// POST /auth/register
// POST /auth/login
// POST /auth/logout
// POST /auth/refresh
// GET  /auth/verify-email?token=...
// POST /auth/forgot-password
// POST /auth/reset-password
// GET  /auth/google  (OAuth redirect)
// GET  /auth/google/callback
app.use("/auth", fw.auth!.router);
```

**3. Protect routes:**

```ts
// Requires a valid JWT Bearer token
app.get("/me", fw.auth!.protect, (req, res) => {
  res.json(req.user);
});

// Requires a specific role
app.delete("/admin/users/:id",
  fw.auth!.protect,
  fw.auth!.requireRole("admin"),
  deleteUserHandler
);

// Requires the user to have verified their email
app.post("/checkout",
  fw.auth!.protect,
  fw.auth!.requireVerifiedEmail,
  checkoutHandler
);
```

### What `fw.auth` is when not configured

`fw.auth` is `undefined` if you don't pass an `auth` block to `createFlowwatch`. This is intentional — auth is opt-in. TypeScript will tell you if you try to use it without configuring it.

</details>

<details>
<summary><strong>Security Headers</strong> — helmet middleware with a single config toggle</summary>

### What it is

`fw.securityHeaders` applies [Helmet](https://helmetjs.github.io/) — a collection of HTTP security headers (CSP, HSTS, X-Frame-Options, etc.). Mount it before any other middleware.

### Steps

```ts
// in createFlowwatch config:
security: {
  headers: true,              // use helmet defaults (recommended)
  // headers: false,          // disable entirely (e.g. behind a proxy that sets its own)
  // headers: { ... },        // pass custom helmet options
}

// mount it:
app.use(fw.securityHeaders);  // must be before bodyParser and routes
```

</details>

<details>
<summary><strong>Body Parser</strong> — JSON + URL-encoded bodies with a size limit</summary>

### What it is

`fw.bodyParser` parses JSON and URL-encoded request bodies and enforces a configurable size limit. It replaces `express.json()` + `express.urlencoded()`.

### Steps

```ts
// in createFlowwatch config:
server: {
  bodyLimit: "1mb",    // default — applies to both JSON and form bodies
}

// mount it:
app.use(fw.bodyParser);
```

Requests exceeding the size limit are rejected with `413 Payload Too Large` before they reach your routes.

</details>

<details>
<summary><strong>Request Timeout</strong> — returns 503 if a handler doesn't respond within a time limit</summary>

### What it is

`fw.timeout(ms?)` starts a timer when a request arrives. If the response isn't sent before the timer fires, it sends `503 Service Unavailable` and captures the timeout as an error.

### Steps

```ts
// in createFlowwatch config (sets the default):
server: {
  timeout: 30_000,   // 30 seconds default
}

// apply globally with the default:
app.use(fw.timeout());

// override per-route:
app.get("/reports", fw.timeout(120_000), generateReportHandler);  // 2 min for slow reports
app.post("/quick",  fw.timeout(5_000),   quickHandler);           // 5 sec for fast endpoints
```

</details>

<details>
<summary><strong>Maintenance Mode</strong> — block all traffic with a 503 when you need to take the app offline</summary>

### What it is

`fw.maintenanceMode(isEnabled)` accepts a function that returns `true/false` (or a Promise). If it returns `true`, all requests get `503 Service Unavailable` with a `Retry-After: 60` header. Otherwise the request passes through normally.

### Steps

```ts
// simplest: toggle with an environment variable
app.use(fw.maintenanceMode(() => process.env.MAINTENANCE === "true"));

// more powerful: use a feature flag so you can toggle from the dashboard
app.use(fw.maintenanceMode(async () => {
  return fw.flag("maintenance-mode", {});
}));
```

</details>

<details>
<summary><strong>Dead Letter Queue (DLQ)</strong> — inspect and retry permanently failed background jobs</summary>

### What it is

When a workflow job fails all its retries, BullMQ moves it to the failed jobs list. `fw.dlq` lets you inspect those jobs and retry them without restarting your app.

### Steps

```ts
// list failed jobs
app.get("/admin/dlq", requireAdmin, async (req, res) => {
  const failed = await fw.dlq.getFailedJobs(50);  // limit optional, default 100
  res.json(failed);
});

// retry a specific job by its BullMQ job ID
app.post("/admin/dlq/:jobId/retry", requireAdmin, async (req, res) => {
  await fw.dlq.requeueJob(req.params.jobId);
  res.json({ requeued: true });
});
```

`fw.dlq.getFailedJobs` and `fw.dlq.requeueJob` both return a resolved empty result if the workflow queue is unavailable (Redis not connected).

</details>

<details>
<summary><strong>Structured Logger</strong> — Pino logger wired to both stdout and your Postgres log store</summary>

### What it is

`fw.logger` is a [Pino](https://getpino.io/) logger scoped to your app. It writes to stdout (visible in your terminal / PM2 / Docker logs) and simultaneously to the `flowwatch_logs` Postgres table, which you can query from the dashboard or via `fw.logs.query()`.

### Steps

```ts
// use it anywhere in your app — no import needed after createFlowwatch
fw.logger.info({ orderId: "ord_123" }, "Order created");
fw.logger.warn({ userId: req.user.id }, "Suspicious login attempt");
fw.logger.error({ err }, "Payment failed");

// control log level via environment variable:
// LOG_LEVEL=debug  → verbose
// LOG_LEVEL=warn   → warnings and errors only
```

`fw.logger` vs the module-level `logger` import: `fw.logger` is the instance logger (writes to Postgres). The module-level `logger` is only used internally by Flowwatch for startup warnings. Use `fw.logger` in your app code.

</details>

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

### Steps

```ts
// mount it anywhere — protect it with your auth middleware first
app.use("/ops", fw.auth!.protect, fw.auth!.requireRole("admin"), fw.dashboard);
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

### Steps

**1. Register the workflow once at startup:**

```ts
fw.workflow("checkout", [
  {
    name: "charge",
    handler: async (ctx) => {
      const charge = await stripe.charges.create({
        amount: ctx.input.amount,
        customer: ctx.input.customerId,
      });
      return { chargeId: charge.id };
    },
  },
  {
    name: "inventory",
    handler: async (ctx) => {
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
```

**2. Trigger it from a route:**

```ts
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

### Steps

**1. Create the flag** in the dashboard at `/ops` → Feature Flags → New Flag.

**2. Evaluate it in your code:**

```ts
app.get("/checkout", async (req, res) => {
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

### Steps

**1. Mount the tracer first:**

```ts
app.use(fw.requestTracer); // must be before your routes
```

**2. Add manual spans for slow operations:**

```ts
app.get("/order/:id", async (req, res) => {
  const order = await fw.trace("load-order", async () => {
    return db.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
  });

  const enriched = await fw.trace("enrich-order", async () => {
    const user = await fw.trace("load-user", () => loadUser(order.userId));
    const items = await fw.trace("load-items", () => loadItems(order.id));
    return { ...order, user, items };
  });

  res.json(enriched);
});
```

**3. Or use auto-instrumented helpers instead of manual wrapping:**

```ts
// fw.query and fw.fetch create spans automatically — no manual fw.trace() needed
const { rows } = await fw.query("SELECT * FROM orders WHERE user_id = $1", [userId]);
const stripeData = await fw.fetch("https://api.stripe.com/v1/customers/" + customerId);
```

All spans appear in the dashboard waterfall under their parent request trace.

</details>

<details>
<summary><strong>Error Reporting</strong> — capture errors with full context, group duplicates, and search from the dashboard</summary>

### The problem it solves

In production, errors are lost. PM2 restarts the process and the stack trace is gone. You find out from a user email. Even if you log errors, the same crash repeats hundreds of times and floods your logs — you lose signal in the noise.

Error reporting captures errors with their full stack trace and request context, stores them in Postgres, groups identical errors together (so you see "this error happened 847 times" not 847 separate entries), and makes them searchable from the dashboard.

### Steps

**1. Mount the error handler last:**

```ts
app.use(fw.errorHandler); // after all routes
```

Any `throw` or `next(err)` in your routes is automatically caught, stored, and grouped.

**2. Capture errors from background jobs:**

```ts
async function processPayment(orderId: string) {
  try {
    await stripe.charges.create({ ... });
  } catch (err) {
    fw.captureError(err, {
      source: "payment-worker",
      orderId,
      severity: "critical",
    });
  }
}
```

**Note:** Only capture 5xx server errors. Validation errors, 404s, and auth failures are not bugs — don't capture them.

</details>

<details>
<summary><strong>Rate Limiting</strong> — Redis-backed request limiter with three algorithms</summary>

### The problem it solves

Without rate limiting, a single client can hammer your server with thousands of requests per second — whether it's a bot, a misconfigured client, or an attacker.

### Algorithms

| Algorithm | How it works | Best for |
|---|---|---|
| `fixed-window` | Counter resets every N seconds (default) | Simple, low memory |
| `sliding-window` | Rolling time window using a Redis sorted set | No burst at window boundary |
| `token-bucket` | Tokens refill at a constant rate via Lua script | Smooth traffic shaping |

### Steps

```ts
// global base limit
app.use(fw.rateLimit({ max: 500, windowSeconds: 60 }));

// tighter limit on login with sliding window — prevents credential stuffing
app.post("/auth/login",
  fw.rateLimit({ max: 5, windowSeconds: 60, keyBy: "ip", algorithm: "sliding-window" }),
  loginHandler
);

// per-user limit for authenticated API
app.use("/api/v1",
  fw.auth!.protect,
  fw.rateLimit({ max: 1000, windowSeconds: 60, keyBy: "userId" })
);

// custom key — limit by email (prevents user enumeration)
app.post("/auth/forgot-password",
  fw.rateLimit({
    max: 3,
    windowSeconds: 3600,
    keyBy: (req) => `forgot:${req.body.email}`,
  }),
  forgotPasswordHandler
);
```

**Graceful degradation:** if Redis is unavailable, the middleware lets the request through rather than blocking your entire API.

</details>

<details>
<summary><strong>IP Filtering</strong> — CIDR-based allowlist and blocklist middleware</summary>

### What it is

IP filtering lets you control which IP addresses can reach certain routes. It works at the request level before any business logic runs.

### Steps

```ts
// restrict the admin panel to VPN only
app.use("/admin",
  fw.ipFilter({ allow: ["10.0.0.0/8", "192.168.0.0/16"] }),
  adminRouter
);

// block a specific abusive IP range
app.use(fw.ipFilter({ deny: ["198.51.100.0/24"] }));

// allow only your payment provider's webhook IPs
app.post("/webhooks/stripe",
  fw.ipFilter({ allow: ["3.18.12.63", "3.130.192.231"] }),
  stripeWebhookHandler
);
```

</details>

<details>
<summary><strong>API Versioning</strong> — version detection middleware and isolated version routers</summary>

### Steps

```ts
// detect version from header or query param on all requests
app.use(fw.versionMiddleware({ defaultVersion: 1, header: "api-version" }));

// create isolated routers per version
const v1 = fw.version();
const v2 = fw.version();

v1.get("/users/:id", async (req, res) => {
  // flat user object
  res.json(await getUser(req.params.id));
});

v2.get("/users/:id", async (req, res) => {
  // richer nested object
  res.json({ user: await getUserWithProfile(req.params.id) });
});

app.use("/v1", v1);
app.use("/v2", v2);
```

</details>

<details>
<summary><strong>Caching</strong> — three layers: HTTP ETag, Redis response cache, and query cache with tag invalidation</summary>

### Why three layers?

| Layer | Where it caches | Best for |
|---|---|---|
| `fw.httpCache()` | Browser/CDN ↔ server (ETag/304) | Semi-static data per client |
| `fw.responseCache()` | Server-side Redis per route | Expensive routes shared across users |
| `fw.queryCache` | Raw DB query results in Redis | Frequent identical queries |

### Steps

```ts
// ETag cache — no Redis needed
app.get("/config", fw.httpCache({ maxAge: 300 }), getConfigHandler);

// Redis response cache — full response body stored in Redis
app.get("/products", fw.responseCache({ ttl: 60 }), getProductsHandler);

// Query cache with tag invalidation
const rows = await fw.queryCache.get(
  "SELECT * FROM products WHERE category = $1",
  ["electronics"],
  { ttl: 300, tags: ["products"] }
);

// Invalidate on write — all queries tagged "products" are cleared
app.post("/products", async (req, res) => {
  await db.query("INSERT INTO products ...", [...]);
  await fw.queryCache.invalidate("products");
  res.json({ created: true });
});
```

</details>

<details>
<summary><strong>Full-Text Search</strong> — Postgres tsvector search with relevance ranking</summary>

### Steps

```ts
app.get("/search", async (req, res) => {
  const results = await fw.search({
    table: "articles",
    columns: ["title", "body", "tags"],
    query: req.query.q as string,
    limit: 20,
    offset: 0,
    language: "english",
  });

  res.json({
    results: results.rows,
    total: results.total,
    pages: Math.ceil(results.total / 20),
  });
});
```

No Elasticsearch required. Uses Postgres's built-in `tsvector` and `plainto_tsquery`. Table and column names are validated before interpolation — no SQL injection risk.

</details>

<details>
<summary><strong>Bulkhead Isolation</strong> — cap concurrent calls to slow dependencies</summary>

### The problem it solves

If a database query is slow and every request starts one, you end up with hundreds of open connections waiting. A bulkhead caps concurrent calls to any one resource so a slow dependency can't cascade and crash your entire server.

### Steps

```ts
// create one bulkhead per resource — not per request
const dbBulkhead      = fw.bulkhead({ limit: 20, queue: 50 });
const paymentBulkhead = fw.bulkhead({ limit: 5,  queue: 10 });

app.get("/reports", async (req, res) => {
  try {
    const result = await dbBulkhead.execute(() => runExpensiveReport(req.query));
    res.json(result);
  } catch (err) {
    if (err.message.includes("Bulkhead full")) {
      res.status(503).json({ error: "Server is at capacity, please retry." });
    } else throw err;
  }
});
```

</details>

<details>
<summary><strong>Circuit Breaker</strong> — stop sending requests to a failing dependency and give it time to recover</summary>

### The three states

- **CLOSED** — all calls go through. Too many failures → opens
- **OPEN** — all calls fail immediately, no network attempt. After timeout → HALF_OPEN
- **HALF_OPEN** — one test call goes through. Success → CLOSED. Failure → OPEN again

### Steps

```ts
const stripeBreaker = fw.circuitBreaker({ threshold: 3, timeout: 15_000 });

app.post("/checkout", async (req, res) => {
  try {
    const charge = await stripeBreaker.execute(() =>
      stripe.charges.create({ amount: req.body.amount, customer: req.body.customerId })
    );
    res.json({ chargeId: charge.id });
  } catch (err) {
    if (err.message === "Circuit open") {
      res.status(503).json({ error: "Payment service unavailable. Please retry in a minute." });
    } else throw err;
  }
});
```

</details>

<details>
<summary><strong>WebSockets</strong> — real-time bidirectional communication on your existing HTTP server</summary>

### Steps

```ts
import http from "http";

const server = http.createServer(app);
const ws = fw.websocket(server, "/ws");

ws.server.on("connection", (socket, req) => {
  socket.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "chat") {
      ws.broadcast(JSON.stringify({ type: "chat", from: msg.userId, text: msg.text }));
    }
  });
});

// push to all clients from anywhere in your app
fw.events.on("order:shipped", (order) => {
  ws.broadcast(JSON.stringify({ type: "order-update", orderId: order.id, status: "shipped" }));
});

server.listen(3000); // use server.listen, not app.listen
```

</details>

<details>
<summary><strong>CRON Scheduler</strong> — recurring background jobs backed by BullMQ and Redis</summary>

### Steps

```ts
// standard 5-field cron: minute hour day month weekday

fw.cron("cleanup-sessions").schedule("0 3 * * *").run(async () => {
  await db.query("DELETE FROM sessions WHERE expires_at < NOW()");
});

fw.cron("sync-rates").schedule("0 * * * *").run(async () => {
  const rates = await fetch("https://api.exchangerate.host/latest").then(r => r.json());
  await db.query("INSERT INTO exchange_rates ...", [...]);
});
```

Jobs persist across restarts (stored in Redis). Multiple app instances won't double-run a job — BullMQ deduplicates.

</details>

<details>
<summary><strong>Outbound Webhooks</strong> — deliver signed events to external URLs with automatic retries</summary>

### Steps

```ts
// register a subscription
app.post("/webhooks/subscribe", async (req, res) => {
  const sub = await fw.webhook.register({
    url: req.body.url,
    events: req.body.events,   // e.g. ["order.created", "order.shipped"]
    secret: crypto.randomBytes(32).toString("hex"),
  });
  res.json({ id: sub.id, secret: sub.secret });
});

// deliver events from your business logic
app.post("/orders", async (req, res) => {
  const order = await createOrder(req.body);

  await fw.webhook.deliver("order.created", {
    orderId: order.id,
    total: order.total,
  });

  res.status(201).json(order);
});
```

Deliveries happen in the background with exponential backoff retries. All attempts are logged in Postgres and visible in the dashboard.

</details>

<details>
<summary><strong>Prometheus Metrics</strong> — expose /metrics for Prometheus scraping, plus custom counters and histograms</summary>

### Steps

```ts
// expose the scrape endpoint
app.get("/metrics", fw.metrics.handler);

// custom metrics
const ordersCreated = fw.metrics.counter("orders_created_total");
const paymentDuration = fw.metrics.histogram("payment_duration_seconds");

app.post("/checkout", async (req, res) => {
  const start = Date.now();
  const result = await processPayment(req.body);
  ordersCreated.inc();
  paymentDuration.observe((Date.now() - start) / 1000);
  res.json(result);
});
```

Default metrics (CPU, memory, event loop lag) are included automatically.

</details>

<details>
<summary><strong>Structured Log Store</strong> — JSON logs to both stdout and Postgres, queryable from the dashboard</summary>

### Steps

```ts
// use fw.logger in your app code
fw.logger.info({ orderId: "ord_123" }, "Order created");
fw.logger.error({ err }, "Payment failed");

// query logs programmatically
app.get("/admin/logs", requireAdmin, async (req, res) => {
  const logs = await fw.logs.query({
    level: "error",
    from: new Date(Date.now() - 3_600_000),
    limit: 50,
  });
  res.json(logs);
});
```

Set `LOG_LEVEL=debug` to see verbose output. Default is `info`.

</details>

<details>
<summary><strong>Internal Event Bus</strong> — in-process publish/subscribe to decouple your modules</summary>

### Steps

```ts
// emitter module — knows nothing about who listens
async function createOrder(data) {
  const order = await db.query("INSERT INTO orders ...", [...]);
  fw.events.emit("order:created", { orderId: order.id, userId: data.userId, total: data.total });
  return order;
}

// listener modules — each subscribes independently
fw.events.on("order:created", async ({ orderId, userId }) => {
  await sendConfirmationEmail(userId, orderId);
});

fw.events.on("order:created", ({ total, userId }) => {
  analytics.track(userId, "Order Placed", { revenue: total });
});
```

</details>

<details>
<summary><strong>Server-Sent Events</strong> — push data from server to browser over a plain HTTP connection</summary>

### When to use SSE vs WebSockets

- **SSE:** server-to-client only (live dashboards, notifications, progress bars). Simpler, works over plain HTTP.
- **WebSockets:** bidirectional (chat, collaborative features). Requires `http.createServer`.

### Steps

```ts
import { createSseConnection } from "@pranshulsoni/flowwatch";

app.get("/orders/:id/stream", fw.auth!.protect, async (req, res) => {
  const sse = createSseConnection(req, res);

  const order = await db.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
  sse.send({ type: "order-state", order: order.rows[0] });

  const listener = (update) => {
    if (update.orderId === req.params.id) {
      sse.send({ type: "order-update", status: update.status });
    }
  };
  fw.events.on("order:updated", listener);

  sse.onClose(() => fw.events.off("order:updated", listener));
});
```

Client:

```js
const source = new EventSource("/orders/ord_123/stream");
source.onmessage = (e) => updateOrderStatus(JSON.parse(e.data));
```

</details>

<details>
<summary><strong>Testing Utilities</strong> — mock Postgres Pool and Redis for unit tests without real infrastructure</summary>

### Steps

```ts
import { createMockPool, createMockRedis } from "@pranshulsoni/flowwatch";

describe("queryCache", () => {
  it("returns cached rows on second call", async () => {
    const pool  = createMockPool([{ id: 1, name: "Widget" }]);
    const redis = createMockRedis();
    const cache = createQueryCache(pool, redis);

    const first  = await cache.get("SELECT * FROM products", [], { ttl: 60, tags: ["products"] });
    const second = await cache.get("SELECT * FROM products", [], { ttl: 60, tags: ["products"] });

    expect(first).toEqual(second);  // second call hits Redis, not Postgres
  });
});
```

`createMockRedis()` has a real in-memory store — get/set/incr/sadd/smembers all behave correctly. TTLs are not simulated (expire/pttl return fixed values).

</details>

<details>
<summary><strong>Migration Rollback</strong> — undo the last applied database migration</summary>

### Steps

```ts
// in a script or CLI
await fw.rollbackMigration();

// or expose as an internal API (protect this!)
app.post("/internal/db/rollback", requireInternalAuth, async (req, res) => {
  await fw.rollbackMigration();
  res.json({ rolledBack: true });
});
```

Runs the `down` SQL of the last applied migration in a transaction. Either both the schema change and the migration record removal succeed, or neither does.

</details>

<details>
<summary><strong>Multi-Language Sidecar</strong> — use FlowWatch from Python, Go, or Rust via a local HTTP API</summary>

### The problem it solves

FlowWatch is a Node.js package. If your backend is in Python, Go, or Rust, you can't import it directly. The sidecar pattern solves this: a tiny Express server runs inside the same Node.js process and exposes FlowWatch's core features (flags, workflows, tracing, errors) as a simple JSON HTTP API on localhost. Your non-Node service calls localhost, not an external SaaS.

### Steps

**1. Start the sidecar from your Node.js app:**

```ts
import { startSidecar } from "@pranshulsoni/flowwatch";

startSidecar(fw, {
  port: 9400,
  token: process.env.SIDECAR_TOKEN,  // set the same value in your Python/Go/Rust env
});
```

**2. Use the matching client SDK in your language:**

```python
# Python
from flowwatch import FlowwatchClient
client = FlowwatchClient("http://localhost:9400", token=os.environ["SIDECAR_TOKEN"])
enabled = client.evaluate_flag("new-ui", {"userId": "user_123"})
client.trigger_workflow("send-order", {"orderId": "ord_456"})
```

```go
// Go
client := fw.New("http://localhost:9400", os.Getenv("SIDECAR_TOKEN"))
enabled, _ := client.EvaluateFlag(ctx, "new-ui", map[string]any{"userId": "user_123"})
```

```rust
// Rust
let client = FlowwatchClient::new("http://localhost:9400", Some("token"));
let enabled = client.evaluate_flag("new-ui", HashMap::new()).await.unwrap();
```

</details>

<details>
<summary><strong>AI Diagnostics</strong> — automated incident analysis and a chat interface that knows your actual trace data</summary>

### Steps

```ts
const fw = await createFlowwatch({
  db: { connectionString: process.env.DATABASE_URL },
  ai: { groqApiKey: process.env.GROQ_API_KEY }, // free at console.groq.com
});

app.use("/ops", fw.dashboard); // AI chat tab appears automatically
```

The AI is given your actual trace and error data as context. "Why was the API slow between 2pm and 3pm?" answers based on the real traces from that window. Your Postgres data never leaves your infrastructure — Groq is stateless inference only.

</details>

---

## Quick Reference

```ts
// ─── Setup middleware (mount in this order) ───────────────────────────────────
app.use(fw.securityHeaders)            // helmet — first
app.use(fw.bodyParser)                 // JSON + URL-encoded, size limited
app.use(fw.requestTracer)              // assigns trace ID
app.use(fw.timeout())                  // 503 if handler hangs (default 30s)
app.use(fw.metrics.middleware())       // optional request duration recording

// ─── Auth ──────────────────────────────────────────────────────────────────
app.use("/auth", fw.auth!.router)      // login/register/oauth/verify endpoints
fw.auth!.protect                       // middleware: require valid JWT
fw.auth!.requireRole("admin")          // middleware: require a specific role
fw.auth!.requireVerifiedEmail          // middleware: require verified email

// ─── Request control ─────────────────────────────────────────────────────
fw.maintenanceMode(isEnabled)          // 503 all requests when isEnabled() → true
fw.rateLimit(opts)                     // per IP / user / key — 3 algorithms
fw.ipFilter(opts)                      // CIDR allowlist / blocklist
fw.versionMiddleware(opts?)            // sets req.apiVersion from header

// ─── Core ────────────────────────────────────────────────────────────────
fw.workflow(name, steps)               // register durable workflow
fw.trigger(name, input)               // enqueue workflow execution
fw.flag(name, context)                // evaluate feature flag → boolean
fw.trace(name, fn)                    // manual trace span
fw.captureError(err, ctx?)            // capture a 5xx error
fw.rollbackMigration()                // roll back last DB migration
fw.dashboard                          // Express Router — mount anywhere
fw.errorHandler                       // Express error middleware — mount last

// ─── Resilience ──────────────────────────────────────────────────────────
fw.bulkhead(opts)                     // → { execute, active, queued }
fw.circuitBreaker(opts?)              // → { execute, state }

// ─── Transport & Scheduling ──────────────────────────────────────────────
fw.websocket(server, path?)           // → { server, broadcast, close }
fw.webhook                            // → { register, deliver, list }
fw.cron(name).schedule(expr).run(fn)  // recurring background job

// ─── Caching & Search ────────────────────────────────────────────────────
fw.httpCache(opts?)                   // ETag/304 middleware
fw.responseCache(opts)                // Redis response cache middleware
fw.queryCache                         // → { get, invalidate }
fw.search(opts)                       // Postgres full-text search
fw.version()                          // → Express Router for versioned routes

// ─── Observability ───────────────────────────────────────────────────────
fw.metrics                            // → { handler, counter, histogram }
fw.logger                             // Pino logger → stdout + Postgres
fw.logs.query(opts)                   // query Postgres log store
fw.query(sql, params)                 // auto-traced pg query
fw.fetch(url, opts?)                  // auto-traced HTTP fetch
fw.events                             // → { on, once, emit, off }

// ─── Dead Letter Queue ────────────────────────────────────────────────────
fw.dlq.getFailedJobs(limit?)          // list permanently failed workflow jobs
fw.dlq.requeueJob(jobId)              // retry a failed job

// ─── Teardown ────────────────────────────────────────────────────────────
fw.close()                            // drain all connections gracefully
```

---

## Client SDKs

All three SDKs talk to the sidecar you start alongside your Node.js app:

```ts
import { startSidecar } from "@pranshulsoni/flowwatch";
startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN });
```

---

### Python SDK

**Package:** `flowwatch-client` &nbsp;·&nbsp; **Source:** [`sdks/python`](./sdks/python)

```bash
pip install flowwatch-client
```

```python
from flowwatch import FlowwatchClient

client = FlowwatchClient("http://localhost:9400", token="your-token")

if client.evaluate_flag("new-checkout", {"userId": "user_123"}):
    render_new_ui()

client.trigger_workflow("send-order", {"orderId": "ord_456", "amount": 4999})

try:
    do_something_risky()
except Exception as e:
    import traceback
    client.capture_error(str(e), stack=traceback.format_exc(), source="worker")

with client.trace_span("db-query", type="db"):
    rows = db.execute("SELECT * FROM products")

client.close()
```

---

### Go SDK

**Module:** `github.com/PranshulSoni/flowwatch-go` &nbsp;·&nbsp; **Source:** [`sdks/go`](./sdks/go)

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

enabled, _ := client.EvaluateFlag(ctx, "new-checkout", map[string]any{"userId": "user_123"})
client.TriggerWorkflow(ctx, "send-order", map[string]any{"orderId": "ord_456"})
client.CaptureError(ctx, fw.CaptureErrorOptions{Message: "something broke", Source: "checkout-service"})
```

---

### Rust SDK

**Crate:** `flowwatch-client` &nbsp;·&nbsp; **Source:** [`sdks/rust`](./sdks/rust)

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

    let enabled = client.evaluate_flag("new-checkout", HashMap::new()).await.unwrap();

    client.trigger_workflow("send-order", Some(serde_json::json!({
        "orderId": "ord_456",
        "amount": 4999
    }))).await.unwrap();
}
```

---

## License

MIT
