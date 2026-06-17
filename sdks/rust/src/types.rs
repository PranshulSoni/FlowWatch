use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Serialize)]
pub struct TraceSpanOptions {
    pub name: String,
    #[serde(rename = "type")]
    pub span_type: String,
    #[serde(rename = "durationMs")]
    pub duration_ms: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, Value>>,
}

#[derive(Debug, Serialize)]
pub struct CaptureErrorOptions {
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stack: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TriggerResult {
    #[serde(rename = "executionId")]
    pub execution_id: String,
}
