package flowwatch

// TraceSpanOptions holds parameters for LogTraceSpan.
type TraceSpanOptions struct {
	Name       string         `json:"name"`
	Type       string         `json:"type"`
	DurationMs float64        `json:"durationMs"`
	Status     string         `json:"status,omitempty"`
	Metadata   map[string]any `json:"metadata,omitempty"`
}

// CaptureErrorOptions holds parameters for CaptureError.
type CaptureErrorOptions struct {
	Message string `json:"message"`
	Name    string `json:"name,omitempty"`
	Stack   string `json:"stack,omitempty"`
	Source  string `json:"source,omitempty"`
}

// TriggerResult is returned by TriggerWorkflow.
type TriggerResult struct {
	ExecutionID string `json:"executionId"`
}

type flagResponse struct {
	Enabled bool `json:"enabled"`
}
