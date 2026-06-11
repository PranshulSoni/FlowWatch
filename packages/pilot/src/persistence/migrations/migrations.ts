export interface Migration {
  name: string
  up: string
}



export const migrations:Migration[] = [
    {
        name: "001_create_workflow_tables",
        up: `CREATE TABLE IF NOT EXISTS pilot_workflows (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pilot_workflows_name_version_unique UNIQUE (name, version)
);

CREATE TABLE IF NOT EXISTS pilot_workflow_steps (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES pilot_workflows(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  max_retries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pilot_workflow_steps_workflow_step_index_unique UNIQUE (workflow_id, step_index),
  CONSTRAINT pilot_workflow_steps_workflow_name_unique UNIQUE (workflow_id, name)
);

CREATE TABLE IF NOT EXISTS pilot_workflow_executions (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES pilot_workflows(id),
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

CREATE TABLE IF NOT EXISTS pilot_workflow_step_executions (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES pilot_workflow_executions(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES pilot_workflow_steps(id),
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

  CONSTRAINT pilot_workflow_step_executions_execution_step_index_unique UNIQUE (execution_id, step_index)
);

CREATE INDEX IF NOT EXISTS pilot_workflow_executions_workflow_status_idx
ON pilot_workflow_executions (workflow_name, status);

CREATE INDEX IF NOT EXISTS pilot_workflow_executions_created_at_idx
ON pilot_workflow_executions (created_at DESC);

CREATE INDEX IF NOT EXISTS pilot_workflow_step_executions_execution_idx
ON pilot_workflow_step_executions (execution_id, step_index);

CREATE INDEX IF NOT EXISTS pilot_workflow_step_executions_status_retry_idx
ON pilot_workflow_step_executions (status, next_retry_at);`
    }
,
    {
        name: "002_create_feature_flag_tables",
        up: `CREATE TABLE IF NOT EXISTS pilot_feature_flags (
  id UUID PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pilot_feature_flags_rollout_percentage_check
  CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

CREATE TABLE IF NOT EXISTS pilot_feature_flag_rules (
  id UUID PRIMARY KEY,
  flag_id UUID NOT NULL REFERENCES pilot_feature_flags(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL,
  operator TEXT NOT NULL,
  value JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pilot_feature_flag_audit_logs (
  id UUID PRIMARY KEY,
  flag_id UUID REFERENCES pilot_feature_flags(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  changed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pilot_feature_flag_rules_flag_id_idx
ON pilot_feature_flag_rules (flag_id);

CREATE INDEX IF NOT EXISTS pilot_feature_flag_audit_logs_flag_id_created_at_idx
ON pilot_feature_flag_audit_logs (flag_id, created_at DESC);`
    }
];
