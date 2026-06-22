package flowwatch

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	baseURL string
	http    *http.Client
	token   string
}

func New(baseURL string, token string) *Client {
	return &Client{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 10 * time.Second},
		token:   token,
	}
}

func (c *Client) do(method, path string, body any) (*http.Response, error) {
	var buf bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&buf).Encode(body); err != nil {
			return nil, err
		}
	}
	req, err := http.NewRequest(method, c.baseURL+path, &buf)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	return c.http.Do(req)
}

func (c *Client) Flag(key string, context map[string]any) (bool, error) {
	if context == nil {
		context = map[string]any{}
	}
	resp, err := c.do("POST", "/api/flag", map[string]any{"key": key, "context": context})
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return false, fmt.Errorf("flowwatch: flag returned %d", resp.StatusCode)
	}
	var result struct {
		Enabled bool `json:"enabled"`
	}
	return result.Enabled, json.NewDecoder(resp.Body).Decode(&result)
}

func (c *Client) Trigger(name string, input any) (map[string]any, error) {
	resp, err := c.do("POST", "/api/trigger", map[string]any{"name": name, "input": input})
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("flowwatch: trigger returned %d", resp.StatusCode)
	}
	var result map[string]any
	return result, json.NewDecoder(resp.Body).Decode(&result)
}

func (c *Client) TraceSpan(name, spanType string, durationMs int64, metadata map[string]any, status string) error {
	if metadata == nil {
		metadata = map[string]any{}
	}
	if status == "" {
		status = "ok"
	}
	resp, err := c.do("POST", "/api/trace-span", map[string]any{
		"name": name, "type": spanType,
		"durationMs": durationMs, "metadata": metadata, "status": status,
	})
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("flowwatch: trace-span returned %d", resp.StatusCode)
	}
	return nil
}

func (c *Client) CaptureError(message, source, name, stack string) (map[string]any, error) {
	resp, err := c.do("POST", "/api/capture-error", map[string]any{
		"error":   map[string]any{"message": message, "name": name, "stack": stack},
		"options": map[string]any{"source": source},
	})
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("flowwatch: capture-error returned %d", resp.StatusCode)
	}
	var result map[string]any
	return result, json.NewDecoder(resp.Body).Decode(&result)
}

func (c *Client) Health() (map[string]any, error) {
	resp, err := c.do("GET", "/api/health", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result map[string]any
	return result, json.NewDecoder(resp.Body).Decode(&result)
}
