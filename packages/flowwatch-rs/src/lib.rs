use reqwest::{Client, header};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Clone)]
pub struct FlowwatchClient {
    http: Client,
    base_url: String,
}

#[derive(Deserialize)]
pub struct FlagResult {
    pub enabled: bool,
}

#[derive(Deserialize)]
pub struct HealthResult {
    pub status: String,
}

#[derive(Serialize)]
struct CaptureErrorBody<'a> {
    error: ErrorPayload<'a>,
    options: ErrorOptions<'a>,
}

#[derive(Serialize)]
struct ErrorPayload<'a> {
    message: &'a str,
    name: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    stack: Option<&'a str>,
}

#[derive(Serialize)]
struct ErrorOptions<'a> {
    source: &'a str,
}

impl FlowwatchClient {
    pub fn new(base_url: &str, token: Option<&str>) -> Self {
        let mut builder = Client::builder();
        if let Some(t) = token {
            let mut headers = header::HeaderMap::new();
            headers.insert(
                header::AUTHORIZATION,
                header::HeaderValue::from_str(&format!("Bearer {t}")).unwrap(),
            );
            builder = builder.default_headers(headers);
        }
        Self {
            http: builder.build().unwrap(),
            base_url: base_url.trim_end_matches('/').to_owned(),
        }
    }

    pub async fn flag(&self, key: &str, context: Option<Value>) -> reqwest::Result<bool> {
        let body = serde_json::json!({ "key": key, "context": context.unwrap_or(Value::Object(Default::default())) });
        let r: Value = self.http
            .post(format!("{}/api/flag", self.base_url))
            .json(&body)
            .send().await?
            .error_for_status()?
            .json().await?;
        Ok(r["enabled"].as_bool().unwrap_or(false))
    }

    pub async fn trigger(&self, name: &str, input: Option<Value>) -> reqwest::Result<Value> {
        let body = serde_json::json!({ "name": name, "input": input });
        self.http
            .post(format!("{}/api/trigger", self.base_url))
            .json(&body)
            .send().await?
            .error_for_status()?
            .json().await
    }

    pub async fn trace_span(&self, name: &str, r#type: &str, duration_ms: u64,
        metadata: Option<Value>, status: &str) -> reqwest::Result<()> {
        let body = serde_json::json!({
            "name": name, "type": r#type,
            "durationMs": duration_ms,
            "metadata": metadata.unwrap_or(Value::Object(Default::default())),
            "status": status,
        });
        self.http
            .post(format!("{}/api/trace-span", self.base_url))
            .json(&body)
            .send().await?
            .error_for_status()?;
        Ok(())
    }

    pub async fn capture_error(&self, message: &str, source: &str,
        name: &str, stack: Option<&str>) -> reqwest::Result<Value> {
        let body = CaptureErrorBody {
            error: ErrorPayload { message, name, stack },
            options: ErrorOptions { source },
        };
        self.http
            .post(format!("{}/api/capture-error", self.base_url))
            .json(&body)
            .send().await?
            .error_for_status()?
            .json().await
    }

    pub async fn health(&self) -> reqwest::Result<HealthResult> {
        self.http
            .get(format!("{}/api/health", self.base_url))
            .send().await?
            .error_for_status()?
            .json().await
    }
}
