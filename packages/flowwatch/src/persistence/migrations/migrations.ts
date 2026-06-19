export interface Migration {
  name: string
  up: string
  down?: string
}



export const migrations: Migration[] = [
  {
    name: "001_create_workflow_tables",
    down: `
DROP TABLE IF EXISTS flowwatch_workflow_step_executions;
DROP TABLE IF EXISTS flowwatch_workflow_executions;
DROP TABLE IF EXISTS flowwatch_workflow_steps;
DROP TABLE IF EXISTS flowwatch_workflows;
`,
    up: `CREATE TABLE IF NOT EXISTS flowwatch_workflows (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT flowwatch_workflows_name_version_unique UNIQUE (name, version)
);

CREATE TABLE IF NOT EXISTS flowwatch_workflow_steps (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES flowwatch_workflows(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  max_retries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT flowwatch_workflow_steps_workflow_step_index_unique UNIQUE (workflow_id, step_index),
  CONSTRAINT flowwatch_workflow_steps_workflow_name_unique UNIQUE (workflow_id, name)
);

CREATE TABLE IF NOT EXISTS flowwatch_workflow_executions (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES flowwatch_workflows(id),
  workflow_name TEXT NOT NULL,
  workflow_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  input JSONB,
  output JSONB,
  error JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS flowwatch_workflow_step_executions (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES flowwatch_workflow_executions(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES flowwatch_workflow_steps(id),
  step_index INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL,
  input JSONB,
  output JSONB,
  error JSONB,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  CONSTRAINT flowwatch_workflow_step_executions_execution_step_index_unique UNIQUE (execution_id, step_index)
);

CREATE INDEX IF NOT EXISTS flowwatch_workflow_executions_workflow_status_idx
ON flowwatch_workflow_executions (workflow_name, status);

CREATE INDEX IF NOT EXISTS flowwatch_workflow_executions_created_at_idx
ON flowwatch_workflow_executions (created_at DESC);

CREATE INDEX IF NOT EXISTS flowwatch_workflow_step_executions_execution_idx
ON flowwatch_workflow_step_executions (execution_id, step_index);

CREATE INDEX IF NOT EXISTS flowwatch_workflow_step_executions_status_retry_idx
ON flowwatch_workflow_step_executions (status, next_retry_at);`
  }
  ,
  {
    name: "002_create_feature_flag_tables",
    down: `
DROP TABLE IF EXISTS flowwatch_feature_flag_audit_logs;
DROP TABLE IF EXISTS flowwatch_feature_flag_rules;
DROP TABLE IF EXISTS flowwatch_feature_flags;
`,
    up: `CREATE TABLE IF NOT EXISTS flowwatch_feature_flags (
  id UUID PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT flowwatch_feature_flags_rollout_percentage_check
  CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

CREATE TABLE IF NOT EXISTS flowwatch_feature_flag_rules (
  id UUID PRIMARY KEY,
  flag_id UUID NOT NULL REFERENCES flowwatch_feature_flags(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL,
  operator TEXT NOT NULL,
  value JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flowwatch_feature_flag_audit_logs (
  id UUID PRIMARY KEY,
  flag_id UUID REFERENCES flowwatch_feature_flags(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  changed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flowwatch_feature_flag_rules_flag_id_idx
ON flowwatch_feature_flag_rules (flag_id);

CREATE INDEX IF NOT EXISTS flowwatch_feature_flag_audit_logs_flag_id_created_at_idx
ON flowwatch_feature_flag_audit_logs (flag_id, created_at DESC);`
  },
  {
    name: "003_create_error_capture_tables",
    down: `
DROP TABLE IF EXISTS flowwatch_errors;
DROP TABLE IF EXISTS flowwatch_trace_spans;
DROP TABLE IF EXISTS flowwatch_request_traces;
`,
    up: `CREATE TABLE IF NOT EXISTS flowwatch_request_traces (
  id UUID PRIMARY KEY,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  user_id TEXT,
  ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flowwatch_trace_spans (
  id UUID PRIMARY KEY,
  trace_id UUID NOT NULL REFERENCES flowwatch_request_traces(id) ON DELETE CASCADE,
  parent_span_id UUID REFERENCES flowwatch_trace_spans(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flowwatch_errors (
  id UUID PRIMARY KEY,
  trace_id UUID REFERENCES flowwatch_request_traces(id) ON DELETE SET NULL,
  span_id UUID REFERENCES flowwatch_trace_spans(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  name TEXT,
  status_code INTEGER,
  fingerprint TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flowwatch_request_traces_started_at_idx
ON flowwatch_request_traces (started_at DESC);

CREATE INDEX IF NOT EXISTS flowwatch_request_traces_path_status_idx
ON flowwatch_request_traces (path, status_code);

CREATE INDEX IF NOT EXISTS flowwatch_trace_spans_trace_started_at_idx
ON flowwatch_trace_spans (trace_id, started_at ASC);

CREATE INDEX IF NOT EXISTS flowwatch_trace_spans_parent_span_id_idx
ON flowwatch_trace_spans (parent_span_id);

CREATE INDEX IF NOT EXISTS flowwatch_errors_trace_id_idx
ON flowwatch_errors (trace_id);

CREATE INDEX IF NOT EXISTS flowwatch_errors_span_id_idx
ON flowwatch_errors (span_id);

CREATE INDEX IF NOT EXISTS flowwatch_errors_source_category_idx
ON flowwatch_errors (source, category);

CREATE INDEX IF NOT EXISTS flowwatch_errors_occurred_at_idx
ON flowwatch_errors (occurred_at DESC);

CREATE INDEX IF NOT EXISTS flowwatch_errors_fingerprint_idx
ON flowwatch_errors (fingerprint);`
  }
];
