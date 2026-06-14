# Pilot

Pilot is an embedded operations layer for Express backends. It gives a service its own dashboard and internal API for workflow execution, feature flags, error capture, request traces, health checks, and AI-assisted diagnostics.

## Install

```sh
npm install pilot
```

If you publish this package under a scoped npm name, install and import that scoped name instead.

## Basic Usage

```ts
import express from "express"
import { createPilot } from "pilot"

const app = express()

const pilot = await createPilot({
  db: {
    connectionString: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL ?? "http://localhost:9200",
  },
  runtime: {
    serviceName: "checkout-api",
    environment: process.env.NODE_ENV ?? "development",
  },
  migrations: {
    autoRun: true,
  },
})

app.use("/pilot", pilot.dashboard)
app.use(pilot.errorHandler)

app.listen(3000)
```

The dashboard is available at:

```txt
http://localhost:3000/pilot
```

## Public API

- `createPilot(config)` creates the dashboard router and runtime helpers.
- `pilot.dashboard` is the Express router for the dashboard and API.
- `pilot.workflow(name, steps)` registers a durable workflow definition.
- `pilot.trigger(name, input)` starts a workflow execution.
- `pilot.flag(key, context)` evaluates a feature flag.
- `pilot.trace(name, type, fn)` records a custom trace span around async work.
- `pilot.requestTracer` captures request trace context.
- `pilot.errorHandler` captures Express errors.
- `pilot.captureError(error, options)` captures errors manually.

## Required Infrastructure

Pilot uses infrastructure owned by the consuming application:

- Postgres for durable operational data.
- Redis for queue/cache transport.
- BullMQ for background workflow jobs.
- Elasticsearch for searchable errors and traces.

## AI Configuration

AI features use Groq. Set `GROQ_API_KEY` or `PILOT_GROQ_API_KEY` in the runtime environment before starting the app, or enter the key from the dashboard settings page for the current process.

Pilot does not write API keys to disk. Non-secret model preference may be stored in `.pilot.env` in the consuming app's working directory.

## Notes

- Do not expose the Pilot dashboard publicly without your own authentication layer.
- Add `.pilot.env` to `.gitignore` if you use dashboard-managed AI model preferences.
- Run migrations before using workflow, flag, trace, and error persistence tables.
