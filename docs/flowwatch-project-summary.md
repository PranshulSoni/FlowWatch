# Flowwatch Project Summary

## Project Name

Flowwatch

## What Flowwatch Is

Flowwatch is an open-source npm package for Express/Node.js backends. Developers install it into an existing backend and get an embedded operations layer with:

- Durable workflows
- Feature flags
- Error capture
- Dashboard + internal API

The dashboard is mounted inside the user's Express app:

```ts
const flowwatch = await createFlowwatch(config)

app.use("/flowwatch", flowwatch.dashboard)
```

Flowwatch uses the user's own infrastructure:

```txt
Postgres = source of truth
Redis = queue/cache layer
BullMQ = background job execution
Elasticsearch = search
Express = dashboard/internal API mounting
```

## Current Project Direction

The project is being built guidance-first and in small vertical slices. The goal is to avoid random coding and make each piece fit the system design.

## Completed Slice 1: Setup + Health Shell

Current flow:

```txt
createFlowwatch(config)
  -> validateConfig(config)
  -> normalizeConfig(config)
  -> create dashboard router
  -> return { dashboard }
```

Important files:

```txt
packages/flowwatch/src/index.ts
packages/flowwatch/src/createFlowwatch.ts
packages/flowwatch/src/types/index.ts
packages/flowwatch/src/runtime/config/validationConfig.ts
packages/flowwatch/src/runtime/config/normalizeConfig.ts
packages/flowwatch/src/dashboard/routes/router.ts
```

## Current Config Shape

```ts
createFlowwatch({
  db: {
    connectionString: process.env.DATABASE_URL
  },
  redis: {
    url: process.env.REDIS_URL
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL
  },
  dashboard: {
    path: "/flowwatch"
  },
  worker: {
    enabled: true
  },
  migrations: {
    autoRun: false
  },
  runtime: {
    serviceName: "my-api",
    environment: "development"
  }
})
```

## Completed Slice 2: Basic Infra Health

Health endpoint:

```txt
GET /flowwatch/api/health
```

Currently checks:

```txt
Postgres -> SELECT 1
Redis -> PING
Elasticsearch -> ping()
```

Response shape:

```json
{
  "status": "ok",
  "serviceName": "flowwatch",
  "checks": {
    "postgres": {
      "status": "ok",
      "latencyMs": 4
    },
    "redis": {
      "status": "ok",
      "latencyMs": 2
    },
    "elasticsearch": {
      "status": "ok",
      "latencyMs": 8
    }
  }
}
```

Top-level status:

```txt
ok       if all checks pass
degraded if any check fails
```

## Current Design Rules

```txt
Postgres owns truth.
Redis/BullMQ execute background work.
Elasticsearch is for search, not truth.
Dashboard routes should not own core business logic.
createFlowwatch wires dependencies once during startup.
Do not create DB/Redis/Elastic clients per request.
```

## Workflow Design Discussion

Workflows need definition tables and execution tables.

Definition side:

```txt
flowwatch_workflows
flowwatch_workflow_steps
```

Execution/runtime side:

```txt
flowwatch_workflow_executions
flowwatch_workflow_step_executions
```

Important distinction:

```txt
Workflow definition = blueprint
Workflow execution = one actual run
```

Example:

```txt
Definition:
order-created has steps charge-card, deduct-inventory, create-order

Execution:
order-created for order_123 failed at create-order
```

Do not store actual JavaScript functions in Postgres. Store stable step names/pointers. Actual functions live in the runtime registry.

## Next Major Step: Migrations

Before workflow persistence, create a migration system.

Migration responsibilities:

```txt
1. Ensure flowwatch_migrations table exists.
2. Read applied migrations.
3. Run pending migrations in order.
4. Record applied migrations.
```

First migration should create workflow tables.

Recommended location:

```txt
packages/flowwatch/src/persistence/migrations/
```

Potential files:

```txt
migrationRunner.ts
migrations.ts
```

Tables should use the `flowwatch_` prefix to avoid colliding with user app tables.

## Build Philosophy

Build in vertical slices:

```txt
1. Setup + health shell
2. Real infra health
3. Migrations + workflow tables
4. Workflow registry + trigger persistence
5. BullMQ workflow execution
6. Workflow dashboard APIs
7. Feature flags
8. Error capture
9. React dashboard
```

Do not overbuild all engines first. Build one feature end-to-end at a time.

## Strategic Differentiators

Do not prioritize a visual drag-and-drop workflow builder for MVP. It is large frontend scope and not a strong differentiator anymore. Use simple dashboard views first.

Possible future differentiator:

```txt
Event-driven workflow execution using PostgreSQL LISTEN/NOTIFY.
```

This could reduce latency compared with polling-based queues. Flowwatch is not serverless-first, so persistent DB connections are acceptable. Keep BullMQ for the current MVP and investigate LISTEN/NOTIFY later.

Strongest long-term differentiator:

```txt
Diff-based workflow recovery and replay.
```

Future idea:

```txt
Detect workflow definition changes between versions.
Show what changed.
Select failed or affected executions.
Replay them using new code.
Skip steps that already completed correctly.
```

The current schema direction with workflow versions should preserve room for this.
