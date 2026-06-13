# Pilot Dashboard UI Prompt

Design a dashboard UI for **Pilot**, an embedded backend reliability SDK for Node.js/Express applications.

Pilot helps developers manage and observe:

- Durable workflows
- Background executions
- Feature flags
- Request traces
- Error reporting
- Infrastructure health

The dashboard is not a marketing page. It should feel like an internal developer tool: dense, practical, fast to scan, and useful during debugging.

## Product Context

Pilot is installed inside a user's backend application.

Example usage:

```ts
const pilot = await createPilot(config)

app.use(pilot.requestTracer)
app.use("/pilot", pilot.dashboard)
app.use(pilot.errorHandler)

await pilot.workflow("checkout", [
  {
    name: "charge-card",
    input: { amount: 1200 },
    run: async (input) => {}
  },
  {
    name: "create-order",
    input: { userId: "user_123" },
    run: async (input) => {}
  }
])

await pilot.trigger("checkout")

const enabled = await pilot.flag("new-checkout", {
  userId: "user_123"
})
```

The dashboard should help the developer answer:

- Is my system healthy?
- Which workflows exist?
- Which workflow executions failed?
- Which step failed and why?
- Which feature flags are enabled?
- Which users are receiving a flag rollout?
- What errors happened recently?
- Which request trace caused an error?
- Can I search errors and traces quickly?

## Overall UI Style

The interface should be a serious backend operations dashboard.

Use:

- Clean sidebar navigation
- Compact tables
- Status badges
- Filters
- Search inputs
- Timeline views
- Detail drawers or detail pages
- Clear empty states
- Muted colors with strong status accents

Avoid:

- Marketing-style hero sections
- Oversized cards
- Decorative gradients
- Unnecessary illustrations
- Large empty spacing
- Explainer text inside the app

The visual tone should be similar to tools like Datadog, Sentry, Grafana, Trigger.dev, Inngest, or Stripe internal dashboards, but simpler.

## Navigation

Create a persistent left sidebar with these sections:

1. Overview
2. Workflows
3. Executions
4. Feature Flags
5. Errors
6. Traces
7. Health
8. Settings

The main content area should have a top bar containing:

- Current service name
- Environment selector
- Global search
- Time range selector
- Refresh button

## Page 1: Overview

The overview page should show the current state of the backend.

Include compact metric panels for:

- Total workflows
- Running executions
- Failed executions
- Recent errors
- Active feature flags
- Average request latency

Below the metrics, show:

- Recent workflow executions table
- Recent errors table
- Infrastructure health summary

Each row should be clickable and open the correct detail page.

## Page 2: Workflows

This page lists registered workflows.

Table columns:

- Workflow name
- Version
- Step count
- Created at
- Last execution status
- Last executed at
- Total executions
- Failed executions

Clicking a workflow opens a workflow detail view.

Workflow detail should show:

- Workflow metadata
- Step list ordered by step index
- Step names
- Retry limits
- Recent executions for this workflow

Important: workflows are registered through code using `pilot.workflow(...)`, not created from the dashboard. So this page should not have a "Create Workflow" button.

## Page 3: Executions

This page lists workflow executions.

Table columns:

- Execution ID
- Workflow name
- Status
- Started at
- Finished at
- Duration
- Failed step
- Attempts

Filters:

- Status
- Workflow name
- Date range
- Failed only

Execution statuses:

- queued
- running
- completed
- failed

Clicking an execution opens an execution detail view.

Execution detail should show:

- Execution metadata
- Input payload
- Output payload if available
- Step-by-step timeline
- Each step's status
- Each step's input
- Error message if failed
- Retry count
- Started and finished timestamps

The timeline should make it obvious where the workflow stopped.

## Page 4: Feature Flags

This page manages feature flags.

Table columns:

- Flag key
- Enabled status
- Rollout percentage
- Rule count
- Last changed at
- Last changed by

Actions:

- Create flag
- Edit flag
- Delete flag
- Add rule
- Edit rule
- Delete rule

Flag detail should show:

- Flag key
- Description
- Enabled toggle
- Rollout percentage input or slider
- Rules table
- Audit log

Rules table columns:

- Attribute
- Operator
- Value
- Enabled
- Created at

Supported rule examples:

- `country equals IN`
- `plan equals pro`
- `email contains @company.com`

The UI should make it clear that rollout is deterministic, not random every request. The same user should consistently receive the same result for a given flag.

## Page 5: Errors

This page shows captured errors.

Errors can come from:

- Express error middleware
- Workflow failures
- Feature flag evaluation failures
- Trace callback failures
- Manual `pilot.captureError(...)`

Table columns:

- Error message
- Error name
- Category
- Level
- Source
- Status code
- Occurred at
- Trace ID
- Span ID

Filters:

- Category
- Level
- Source
- Date range

Categories:

- client
- server
- dependency
- database
- configuration

Levels:

- info
- warning
- error
- critical

Error detail should show:

- Full message
- Stack trace
- Metadata
- Fingerprint
- Linked trace
- Linked span
- Occurred at

Include a search box powered by Elasticsearch for searching error messages, stack traces, source, and metadata.

## Page 6: Traces

This page shows request traces and spans.

A request trace represents one incoming HTTP request.
A span represents one operation inside that request, such as:

- feature flag evaluation
- workflow trigger
- workflow step execution
- custom `pilot.trace(...)` block

Trace list columns:

- Trace ID
- Method
- Path
- Status code
- Duration
- IP address
- Created at

Trace detail should show:

- Request metadata
- Timeline of spans
- Span name
- Span type
- Span status
- Duration
- Linked errors

Span types:

- workflow
- workflow_step
- feature_flag
- database
- external_api
- custom

The trace detail page should help answer:

- What happened during this request?
- Which operation was slow?
- Which span failed?
- Which error belongs to this trace?

## Page 7: Health

This page shows infrastructure health.

Health checks:

- Postgres
- Redis
- Elasticsearch

For each service show:

- Status
- Latency
- Last checked time
- Error message if unhealthy

Use clear status colors:

- Green: healthy
- Yellow: degraded
- Red: down

## Page 8: Settings

Settings should be simple.

Show read-only configuration information:

- Service name
- Dashboard path
- Worker enabled
- Queue prefix
- Migration table name
- Runtime environment

Do not expose secrets.
Do not show database passwords, Redis URLs, Elasticsearch credentials, tokens, or API keys.

## Important UX Requirements

The dashboard should support:

- Fast scanning
- Clear status visibility
- Clickable rows
- Detail views for debugging
- Search for errors and traces
- Filters for noisy tables
- Empty states when no data exists
- Loading states
- Error states

The UI should be built for developers who are debugging production backend behavior.

## Data Model Awareness

The UI should assume these backend concepts exist:

### Workflows

- `pilot_workflows`
- `pilot_workflow_steps`
- `pilot_workflow_executions`
- `pilot_workflow_step_executions`

### Feature Flags

- feature flags
- feature flag rules
- feature flag audit logs

### Observability

- request traces
- trace spans
- errors
- Elasticsearch indexes for searching traces and errors

## Design Priority

The highest priority screens are:

1. Workflow execution detail
2. Errors list and error detail
3. Traces list and trace detail
4. Feature flag management
5. Health overview

Workflow execution detail is the most important screen because Pilot's core value is showing exactly where a backend workflow failed and what completed before the failure.

## Final Goal

Create a polished internal dashboard that makes Pilot feel like a real backend reliability product.

The user should be able to open `/pilot`, immediately understand system health, inspect workflow failures, manage feature flags, search errors, and trace requests without reading documentation.
