import type { FlowwatchConfig } from "../../types/index.js"

export function validateConfig(config: unknown): FlowwatchConfig{
  if (!isObject(config)) {
    throw new Error("config must be an object")
  }

  validateDbConfig(config.db)
  validateRedisConfig(config.redis)
  validateElasticsearchConfig(config.elasticsearch)
  validateDashboardConfig(config.dashboard)
  validateWorkerConfig(config.worker)
  validateMigrationsConfig(config.migrations)
  validateRuntimeConfig(config.runtime)

  return config as unknown as FlowwatchConfig
}

function validateDbConfig(db:unknown){
  if (!isObject(db)) {
    throw new Error("config db must be an object")
  }
}

function validateRedisConfig(redis: unknown){
  if (!isObject(redis)) {
    throw new Error("config redis must be an object")
  }

  if (!isNonEmptyString(redis.url)) {
    throw new Error("config redis.url must be a non-empty string")
  }
}

function validateElasticsearchConfig(elasticsearch:unknown){
  if (!isObject(elasticsearch)) {
    throw new Error("config elasticsearch must be an object")
  }

  if (!isNonEmptyString(elasticsearch.node)) {
    throw new Error("config elasticsearch.node must be a non-empty string")
  }
}

function validateDashboardConfig(dashboard: unknown){
  if (dashboard===undefined){
    return
  }

  if (!isObject(dashboard)) {
    throw new Error("config dashboard must be an object")
  }

  if (dashboard.path !== undefined && (!isNonEmptyString(dashboard.path) || !dashboard.path.startsWith("/"))) {
    throw new Error("config dashboard.path must be a non-empty string starting with /")
  }

  if (dashboard.token !== undefined && !isNonEmptyString(dashboard.token)) {
    throw new Error("config dashboard.token must be a non-empty string")
  }

  if (dashboard.auth!==undefined && typeof dashboard.auth!=="function") {
    throw new Error("config dashboard.auth must be a function")
  }

  if (dashboard.enabled!==undefined && typeof dashboard.enabled!=="boolean") {
    throw new Error("config dashboard.enabled must be a boolean")
  }
}

function validateWorkerConfig(worker: unknown){
  if (worker===undefined) {
    return
  }

  if (typeof worker==="boolean") {
    return
  }

  if (!isObject(worker)) {
    throw new Error("config worker must be a boolean or an object")
  }

  if (worker.enabled!==undefined && typeof worker.enabled!=="boolean") {
    throw new Error("config worker.enabled must be a boolean")
  }

  validatePositiveInteger(worker.workflowConcurrency, "worker.workflowConcurrency")
  validatePositiveInteger(worker.errorIndexingConcurrency, "worker.errorIndexingConcurrency")
  validatePositiveInteger(worker.maintenanceConcurrency, "worker.maintenanceConcurrency")

  if (worker.queuePrefix !== undefined && !isNonEmptyString(worker.queuePrefix)) {
    throw new Error("config worker.queuePrefix must be a non-empty string")
  }
}

function validateMigrationsConfig(migrations: unknown){
  if (migrations === undefined) {
    return
  }

  if (!isObject(migrations)) {
    throw new Error("config migrations must be an object")
  }

  if (migrations.autoRun !== undefined && typeof migrations.autoRun !== "boolean") {
    throw new Error("config migrations.autoRun must be a boolean")
  }

  if (migrations.tableName !== undefined && !isNonEmptyString(migrations.tableName)) {
    throw new Error("config migrations.tableName must be a non-empty string")
  }
}

function validateRuntimeConfig(runtime: unknown){
  if (runtime === undefined) {
    return
  }

  if (!isObject(runtime)) {
    throw new Error("config runtime must be an object")
  }

  if (runtime.environment !== undefined && !isNonEmptyString(runtime.environment)) {
    throw new Error("config runtime.environment must be a non-empty string")
  }

  if (runtime.serviceName !== undefined && !isNonEmptyString(runtime.serviceName)) {
    throw new Error("config runtime.serviceName must be a non-empty string")
  }

  if (runtime.debug !== undefined && typeof runtime.debug !== "boolean") {
    throw new Error("config runtime.debug must be a boolean")
  }
}

function validatePositiveInteger(value: unknown, fieldName: string){
  if (value === undefined) {
    return
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`config ${fieldName} must be a positive integer`)
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value==="object" && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}
