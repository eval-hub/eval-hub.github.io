---
title: "Configuration Reference"
---

Complete reference for GuideLLM adapter configuration options.

## Model authentication

For OpenAI-compatible model access, put the primary URL in `model.url` and the
credential in the model-auth Secret's `api-key`, referenced by
`model.auth.secret_ref`. Model URLs and API keys must not be placed in API payload
`parameters`. The Kubernetes adapter receives a sidecar URL and credential
reference; the sidecar supplies the real key. See
[Model Authentication](/guides/model-authentication/) for mounts and client usage.

## JobSpec Structure

The GuideLLM adapter uses a standardised `JobSpec` structure:

```json
{
  "id": "string",
  "benchmark_id": "string",
  "model": {
    "name": "string",
    "url": "string"
  },
  "parameters": {
    // GuideLLM-specific configuration
  },
  "experiment_name": "string",
  "tags": {}
}
```

## Core Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `id` | string | Unique job identifier | `"guidellm-001"` |
| `benchmark_id` | string | Benchmark identifier | `"performance_sweep"` |
| `model.name` | string | Model name | `"Qwen/Qwen2.5-1.5B-Instruct"` |
| `model.url` | string | OpenAI-compatible API endpoint | `"http://localhost:8000/v1"` |

### Optional Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `experiment_name` | string | Experiment identifier | `null` |
| `tags` | object | Free-form metadata tags | `{}` |

## Benchmark Configuration

All configuration is specified in the `parameters` object.

### Execution Profile

| Parameter | Type | Description | Options |
|-----------|------|-------------|---------|
| `profile` | string | Execution profile | `sweep`, `throughput`, `concurrent`, `constant`, `poisson`, `synchronous` |

See [Execution Profiles](profiles/) for detailed information on each profile type.

### Rate Configuration

| Parameter | Type | Description | Varies by Profile |
|-----------|------|-------------|-------------------|
| `rate` | number or array | Request rate configuration | Profile-dependent |

**Profile-specific behaviour**:

- **sweep**: Not used (automatically determined)
- **throughput**: Not used (maximum speed)
- **concurrent**: Number of concurrent requests
- **constant**: Requests per second
- **poisson**: Average requests per second
- **synchronous**: Not used (sequential)

### Duration and Limits

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `max_seconds` | number | Maximum duration in seconds | None (unlimited) |
| `max_requests` | number | Maximum number of requests | None (unlimited) |
| `max_errors` | number | Error threshold before stopping | None (unlimited) |
| `max_error_rate` | number | Error rate threshold (0-1) | None |
| `max_global_error_rate` | number | Global error rate threshold | None |

:::caution[At Least One Limit Required]
You must specify at least one of: `max_seconds`, `max_requests`, or error limits.
:::

### Warmup and Cooldown

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `warmup` | string or number | Warmup period to exclude | `"5%"` or `10` |
| `cooldown` | string or number | Cooldown period to exclude | `"5%"` or `10` |

**Format**:
- **Percentage**: `"5%"` - exclude first/last 5% of requests
- **Absolute**: `10` - exclude first/last 10 seconds

:::tip[Recommended Warmup]
Use `"warmup": "5%"` to exclude cold-start effects from measurements.
:::

### Saturation Detection

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `detect_saturation` | boolean | Enable over-saturation detection | `false` |
| `over_saturation` | number | Saturation threshold multiplier | `1.5` |

When enabled, automatically detects when the server is saturated and adjusts testing accordingly.

## Data Sources

### Synthetic Data

Generate synthetic requests with specified token counts:

```json
{
  "parameters": {
    "data": "prompt_tokens=50,output_tokens=20"
  }
}
```

**Format**: `prompt_tokens=N,output_tokens=M`

### HuggingFace Datasets

Use datasets from HuggingFace:

```json
{
  "parameters": {
    "data": "hf:abisee/cnn_dailymail",
    "data_args": {"name": "3.0.0"},
    "data_column_mapper": {"text_column": "article"},
    "data_samples": 100
  }
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | string | Dataset identifier (prefix with `hf:`) |
| `data_args` | object | Dataset loading arguments |
| `data_column_mapper` | object | Column name mappings |
| `data_samples` | number | Maximum samples to use |

### Local Files

Use local data files:

```json
{
  "parameters": {
    "data": "file:///path/to/prompts.jsonl",
    "data_samples": 500
  }
}
```

**Supported formats**: JSON, JSONL, CSV

### Data Processing

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `processor` | string | Tokeniser for synthetic data | `"gpt2"` |
| `processor_args` | array | Processor arguments | `[]` |
| `data_num_workers` | number | Parallel workers for data loading | `1` |

## Request Configuration

### Request Type

| Parameter | Type | Description | Options |
|-----------|------|-------------|---------|
| `request_type` | string | API endpoint type | `chat_completions`, `completions`, `audio_transcription`, `audio_translation` |

Default: `chat_completions`

### Request Formatting

| Parameter | Type | Description | Options |
|-----------|------|-------------|---------|
| `data_request_formatter` | string | Request format | `chat_completions`, `completions` |
| `data_collator` | string | Data collation strategy | `generative` |

## Output Configuration

### Output Formats

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `outputs` | array | Output formats | `["json", "csv", "html", "yaml"]` |
| `output_dir` | string | Output directory | `/tmp/guidellm_results_*` |

## Advanced Options

### Randomisation

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `random_seed` | number | Random seed for reproducibility | `42` |

### Backend Configuration

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `backend` | string | Backend type | `openai_http` |
| `backend_kwargs` | object | Additional backend arguments | `null` |

## Environment Variables

The adapter reads runtime settings from environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `EVALHUB_MODE` | Execution mode | No | `k8s` |
| `EVALHUB_JOB_SPEC_PATH` | Path to job spec JSON | Yes (local mode) | `/meta/job.json` (k8s), `meta/job.json` (local) |
| `SERVICE_URL` | Eval-hub service URL | No | `null` |
| `REGISTRY_URL` | OCI registry URL | No | `null` |
| `REGISTRY_USERNAME` | Registry username | No | `null` |
| `REGISTRY_PASSWORD` | Registry password | No | `null` |
| `REGISTRY_INSECURE` | Allow insecure registry | No | `false` |

## Complete Example

```json
{
  "id": "guidellm-production-001",
  "benchmark_id": "performance_sweep",
  "model": {
    "name": "Qwen/Qwen2.5-1.5B-Instruct",
    "url": "http://127.0.0.1:8000/v1"
  },
  "parameters": {
    "profile": "constant",
    "rate": 5,
    "max_seconds": 60,
    "max_requests": 100,
    "data": "prompt_tokens=256,output_tokens=128",
    "request_type": "chat_completions",
    "warmup": "5%",
    "detect_saturation": true,
    "random_seed": 42
  },
  "experiment_name": "qwen-load-test",
  "tags": {
    "framework": "guidellm",
    "model_size": "small",
    "evaluation_type": "performance"
  }
}
```
