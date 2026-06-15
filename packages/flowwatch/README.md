# Flowwatch

Flowwatch is an embedded operations layer for Express backends. It gives a service its own dashboard and internal API for workflow execution, feature flags, error capture, request traces, health checks, and AI-assisted diagnostics.

## Install

```sh
npm install flowwatch
```

If you publish this package under a scoped npm name, install and import that scoped name instead.

## Basic Usage

```ts
import express from "express"
import { createFlowwatch } from "flowwatch"

const app = express()

const flowwatch = await createFlowwatch({
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

app.use("/flowwatch", flowwatch.dashboard)
app.use(flowwatch.errorHandler)

app.listen(3000)
```

The dashboard is available at:

```txt
http://localhost:3000/flowwatch
```

## Public API

- `createFlowwatch(config)` creates the dashboard router and runtime helpers.
- `flowwatch.dashboard` is the Express router for the dashboard and API.
- `flowwatch.workflow(name, steps)` registers a durable workflow definition.
- `flowwatch.trigger(name, input)` starts a workflow execution.
- `flowwatch.flag(key, context)` evaluates a feature flag.
- `flowwatch.trace(name, type, fn)` records a custom trace span around async work.
- `flowwatch.requestTracer` captures request trace context.
- `flowwatch.errorHandler` captures Express errors.
- `flowwatch.captureError(error, options)` captures errors manually.

## Required Infrastructure

Flowwatch uses infrastructure owned by the consuming application:

- Postgres for durable operational data.
- Redis for queue/cache transport.
- BullMQ for background workflow jobs.
- Elasticsearch for searchable errors and traces.

## AI Configuration

AI features use Groq. Set `GROQ_API_KEY` or `FLOWWATCH_GROQ_API_KEY` in the runtime environment before starting the app, or enter the key from the dashboard settings page.

Dashboard-managed Groq settings are stored in the consuming app's `.fw.env` file as `FLOWWATCH_GROQ_API_KEY` and `FLOWWATCH_GROQ_MODEL`.

## Notes

- Do not expose the Flowwatch dashboard publicly without your own authentication layer.
- Add `.fw.env` to `.gitignore` if you use dashboard-managed AI settings.
- Run migrations before using workflow, flag, trace, and error persistence tables.
