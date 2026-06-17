pub mod types;
pub use types::*;

use reqwest::Client as HttpClient;
use serde_json::{json, Value};
use std::collections::HashMap;

pub type Error = reqwest::Error;
pub type Result<T> = std::result::Result<T, Error>;

pub struct FlowwatchClient {
    http: HttpClient,
    base_url: String,
}

impl FlowwatchClient {
    /// Creates a new client. Pass `None` for token if the sidecar has no auth.
    pub fn new(base_url: impl Into<String>, token: Option<&str>) -> Self {
        let mut headers = reqwest::header::HeaderMap::new();
        if let Some(t) = token {
            headers.insert(
                reqwest::header::AUTHORIZATION,
                format!("Bearer {t}").parse().unwrap(),
            );
        }
        Self {
            http: HttpClient::builder().default_headers(headers).build().unwrap(),
            base_url: base_url.into(),
        }
    }

    pub async fn evaluate_flag(&self, key: &str, context: HashMap<String, Value>) -> Result<bool> {
        let resp = self
            .http
            .post(format!("{}/api/flag", self.base_url))
            .json(&json!({"key": key, "context": context}))
            .send()
            .await?
            .error_for_status()?;
        Ok(resp.json::<Value>().await?["enabled"].as_bool().unwrap_or(false))
    }

    pub async fn trigger_workflow(&self, name: &str, input: Option<Value>) -> Result<TriggerResult> {
        self.http
            .post(format!("{}/api/trigger", self.base_url))
            .json(&json!({"name": name, "input": input}))
            .send()
            .await?
            .error_for_status()?
            .json()
            .await
    }

    pub async fn log_trace_span(&self, opts: TraceSpanOptions) -> Result<()> {
        self.http
            .post(format!("{}/api/trace-span", self.base_url))
            .json(&opts)
            .send()
            .await?
            .error_for_status()?;
        Ok(())
    }

    pub async fn capture_error(&self, opts: CaptureErrorOptions) -> Result<()> {
        self.http
            .post(format!("{}/api/capture-error", self.base_url))
            .json(&json!({
                "error": { "message": opts.message, "name": opts.name, "stack": opts.stack },
                "options": { "source": opts.source }
            }))
            .send()
            .await?
            .error_for_status()?;
        Ok(())
    }

    pub async fn health(&self) -> Result<Value> {
        self.http
            .get(format!("{}/api/health", self.base_url))
            .send()
            .await?
            .error_for_status()?
            .json()
            .await
    }
}
