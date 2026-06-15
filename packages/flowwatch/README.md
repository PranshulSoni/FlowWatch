# FlowWatch

[![npm version](https://img.shields.io/npm/v/@pranshulsoni/flowwatch.svg)](https://www.npmjs.com/package/@pranshulsoni/flowwatch) [![npm downloads](https://img.shields.io/npm/dm/@pranshulsoni/flowwatch.svg)](https://www.npmjs.com/package/@pranshulsoni/flowwatch) [![npm license](https://img.shields.io/npm/l/@pranshulsoni/flowwatch.svg)](https://www.npmjs.com/package/@pranshulsoni/flowwatch)

**The world's first npm package that gives you durable workflows, feature flags, request tracing, and error reporting — all in one, completely free, and running entirely inside your own Express app.**

No SaaS. No monthly bill. No third-party cloud. Your Postgres, your Redis, your data.

---

## Table of Contents

- [Why I built this](#why-i-built-this) ← skip this if you just want the code
- [What you get with one install](#what-you-get-with-one-install)
- [Getting started](#getting-started)
- [Durable Workflows](#durable-workflows)
- [Feature Flags](#feature-flags)
- [Request Tracing](#request-tracing)
- [Error Reporting](#error-reporting)
- [AI Insights and Chat](#ai-insights-and-chat)
- [Infrastructure](#infrastructure)
- [The Dashboard](#the-dashboard)
- [Quick Reference](#quick-reference)
- [Database Schema](#database-schema)
- [License](#license)

---

## Why I built this

When I was first learning backend development, I thought building an API was simple. You write an Express route, connect to a database, query some data, and return a JSON response. It felt clean, fast, and empowering.

Then, my first real-world project went live.

Within weeks, marketing wanted to hide new checkout pages behind a feature flag. The product manager wanted a complex user-onboarding sequence that sent emails, charged cards, and created database records — all guaranteed never to fail midway. Users started complaining about occasional timeouts, and I spent hours staring at thousands of lines of scrambled console logs.

To solve these basic production problems, I was forced to stitch together a monster of external SaaS tools:
1. **LaunchDarkly** (or Split) for Feature Flags ($$$)
2. **Sentry** (or Rollbar) for Error Tracking ($$)
3. **Datadog** (or Jaeger) for Distributed Tracing ($$$$)
4. **Temporal** (or BullMQ with custom state machines) for Durable Workflows

Suddenly, I wasn't just a backend developer writing code; I was a systems integrator managing five different SDKs, logging into five different dashboards, paying five monthly subscriptions, and writing hundreds of lines of glue code. Worst of all, **none of these tools talked to each other**. My Sentry error had no idea about the Temporal workflow step that failed, and my Datadog traces didn't show which LaunchDarkly feature flags were enabled.

**FlowWatch is the tool I always wished I had.** It embeds all four pillars of backend operations directly into your Express application as a single npm package. It uses the infrastructure you already have (Postgres, Redis, Elasticsearch) and serves a beautiful, unified admin dashboard directly from your app.

And because all your operations data lives in the same database, we added **Groq-powered AI insights and support chat** that can correlate logs, flags, errors, and traces to diagnose your bugs in seconds.

---

## What you get with one install

```bash
npm install @pranshulsoni/flowwatch
```

- **Durable Workflows** — define multi-step processes that survive server crashes and retry failed steps automatically
- **Feature Flags** — toggle features and do percentage rollouts from a dashboard, no redeploys needed
- **Request Tracing** — see exactly what every request did, how long each part took, and which parts were slow
- **Error Reporting** — capture, group, and search errors with full stack traces and context
- **AI Diagnostics** — connect a Groq API key and get automated incident analysis and a chat interface that knows your actual data
- **Built-in Dashboard** — a 10-page admin UI served directly from your Express app at whatever path you choose

Everything stores in your own Postgres database. Redis is optional (but recommended). Elasticsearch is optional. The Groq API key is optional. Postgres is the only hard requirement.

---

## Getting started

### Minimum setup

```ts
import express from "express";
import { createFlowwatch } from "@pranshulsoni/flowwatch";

const app = express();
app.use(express.json());

const fw = await createFlowwatch({
  db: {
    connectionString: process.env.DATABASE_URL
  },
  migrations: {
    autoRun: true
  },
  runtime: {
    serviceName: "my-api",
    environment: "production"
  }
});

app.use(fw.requestTracer);    // goes first
app.use("/ops", fw.dashboard);

// your routes go here

app.use(fw.errorHandler);     // goes last

app.listen(3000);
```

Visit `http://localhost:3000/ops` and the dashboard is live.

### Full setup with Redis and Elasticsearch

```ts
const fw = await createFlowwatch({
  db: {
    connectionString: process.env.DATABASE_URL
  },
  redis: {
    url: process.env.REDIS_URL
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL
  },
  migrations: {
    autoRun: true
  },
  runtime: {
    serviceName: "my-api",
    environment: "production"
  }
});
```

---

## Durable Workflows

### The problem

You have a checkout flow. Charge card → deduct inventory → send email → generate invoice. You write it as four sequential awaits in a route handler. It works in development. In production, the email server goes down between step 2 and step 3. The card was charged, inventory was deducted, but the process died halfway.

Now you have inconsistent data and no visibility into what happened.

### Without FlowWatch

```ts
app.post("/checkout", async (req, res) => {
  try {
    await chargeCard(req.body);
    await deductInventory(req.body); // server crashes here
    await sendEmail(req.body);        // never runs
    await generateInvoice(req.body);
    res.json({ ok: true });
  } catch (err) {
    // what do you roll back? what already ran?
    res.status(500).json({ error: "something failed" });
  }
});
```

### With FlowWatch

```ts
fw.workflow("checkout", [
  { name: "charge-card",      run: async (input) => chargeCard(input),      maxRetries: 3 },
  { name: "deduct-inventory", run: async (input) => deductInventory(input), maxRetries: 2 },
  { name: "send-email",       run: async (input) => sendEmail(input),       maxRetries: 5 },
  { name: "generate-invoice", run: async (input) => generateInvoice(input), maxRetries: 2 }
]);

app.post("/checkout", async (req, res) => {
  const { executionId } = await fw.trigger("checkout", req.body);
  res.json({ executionId });
});
```

Each step's result is saved to Postgres immediately after it completes. If the server crashes on step 2, the next time it starts up the workflow engine picks up the execution and resumes from step 2. No double charges. No lost orders. No cron jobs.

---

## Feature Flags

### The problem

You want to test a new feature with 10% of your users. You hardcode an env variable — now toggling it requires a redeploy. You move it to the database — now every request hits the DB just to read a boolean. You add Redis caching — now you have cache invalidation bugs.

### Without FlowWatch

```ts
// requires a redeploy to change anything
if (process.env.NEW_SEARCH === "true") {
  return runNewSearch(query);
}
```

### With FlowWatch

```ts
const useNewSearch = await fw.flag("new-search-v2", {
  userId: req.user.id,
  email: req.user.email,
  plan: req.user.plan
});

if (useNewSearch) return runNewSearch(req.query.q);
return runOldSearch(req.query.q);
```

Toggle flags, adjust rollout percentages, and define targeting rules from the dashboard — no redeploys needed. Evaluations use Redis caching with a 60-second TTL and consistent SHA-256 hashing so the same user always gets the same result.

---

## Request Tracing

### The problem

An endpoint is slow. You open your terminal and see 150 log lines from 30 concurrent requests all mixed together. You have no idea which log line belongs to which request or which database call caused the slowdown.

### Without FlowWatch

```ts
// passing requestId through every function in the codebase
async function getUser(id: number, requestId: string) {
  console.log(`[${requestId}] fetching user ${id}`);
  return db.query("SELECT * FROM users WHERE id = $1", [id]);
}
```

### With FlowWatch

```ts
app.use(fw.requestTracer);

app.get("/api/dashboard", async (req, res) => {
  const user = await fw.trace("fetch-user", "database", () =>
    db.query("SELECT * FROM users WHERE id = $1", [req.user.id])
  );

  const rates = await fw.trace("fetch-shipping-api", "http", () =>
    axios.get("https://api.shipping.com/rates")
  );

  res.json({ user, rates });
});
```

FlowWatch uses `AsyncLocalStorage` to carry trace context automatically through every async operation. In the dashboard you get an interactive trace graph:

```
GET /api/dashboard  (4800ms)
├── fetch-user          database   42ms
└── fetch-shipping-api  http     4720ms  ← there's your problem
```

---

## Error Reporting

### The problem

Something crashes in production. pm2 restarts the server. The stack trace is gone. A user emails support. The same database timeout fires 3,000 times and fills your log file. You have no context about what request or workflow step triggered it.

### Without FlowWatch

```ts
app.use((err, req, res, next) => {
  console.error(err.stack); // gets lost or floods the log file
  res.status(500).json({ error: "Internal server error" });
});
```

### With FlowWatch

```ts
// automatically catches all unhandled errors — register last
app.use(fw.errorHandler);

// or capture specific errors manually
try {
  await processPayment(data);
} catch (err) {
  await fw.captureError(err, {
    source: "payment_processor",
    level: "fatal",
    category: "dependency"
  });
}
```

FlowWatch fingerprints each error using SHA-256 so identical errors are grouped with a frequency count instead of thousands of duplicates. Each error links back to the exact request trace where it happened.

---

## AI Insights and Chat

Because FlowWatch holds all four pillars of observability in the same Postgres database, it has a complete picture of your application's state.

Connect a **Groq API key** in the Settings page and you get two features:

**AI Insights** — one click pulls recent errors, failing workflows, toggled feature flags, and infrastructure health, then returns a structured diagnosis. It can say things like: *"database errors spiked 4 minutes after feature flag 'new-billing-v2' was rolled out to 50%, suggesting the new code path is hitting an unindexed column."*

**Ask AI** — a full chat interface where you can ask in plain English:
- "Which workflow has the most failures this week?"
- "What's in the stack trace for the checkout error from an hour ago?"
- "List the feature flags that were toggled today"

Both features are optional. Everything else works without a Groq key.

---

## Infrastructure

### Version requirements

| Service | Minimum Version | Notes |
| :--- | :--- | :--- |
| Postgres | Any modern version (v11+) | No version-specific features used |
| Redis | **v5+** for workflow queues | Older Redis disables workflows but everything else still works |
| Elasticsearch | **v8.x** | Built against the v8 API — v7 is not supported |

### Graceful degradation

| Service | Required | What breaks without it |
| :--- | :--- | :--- |
| Postgres | **Yes** | Nothing works without it |
| Redis | No | Workflow queues are disabled. Flag evaluations hit Postgres directly |
| Elasticsearch | No | Search falls back to Postgres queries |
| Groq API key | No | AI Insights and Ask AI are locked |

### Option 1 — Bring your own URLs

```ts
const fw = await createFlowwatch({
  db: { connectionString: "postgresql://user:password@your-host:5432/dbname" },
  redis: { url: "redis://your-redis-host:6379" },
  elasticsearch: { node: "https://your-es-host:9200" }
});
```

### Option 2 — Spin up locally with Docker Compose

```bash
docker-compose up -d
```

Starts Postgres 16, Redis 7, and Elasticsearch 8.13 locally, then connect with:

```ts
const fw = await createFlowwatch({
  db: { connectionString: "postgresql://postgres:postgres@localhost:5432/flowwatch" },
  redis: { url: "redis://localhost:6379" },
  elasticsearch: { node: "http://localhost:9200" }
});
```

---

## The Dashboard

Once mounted, the dashboard is a 10-page single-page application served directly by your Express router — no React, no build step, no CDN.

| Page | What it shows |
| :--- | :--- |
| Overview | Summary metrics, recent executions, recent errors, infrastructure health |
| Workflows | Registered workflow definitions with step counts |
| Executions | Every workflow run with status, step timeline, input/output |
| Feature Flags | All flags with toggle switches, rollout percentage bars, rule counts |
| Errors | Error list with grouping, frequency, category filters, and full-text search |
| Traces | Interactive SVG trace graph, span inspector, filterable trace table |
| AI Insights | Automated diagnosis panel (requires Groq key) |
| Ask AI | Full chat interface with conversation history (requires Groq key) |
| Health | Live health cards for Postgres, Redis, Elasticsearch |
| Settings | Environment name, Groq API key, model selection |

---

## Quick Reference

```ts
// Factory — call once at startup
const fw = await createFlowwatch(config);

// Middleware
app.use(fw.requestTracer);   // mount first
app.use(fw.errorHandler);    // mount last

// Dashboard
app.use("/ops", fw.dashboard);

// Workflows
fw.workflow(name, steps[]);
await fw.trigger(name, input?);  // returns { executionId }

// Feature flags
await fw.flag(key, context?);    // returns boolean

// Tracing
await fw.trace(name, type, fn, metadata?);

// Error capture
await fw.captureError(error, options?);

// Context helpers (usable anywhere in async call chain)
getCurrentTraceId();
getCurrentSpanId();
getCurrentClientIp();
```

---

## Database Schema

When you set `migrations: { autoRun: true }`, FlowWatch creates these tables automatically. All table names are prefixed with `flowwatch_` so they never conflict with your own tables.

### Workflows

```
flowwatch_workflows               — id, name, version, timestamps
flowwatch_workflow_steps          — id, workflow_id, step_index, name, max_retries
flowwatch_workflow_executions     — id, workflow_id, status, input, output, error, timestamps
flowwatch_workflow_step_executions — id, execution_id, step_index, status, input, output, attempt_count, next_retry_at
```

### Feature Flags

```
flowwatch_feature_flags           — id, key (unique), enabled, rollout_percentage, timestamps
flowwatch_feature_flag_rules      — id, flag_id, attribute, operator, value, enabled
flowwatch_feature_flag_audit_logs — id, flag_id, action, before, after, changed_by, created_at
```

### Traces and Errors

```
flowwatch_request_traces  — id, method, path, status_code, duration_ms, ip, user_agent, metadata
flowwatch_trace_spans     — id, trace_id, parent_span_id (self-ref), name, type, status, duration_ms
flowwatch_errors          — id, trace_id, span_id, category, level, message, stack, fingerprint (SHA-256)
```

### Elasticsearch Indices (optional)

| Index | Contents |
| :--- | :--- |
| `flowwatch_errors` | All captured errors, mirrored from Postgres for full-text search |
| `flowwatch_trace_spans` | All trace spans, mirrored from Postgres for fast filtering |

---

## License

ISC — free to use, modify, and distribute.
