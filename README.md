# FlowWatch

[![npm version](https://img.shields.io/npm/v/@pranshulsoni/flowwatch.svg)](https://www.npmjs.com/package/@pranshulsoni/flowwatch) [![npm downloads](https://img.shields.io/npm/dm/@pranshulsoni/flowwatch.svg)](https://www.npmjs.com/package/@pranshulsoni/flowwatch) [![npm license](https://img.shields.io/npm/l/@pranshulsoni/flowwatch.svg)](https://www.npmjs.com/package/@pranshulsoni/flowwatch)

**The world's first npm package that gives you durable workflows, feature flags, request tracing, and error reporting — all in one, completely free, and running entirely inside your own Express app.**

No SaaS. No monthly bill. No third-party cloud. Your Postgres, your Redis, your data.

---

## Table of Contents

- [Why I built this](#why-i-built-this) ← skip this if you just want the code
- [What you get with one install](#what-you-get-with-one-install)
- [Getting started](#getting-started)
  - [Minimum setup](#minimum-setup)
  - [Full setup with Redis and Elasticsearch](#full-setup-with-redis-and-elasticsearch)
- [Multi-Language Support (Sidecar Server)](#multi-language-support-sidecar-server)
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

I was building my first serious Express backend and everything was going fine until the app actually had to work in production.

The first real problem I hit was a multi-step operation. User pays, inventory gets deducted, email goes out. Simple on paper. But what happens when the email server is down on step 3? The payment went through. The inventory was deducted. But no email, no confirmation, and now you have a confused user and inconsistent database state. I started writing try/catch blocks around every step, adding status columns to the database, writing cron jobs to retry failed rows. It worked, barely, but it was ugly and I had no way to see what was happening at any point.

The second problem was feature flags. Marketing wanted a new UI rolled out to 10% of users. I hardcoded `process.env.NEW_UI_ENABLED=true` and redeploy every time anyone wanted to change anything. Then I moved it to the database. Now every request was hitting the DB just to read a boolean. I wrote a Redis caching layer. The cache got stale. Users were seeing different UIs on page refresh. It was a mess.

The third problem was debugging slow endpoints. A route would randomly take 4 seconds. I'd look at the logs and see 200 lines of mixed output from 30 concurrent requests all jumbled together. I had no idea which log line belonged to which request. I tried passing a `requestId` through every single function call in the entire codebase. My function signatures became a nightmare.

The fourth problem was errors. Something would crash in production, pm2 would restart the server, and the stack trace was gone. I'd find out from a user email. I set up a basic error logger but the same database connection error would repeat a thousand times and flood everything.

Every senior dev I talked to said the same thing: "Use Sentry for errors, LaunchDarkly for flags, Temporal for workflows, Datadog for traces." Great advice. That's also $300/month minimum, four separate dashboards, four separate SDKs, and none of them know what the others are doing.

I built FlowWatch because I couldn't find a single package that solved all four of these problems together, for free, without shipping my data to someone else's cloud. As far as I can tell, nothing like this exists. So I built it.

---

## What you get with one install

```bash
npm i @pranshulsoni/flowwatch
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

app.use(fw.requestTracer);   // goes first
app.use("/ops", fw.dashboard);

// your routes go here

app.use(fw.errorHandler);    // goes last

app.listen(3000);
```

That's it. Visit `http://localhost:3000/ops` and the dashboard is live.

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

## Multi-Language Support (Sidecar Server)

**FlowWatch is no longer locked into Node.js!** You can now run the FlowWatch dashboard, engines, database, and background queues inside a Node.js process, and connect **any other programming language backend** (Python, Go, Rust, Ruby, PHP, C#) to it using our lightweight REST Sidecar Server.

### How It Works

1. Start the FlowWatch Sidecar server in a small Node.js background process (or next to your main backend).
2. Your non-JS apps make simple, standard HTTP `POST` requests to communicate with the FlowWatch engine.
3. The dashboard aggregates telemetry, workflows, feature flags, and errors from all services in one unified UI!

### 1. Starting the Sidecar Server (Node.js)

To run the sidecar, import and call `startSidecar` from the package:

```ts
import { createFlowwatch, startSidecar } from "@pranshulsoni/flowwatch";

const fw = await createFlowwatch({
  db: { connectionString: process.env.DATABASE_URL },
  redis: { url: process.env.REDIS_URL },
  elasticsearch: { node: process.env.ELASTICSEARCH_URL },
  migrations: { autoRun: true }
});

// Start the sidecar server on port 9400
startSidecar(fw, 9400);
// This hosts the Sidecar REST API at: http://localhost:9400/api/*
// And mounts the admin Dashboard at: http://localhost:9400/ops
```

### 2. Communicating from Other Languages (e.g., Python)

Once the sidecar is running on port `9400`, your external service can communicate with it via standard JSON endpoints:

#### Feature Flag Evaluation (`POST /api/flag`)
Send a flag key and user context. The Node.js engine evaluates rules and percentage rollouts, and returns `true` or `false`.

```python
import requests

response = requests.post("http://localhost:9400/api/flag", json={
    "key": "new-billing-flow",
    "context": {
        "userId": "user_987",
        "email": "customer@company.com",
        "plan": "premium"
    }
})
is_enabled = response.json().get("enabled", False)
```

#### Ingesting Errors (`POST /api/capture-error`)
Report server exceptions directly to the FlowWatch error repository with stack trace detail.

```python
try:
    # Some buggy python logic
    raise ValueError("Database connection failed")
except Exception as e:
    requests.post("http://localhost:9400/api/capture-error", json={
        "error": {
            "message": str(e),
            "name": type(e).__name__,
            "stack": "Traceback:\n  File 'app.py', line 12..."
        },
        "options": {
            "source": "python-payment-microservice",
            "category": "database",
            "level": "fatal"
        }
    })
```

#### Logging Trace Spans (`POST /api/trace-span`)
Log performance metrics and execution duration of functions or database queries.

```python
import time

start_time = time.time()
# Run database query or external API call
time.sleep(0.35)
duration_ms = (time.time() - start_time) * 1000

requests.post("http://localhost:9400/api/trace-span", json={
    "name": "python-db-query",
    "type": "database",
    "durationMs": duration_ms,
    "status": "ok",
    "metadata": {
        "query": "SELECT * FROM orders WHERE id = 1"
    }
})
```

#### Triggering Durable Workflows (`POST /api/trigger`)
Trigger background workflow executions defined and hosted in the Node.js process.

```python
requests.post("http://localhost:9400/api/trigger", json={
    "name": "checkout-workflow",
    "input": {
        "cart_id": "cart_1234",
        "user_email": "user@example.com"
    }
})
```

---

## Durable Workflows

### The problem

You have a checkout flow. Charge card → deduct inventory → send email → generate invoice. You write it as four sequential awaits in a route handler. It works in development. In production, the email server goes down between step 2 and step 3. The card was charged, inventory was deducted, but the process died halfway.

Now you have inconsistent data and no visibility into what happened.

The "fix" most people reach for is adding a status column to the database and a cron job that checks for stuck orders every minute. That works until you have five different workflows, each with different step logic, different retry rules, and different failure scenarios. You end up with a handwritten state machine that's fragile and impossible to debug because you can't see what's happening in real time.

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

If the server crashes on step 2, you have no idea which steps completed. You need to write recovery logic, track step state manually, and hope your cron job catches it before the user notices.

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

You can see every execution in the dashboard — which steps ran, which failed, what the input and output of each step was, how many retries happened, and exactly when each step started and finished.

---

## Feature Flags

### The problem

You want to test a new feature with 10% of your users before rolling it out to everyone. Simple enough. You add an environment variable, deploy, and now you can control it. Except turning it off means another deploy. Changing the percentage means another deploy. Adding a rule that says "only for enterprise users" means another deploy.

So you move it to the database. Now you're hitting the database on every single request just to read a flag that almost never changes. You add Redis caching. Now you have to manage cache invalidation whenever someone updates the flag. A user reports they see two different UIs on page refresh because the cache expired mid-session.

### Without FlowWatch

```ts
// Option A: env variable — requires redeploy for any change
if (process.env.NEW_SEARCH === "true") {
  return runNewSearch(query);
}

// Option B: database — adds latency on every request
const flag = await db.query("SELECT enabled FROM flags WHERE key = 'new-search'");
if (flag.rows[0].enabled) {
  return runNewSearch(query);
}

// Option C: database + Redis — now you have two sources of truth to keep in sync
const cached = await redis.get("flag:new-search");
const enabled = cached ? JSON.parse(cached) : (await db.query("...")).rows[0].enabled;
if (!cached) await redis.setex("flag:new-search", 60, JSON.stringify(enabled));
```

Every option has a tradeoff and none of them give you a UI to manage flags without writing code.

### With FlowWatch

```ts
app.get("/search", async (req, res) => {
  const useNewSearch = await fw.flag("new-search-v2", {
    userId: req.user.id,
    email: req.user.email,
    plan: req.user.plan
  });

  if (useNewSearch) return runNewSearch(req.query.q);
  return runOldSearch(req.query.q);
});
```

Flag evaluation uses Redis as a cache with a 60-second TTL and Postgres as the source of truth. The caching is handled for you. Consistent percentage rollouts use SHA-256 hashing against the userId so the same user always gets the same result.

In the dashboard you can:
- Toggle flags on/off instantly, no redeploy
- Set a rollout percentage with a slider
- Create rules: `plan = enterprise` → enabled, `email ends with @company.com` → enabled
- View the full audit log of every change ever made to a flag

---

## Request Tracing

### The problem

An endpoint is slow. You open your terminal and see 150 log lines from 30 concurrent requests all mixed together:

```
SELECT * FROM users WHERE id = 44
GET /api/dashboard - started
Calling payment API
SELECT * FROM products WHERE id = 8
GET /api/profile - started
SELECT * FROM analytics WHERE user_id = 44
GET /api/dashboard - completed in 4800ms
```

Which of those database queries belongs to the slow `/api/dashboard` request? Was it the analytics query? Was it the payment API call? You have no idea because the logs are interleaved.

The standard advice is to pass a `requestId` through every function call so you can filter logs by it. That means every function in your entire codebase needs an extra parameter. Every database helper, every service function, every utility — all of them need to accept and forward this ID. It pollutes your entire codebase to solve a visibility problem.

### Without FlowWatch

```ts
// You end up with this everywhere
async function getUser(id: number, requestId: string) {
  console.log(`[${requestId}] fetching user ${id}`);
  const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
  console.log(`[${requestId}] fetched user in ${elapsed}ms`);
  return result;
}

async function getDashboard(req, res) {
  const reqId = req.headers["x-request-id"];
  const user = await getUser(req.user.id, reqId);      // passing reqId everywhere
  const stats = await getStats(req.user.id, reqId);    // passing reqId everywhere
  const flags = await getFlags(req.user.id, reqId);    // passing reqId everywhere
}
```

### With FlowWatch

```ts
// Mount once
app.use(fw.requestTracer);

// Use anywhere, no ID passing required
app.get("/api/dashboard", async (req, res) => {
  const user = await fw.trace("fetch-user", "database", () =>
    db.query("SELECT * FROM users WHERE id = $1", [req.user.id])
  );

  const stats = await fw.trace("fetch-stats", "database", () =>
    db.query("SELECT * FROM analytics WHERE user_id = $1", [req.user.id])
  );

  const rates = await fw.trace("fetch-shipping-api", "http", () =>
    axios.get("https://api.shipping.com/rates")
  );

  res.json({ user, stats, rates });
});
```

FlowWatch uses `AsyncLocalStorage` to carry the trace context automatically through every async operation. You never pass an ID anywhere. The context just follows the request.

In the dashboard you get an interactive trace graph showing every span as a node, with parent-child relationships drawn as edges. You can see:

```
GET /api/dashboard  (4800ms)
├── fetch-user        database   42ms
├── fetch-stats       database   38ms
└── fetch-shipping-api  http     4690ms  ← there's your problem
```

Click any span to see its full metadata, duration, and status.

---

## Error Reporting

### The problem

Something crashes in production. pm2 restarts the server. The stack trace is gone. A user emails support. You have no idea what happened.

You add a global error handler and log to a file. Now a database connection timeout that fires 3,000 times in an hour writes 3,000 identical stack traces to the log file. The log file is 800MB. The disk fills up. The server goes down for a different reason.

Even when you do have the error, you have no context. What route was it? What user triggered it? What was the request body? What database query ran right before it? A raw stack trace alone doesn't tell you any of that.

### Without FlowWatch

```ts
app.use((err, req, res, next) => {
  console.error(err.stack); // gets lost, or floods the log file
  res.status(500).json({ error: "Internal server error" });
});

// Or manually in catch blocks
try {
  await processPayment(data);
} catch (err) {
  console.error("Payment failed:", err.message); // no grouping, no context, no dashboard
}
```

### With FlowWatch

```ts
// Catch everything automatically — register this last
app.use(fw.errorHandler);

// Or capture specific errors manually with context
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

FlowWatch fingerprints each error using a SHA-256 hash of the error type, message, and stack location. Identical errors are grouped together and you see a frequency count rather than thousands of duplicate entries. Each captured error is linked to the request trace it happened in, so you can click an error and immediately see the full request context — what route it was, what spans ran before it, how long each part took, and what the status codes were.

Errors are stored in Postgres and indexed to Elasticsearch, so you can search and filter by category, level, source, time range, or free text.

---

## AI Insights and Chat

### The problem

You have four tools running (hypothetically). An error spikes at 2am. You open Sentry, copy a timestamp, open Datadog to check latency at that timestamp, open LaunchDarkly to check if any flag was changed around that time, open your database client to check for slow queries. You're doing manual correlation across four separate products while half asleep.

Even if each tool is good at what it does, none of them have any context from the others.

### With FlowWatch

Because all four pillars of observability are stored in the same Postgres database, the AI has access to everything at once. Add a Groq API key in the Settings page and you get two features:

**AI Insights** — click "Analyze" on the AI page and the system pulls recent errors, failing workflow executions, active feature flags, and infrastructure health, bundles it all into a prompt, and returns a structured diagnosis with a likely cause, impact, evidence, and recommended actions. It can say things like "database errors spiked 4 minutes after feature flag 'new-billing-v2' was rolled out to 50%, suggesting the new code path has a query that's hitting an unindexed column" — because it can see both the error timestamps and the flag audit log.

**Ask AI** — a full chat interface where you can ask questions in plain English:
- "Which workflow has the most failures this week?"
- "What's in the stack trace for the checkout error from an hour ago?"
- "List the feature flags that were toggled today"
- "What's the average latency for the /api/search endpoint?"

The AI is grounded in your actual data. It doesn't make up numbers.

Both features are completely optional. If you don't add a Groq key, everything else works fine.

---

## Infrastructure

```
Your Express App
└── FlowWatch
    ├── Workflow Engine  →  Postgres (state) + Redis/BullMQ (queues)
    ├── Flag Engine      →  Redis (cache) + Postgres (source of truth)
    ├── Trace Engine     →  Postgres + Elasticsearch
    ├── Error Engine     →  Postgres + Elasticsearch
    ├── AI Engine        →  Groq API + all of the above
    └── Dashboard        →  Express router serving a single HTML file
```

### What's required vs optional

| Service | Required | What breaks without it |
| :--- | :--- | :--- |
| Postgres | **Yes** | Nothing works without it |
| Redis | No | Workflow queues are disabled. Flag evaluations hit Postgres directly |
| Elasticsearch | No | Search falls back to Postgres queries |
| Groq API key | No | AI Insights and Ask AI are locked |

FlowWatch is designed to degrade gracefully. A Redis outage doesn't crash your app. An Elasticsearch cluster going down doesn't break error capture. Each service failing just reduces capability, it doesn't take everything else down with it.

---

## Connecting to Infrastructure

FlowWatch just needs connection strings — it doesn't care how or where those services are running. Before you connect, here are the minimum version requirements:

| Service | Minimum Version | Notes |
| :--- | :--- | :--- |
| Postgres | **Any modern version** (v11+) | No version-specific features used. If it speaks the standard Postgres wire protocol, it works. |
| Redis | **v5+** for workflow queues | v5 is required by BullMQ for reliable queue operations. If you're on an older Redis, workflow execution is disabled but everything else (flag caching, tracing, errors) still works. |
| Elasticsearch | **v8.x** | The client and index mappings are built against the v8 API. v7 is not supported. |

In short — any recent version of Postgres works, Redis 5 or newer works, and Elasticsearch needs to be on v8. If you're on managed services like Supabase, Upstash, or Elastic Cloud, you're almost certainly already on a compatible version.

### Option 1 — Bring your own URLs

If you already have Postgres, Redis, or Elasticsearch running somewhere (local install, Railway, Render, Supabase, Upstash, Elastic Cloud, anything), just pass the connection URLs directly:

```ts
const fw = await createFlowwatch({
  db: {
    connectionString: "postgresql://user:password@your-host:5432/dbname"
  },
  redis: {
    url: "redis://your-redis-host:6379"
  },
  elasticsearch: {
    node: "https://your-es-host:9200"
  }
});
```

That's all. FlowWatch connects and everything works.

### Option 2 — Spin up locally with Docker Compose

If you want a quick local dev environment with all three services running in one command, the repo includes a `docker-compose.yml`:

```bash
docker-compose up -d
```

This starts:
- Postgres 16 on `localhost:5432`
- Redis 7 on `localhost:6379`
- Elasticsearch 8.13 on `localhost:9200`

Then use these as your connection strings:

```ts
const fw = await createFlowwatch({
  db: {
    connectionString: "postgresql://postgres:postgres@localhost:5432/flowwatch"
  },
  redis: {
    url: "redis://localhost:6379"
  },
  elasticsearch: {
    node: "http://localhost:9200"
  }
});
```


## The dashboard

Once mounted, the dashboard is available at whatever path you chose (e.g. `/ops` or `/flowwatch`). It's a single HTML file served by your Express router — no React, no build step, no CDN dependency.

10 pages:

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

When you set `migrations: { autoRun: true }`, FlowWatch creates these tables in your Postgres database automatically on startup. All table names are prefixed with `flowwatch_` so they never conflict with your own tables.

### Workflows

```
flowwatch_workflows
  id               uuid  primary key
  name             text  not null
  version          int   not null
  created_at       timestamptz
  updated_at       timestamptz
  UNIQUE (name, version)

flowwatch_workflow_steps
  id               uuid  primary key
  workflow_id      uuid  → flowwatch_workflows
  step_index       int   not null
  name             text  not null
  max_retries      int   default 0
  UNIQUE (workflow_id, step_index)
  UNIQUE (workflow_id, name)

flowwatch_workflow_executions
  id               uuid  primary key
  workflow_id      uuid  → flowwatch_workflows
  workflow_name    text
  workflow_version int
  status           text  (pending | running | completed | failed)
  input            jsonb
  output           jsonb
  error            jsonb
  created_at       timestamptz
  updated_at       timestamptz

flowwatch_workflow_step_executions
  id               uuid  primary key
  execution_id     uuid  → flowwatch_workflow_executions (CASCADE)
  workflow_step_id uuid  → flowwatch_workflow_steps
  step_index       int
  step_name        text
  status           text  (pending | running | completed | failed)
  input            jsonb
  output           jsonb
  error            jsonb
  attempt_count    int   default 0
  max_retries      int
  next_retry_at    timestamptz
  UNIQUE (execution_id, step_index)
  INDEX ON (status, next_retry_at)
```

### Feature Flags

```
flowwatch_feature_flags
  id                  uuid  primary key
  key                 text  UNIQUE not null
  description         text
  enabled             boolean default false
  rollout_percentage  int   default 0  (0–100)
  created_at          timestamptz
  updated_at          timestamptz

flowwatch_feature_flag_rules
  id          uuid  primary key
  flag_id     uuid  → flowwatch_feature_flags (CASCADE)
  attribute   text  not null   (e.g. "plan", "email", "region")
  operator    text  not null   (e.g. "equals", "contains", "ends_with")
  value       jsonb not null
  enabled     boolean default true

flowwatch_feature_flag_audit_logs
  id          uuid  primary key
  flag_id     uuid  → flowwatch_feature_flags (SET NULL on delete)
  action      text  (created | updated | deleted | toggled)
  before      jsonb
  after       jsonb
  changed_by  text
  created_at  timestamptz
```

### Traces and Errors

```
flowwatch_request_traces
  id           uuid  primary key
  method       text
  path         text
  status_code  int
  duration_ms  int
  user_id      text
  ip           text
  user_agent   text
  metadata     jsonb
  created_at   timestamptz

flowwatch_trace_spans
  id             uuid  primary key
  trace_id       uuid  → flowwatch_request_traces (CASCADE)
  parent_span_id uuid  → flowwatch_trace_spans (SET NULL)  ← self-referencing for parent/child
  name           text
  type           text  (database | http | service | workflow)
  status         text  (ok | error)
  duration_ms    int
  metadata       jsonb
  started_at     timestamptz
  ended_at       timestamptz

flowwatch_errors
  id           uuid  primary key
  trace_id     uuid  → flowwatch_request_traces (SET NULL)
  span_id      uuid  → flowwatch_trace_spans (SET NULL)
  source       text
  category     text  (server | client | database | dependency)
  level        text  (info | warning | error | fatal)
  message      text
  stack        text
  name         text
  status_code  int
  fingerprint  text  (SHA-256 hash — used for grouping duplicate errors)
  metadata     jsonb
  occurred_at  timestamptz
```

### Elasticsearch Indices

If Elasticsearch is connected, FlowWatch also creates two indices:

| Index | Contents |
| :--- | :--- |
| `flowwatch_errors` | All captured errors, mirrored from Postgres for full-text search |
| `flowwatch_trace_spans` | All trace spans, mirrored from Postgres for fast filtering and search |

Postgres is always the source of truth. Elasticsearch is the search layer. If ES goes down, FlowWatch falls back to Postgres queries automatically.

---

## License

ISC — free to use, modify, and distribute.
