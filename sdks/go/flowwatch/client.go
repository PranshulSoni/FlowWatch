package flowwatch

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// Client is a FlowWatch sidecar client.
type Client struct {
	BaseURL string
	token   string
	http    *http.Client
}

// New creates a FlowWatch client. Pass an empty string for token if the sidecar has no auth.
func New(baseURL, token string) *Client {
	return &Client{BaseURL: baseURL, token: token, http: &http.Client{}}
}

func (c *Client) do(ctx context.Context, method, path string, body any, out any) error {
	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.BaseURL+path, bodyReader)
	if err != nil {
		return err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("flowwatch: %s %s → %d: %s", method, path, resp.StatusCode, b)
	}
	if out != nil {
		return json.NewDecoder(resp.Body).Decode(out)
	}
	return nil
}

// EvaluateFlag returns whether the feature flag key is enabled for the given context.
func (c *Client) EvaluateFlag(ctx context.Context, key string, flagCtx map[string]any) (bool, error) {
	var result flagResponse
	err := c.do(ctx, http.MethodPost, "/api/flag", map[string]any{"key": key, "context": flagCtx}, &result)
	return result.Enabled, err
}

// TriggerWorkflow starts a durable workflow execution and returns its ID.
func (c *Client) TriggerWorkflow(ctx context.Context, name string, input any) (TriggerResult, error) {
	var result TriggerResult
	err := c.do(ctx, http.MethodPost, "/api/trigger", map[string]any{"name": name, "input": input}, &result)
	return result, err
}

// LogTraceSpan submits a pre-timed trace span.
func (c *Client) LogTraceSpan(ctx context.Context, opts TraceSpanOptions) error {
	if opts.Status == "" {
		opts.Status = "ok"
	}
	return c.do(ctx, http.MethodPost, "/api/trace-span", opts, nil)
}

// CaptureError reports an error with optional stack trace and metadata.
func (c *Client) CaptureError(ctx context.Context, opts CaptureErrorOptions) error {
	name := opts.Name
	if name == "" {
		name = "Error"
	}
	return c.do(ctx, http.MethodPost, "/api/capture-error", map[string]any{
		"error":   map[string]any{"message": opts.Message, "name": name, "stack": opts.Stack},
		"options": map[string]any{"source": opts.Source},
	}, nil)
}

// Health returns the sidecar's liveness status.
func (c *Client) Health(ctx context.Context) (map[string]any, error) {
	var result map[string]any
	err := c.do(ctx, http.MethodGet, "/api/health", nil, &result)
	return result, err
}
