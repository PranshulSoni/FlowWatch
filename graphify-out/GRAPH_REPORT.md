# Graph Report - .  (2026-06-18)

## Corpus Check
- 49 files · ~79,304 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 312 nodes · 435 edges · 42 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `escapeHtml()` - 15 edges
2. `renderAll()` - 11 edges
3. `FlowwatchClient` - 11 edges
4. `AsyncFlowwatchClient` - 11 edges
5. `asIso()` - 10 edges
6. `validateConfig()` - 9 edges
7. `isObject()` - 9 edges
8. `tableEmptyRow()` - 8 edges
9. `apiRequest()` - 7 edges
10. `isNonEmptyString()` - 7 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (55): allExecutionsForWorkflow(), apiPath(), apiRequest(), badgeForMethod(), badgeForStatus(), badgeForStepStatus(), clearAiChat(), closeDrawer() (+47 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (4): AsyncFlowwatchClient, Async FlowWatch sidecar client. Use as an async context manager for connection c, trace_span(), Client

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (3): markWorkflowExecutionFailed(), markWorkflowStepFailed(), serializeError()

### Community 3 - "Community 3"
Cohesion: 0.26
Nodes (12): asIso(), durationBetween(), formatDashboardDateTime(), formatDashboardTime(), formatDuration(), serializeAuditLog(), serializeError(), serializeExecution() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (8): CaptureErrorOptions, flagResponse, TraceSpanOptions, TriggerResult, FlowwatchClient, CaptureErrorOptions, TraceSpanOptions, TriggerResult

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (5): createDashboardRouter(), idParamSchema(), validate(), validateParams(), validateQuery()

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (3): getFlagByKey(), listAuditLogs(), listFlagRules()

### Community 7 - "Community 7"
Cohesion: 0.5
Nodes (11): isNonEmptyString(), isObject(), validateConfig(), validateDashboardConfig(), validateDbConfig(), validateElasticsearchConfig(), validateMigrationsConfig(), validatePositiveInteger() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (2): FlowwatchClient, Synchronous FlowWatch sidecar client. Use as a context manager for connection cl

### Community 9 - "Community 9"
Cohesion: 0.36
Nodes (8): askGroqAi(), generateGroqInsight(), isServerObservabilityQuestion(), normalizeInsight(), outOfScopeFlowwatchResponse(), parseInsightJson(), sanitizeChatHistory(), selectedModel()

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (8): buildEnvFile(), getFlowwatchEnvPath(), getGroqApiKey(), isGroqApiKeyConfigured(), loadFlowwatchEnv(), parseEnvFile(), readEnvFile(), saveFlowwatchEnv()

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (6): captureError(), createErrorFingerprint(), createErrorHandler(), getErrorCategory(), getStatusCode(), normalizeError()

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.4
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.6
Nodes (3): createMigrationsTable(), runMigrations(), withMigrationLock()

### Community 16 - "Community 16"
Cohesion: 0.4
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 0.4
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.83
Nodes (3): ensureDatabaseExists(), main(), quotePostgresIdentifier()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.83
Nodes (3): createRequestTracingMiddleware(), getClientIp(), normalizeClientIp()

### Community 22 - "Community 22"
Cohesion: 0.83
Nodes (3): createErrorMappingIfMissing(), createMissingMappings(), createTraceMappingIfMissing()

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (2): evaluateFlag(), ruleMatches()

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (2): normalizeConfig(), normalizeWorkerConfig()

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (2): createSidecarRouter(), startSidecar()

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): Auto-times the wrapped block and submits a trace span on exit.

## Knowledge Gaps
- **10 isolated node(s):** `TraceSpanOptions`, `CaptureErrorOptions`, `TriggerResult`, `flagResponse`, `Synchronous FlowWatch sidecar client. Use as a context manager for connection cl` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 31`** (2 nodes): `errorHandling.ts`, `setupErrorHandling()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `flags.ts`, `setupFlags()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `tracing.ts`, `setupTracing()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `createFlowwatch.ts`, `createFlowwatch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `flagEngine.ts`, `createFlagEngine()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `hashRollout.ts`, `getRolloutBucket()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `transaction.ts`, `withTransaction()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `redisClient.ts`, `createRedisClient()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `postgres.ts`, `createPostgresPool()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `migrations.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `Auto-times the wrapped block and submits a trace span on exit.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FlowwatchClient` connect `Community 8` to `Community 1`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `TraceSpanOptions`, `CaptureErrorOptions`, `TriggerResult` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._