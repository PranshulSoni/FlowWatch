# Pilot — Project Details

---

## What It Is

Pilot is an open-source npm package for Node.js backends. Developers install it into their existing Express application and get three production-grade capabilities immediately — durable workflow execution, feature flags, and error capture — all running inside their own app, stored in their own database, with a visual dashboard served from their own server.

No external services. No monthly bill. No separate infrastructure to manage. One npm install.

---

## The Problem It Solves

Every backend developer faces three specific nightmares after they deploy their application to production:

---

### Nightmare 1 — Something breaks and you are blind

A user places an order. Your backend runs five steps — charge the card, deduct inventory, create the order, send a confirmation email, notify the warehouse. Step three crashes due to a rare database timeout. The card was charged. The inventory was deducted. But no order was created. No email was sent. No warehouse was notified.

The user wakes up with money gone and no order. You wake up with no idea this happened. Your server is running fine. There is no alarm. You find out hours later from a support ticket. You dig through thousands of lines of raw server logs trying to piece together what went wrong.

This is the visibility nightmare. You are flying blind after deployment.

---

### Nightmare 2 — You cannot safely test new features

You have written a new feature. You want to show it to 10% of your users first, watch how it performs, and roll it out to everyone only if it works. Your only options right now are deploying two separate versions of your backend or writing messy if/else conditions in your code that require a full redeployment every time you want to change the percentage or turn the feature off.

This is the control nightmare. You cannot change what your running application does without redeploying it.

---

### Nightmare 3 — Background tasks fail and corrupt your data

Your app has multi-step background processes. User signs up, you need to create their account, send a welcome email, set up their workspace, add them to a mailing list, and notify your Slack. These run in the background after the user registers. If your server crashes after step two, the welcome email was sent but the workspace was never created. The user logs in to a broken account. If you retry from the beginning, they get two welcome emails.

There is no clean answer today. Most developers hope these steps never fail. When they do, they manually fix broken data in production — which is as dangerous as it sounds.

This is the durability nightmare. Multi-step background processes are fragile and when they fail your data ends up in broken half-finished states.

---

## What Developers Use Today

**Sentry** — solves Nightmare 1 partially. Captures errors and shows them in a dashboard. Costs $26 per month minimum, scales to hundreds per month at scale. Your error data lives on their servers.

**LaunchDarkly** — solves Nightmare 2. Feature flags without redeploying. Costs $10 per user per month. A team of 10 developers pays $100 per month just for feature flags.

**Temporal** — solves Nightmare 3. Durable workflow execution. Requires running a completely separate Temporal server cluster alongside your application. Another piece of infrastructure to manage, another thing that can break, another cloud bill.

A developer solving all three nightmares is paying $150 or more per month, managing three separate integrations, sending their data to three external companies, and maintaining a separate server cluster. This is the current reality for any serious backend developer. It is expensive, fragmented, and complex.

---

## What Pilot Provides

### Durable Workflows

Developers define multi-step background processes as workflows. Each step's result is saved to the database before the next step begins. If the server crashes mid-workflow, execution resumes automatically from the last completed step when the server restarts — not from the beginning. Steps that fail are retried automatically with configurable delays between attempts. Data never ends up in a broken half-finished state.

The same fragile background process that used to silently corrupt data becomes bulletproof. A step cannot run twice. A step cannot be skipped. Every execution either completes or retries until it does.

---

### Feature Flags

Developers define feature flags once in their code. From that point forward they control those flags from the dashboard without touching code or triggering a redeployment. A flag can be turned on or off instantly, rolled out to a specific percentage of users, targeted at specific roles or user IDs, and rolled back immediately if something goes wrong. The messy if/else conditions in code are replaced by a single flag check. The deployment required to change a rollout percentage is replaced by moving a slider in the dashboard.

---

### Error Capture

Zero additional code required from the developer. The moment Pilot is added to an application it automatically captures every unhandled error that occurs anywhere in the backend. For each error it captures the full stack trace, which user triggered it, what HTTP request they were making, what environment the server is running in, and the exact timestamp. Everything is stored in the developer's own database and made searchable in the dashboard. No more digging through raw server logs. No more finding out about broken orders from angry support tickets.

---

### The Dashboard

A full visual web application served directly from the developer's own Express app at `/pilot`. No separate deployment. No separate hosting. It ships inside the npm package as compiled static files and is served automatically when Pilot is set up.

**Workflows tab** — every defined workflow shown as a visual node graph. Each node represents a step. The developer can see every past execution, click into any one of them, and see exactly what happened at each step — how long it took, what the input was, what the output was, and if it failed, exactly what the error was and how many retry attempts were made.

**Flags tab** — every feature flag with its current state. Toggle any flag on or off with one click. Adjust rollout percentages. Target specific users or roles. See in real time what percentage of users are currently seeing each feature.

**Errors tab** — every captured error in a searchable, filterable feed. Filter by time range, by user, by endpoint. Click any error to see the complete stack trace and every piece of context captured at the moment it occurred.

---

## Developer Experience

Setup is three lines:

```ts
import { createPilot } from "pilot"

const pilot = await createPilot({
  db: postgresConnection
})

app.use("/pilot", pilot.dashboard)
```

Defining a workflow:

```ts
pilot.workflow("user-signup", [
  { name: "create-account",     run: createAccount,     retries: 3 },
  { name: "send-welcome-email", run: sendWelcomeEmail,  retries: 3 },
  { name: "setup-workspace",    run: setupWorkspace,    retries: 3 },
  { name: "add-to-mailinglist", run: addToMailingList,  retries: 2 },
  { name: "notify-slack",       run: notifySlack,       retries: 1 },
])

// Trigger it anywhere in your app
await pilot.trigger("user-signup", { userId: "abc123" })
```

Using a feature flag:

```ts
const useNewAlgorithm = await pilot.flag("new-recommendation-algo", { userId })

if (useNewAlgorithm) {
  return newRecommendationAlgorithm(userId)
} else {
  return oldRecommendationAlgorithm(userId)
}
```

Error capture is automatic. No code needed beyond the initial setup.

---

## Why Nothing Else Does This

Every existing tool solves one of these problems in isolation. None solve all three. And none are embeddable — they are all external services that require sending data to their servers and paying monthly to access it.

Sentry cannot give durable workflows. Temporal cannot give feature flags. LaunchDarkly cannot capture errors. And none of them can do all three together in a single npm install that runs inside the developer's own app and stores data in their own database.

| | Pilot | Sentry | LaunchDarkly | Temporal |
|---|---|---|---|---|
| Durable workflows | ✓ | ✗ | ✗ | ✓ |
| Feature flags | ✓ | ✗ | ✓ | ✗ |
| Error capture | ✓ | ✓ | ✗ | ✗ |
| Unified dashboard | ✓ | ✗ | ✗ | ✗ |
| Self-hostable | ✓ | ✗ | ✗ | Partial |
| Your own database | ✓ | ✗ | ✗ | ✗ |
| Zero extra infrastructure | ✓ | ✗ | ✗ | ✗ |
| Monthly cost | $0 | $26+ | $100+ | Cloud costs |
| One npm install | ✓ | ✗ | ✗ | ✗ |

---

## Who It Is For

Backend developers and small engineering teams who are building serious Node.js applications and need production-grade tooling without the cost or complexity of managing multiple external services. Developers who want their operational data — errors, workflow state, feature flags — stored in their own database under their own control. Teams who are self-hosting their stack and want their tooling to match that philosophy.

---

## Stack

- **Runtime:** Node.js, TypeScript
- **Framework:** Express
- **Database:** PostgreSQL
- **Queue:** BullMQ + Redis
- **Search:** Elasticsearch
- **Cache:** Redis
- **Dashboard:** React, ReactFlow

---

## The One Sentence

> One npm package that gives your Node.js backend durable workflows, feature flags, and error capture — with a unified visual dashboard — all stored in your own database, with no external services and no monthly bill.
