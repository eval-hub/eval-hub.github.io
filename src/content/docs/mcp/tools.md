---
title: "Tool Reference"
---

MCP tools are actions that the AI assistant can execute on your behalf. The EvalHub MCP server exposes three tools for managing evaluation jobs.

## submit_evaluation

Submit a new model evaluation job. Specify benchmarks individually or use a pre-defined collection.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Name for the evaluation job |
| `description` | string | No | Human-readable description of what this evaluation measures |
| `tags` | string[] | No | Tags for categorizing the evaluation |
| `model` | object | Yes | Model to evaluate (see below) |
| `benchmarks` | object[] | No | List of benchmarks to run. Provide `benchmarks` **or** `collection`, not both |
| `collection` | object | No | Benchmark collection to run. Provide `collection` **or** `benchmarks`, not both |
| `experiment` | object | No | MLflow experiment tracking configuration |

**`model` object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | URL of the model inference endpoint |
| `name` | string | Yes | Display name of the model |
| `auth_secret` | string | No | Kubernetes secret reference for model authentication |

**`benchmarks` array items:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Benchmark identifier |
| `provider_id` | string | Yes | Evaluation provider that runs this benchmark |

**`collection` object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Collection identifier (e.g. `leaderboard-v2`) |

**`experiment` object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | MLflow experiment name |
| `tags` | object | No | Key-value tags for the MLflow experiment |
| `artifact_location` | string | No | Storage location for experiment artifacts |

### Response

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Unique identifier for the created job |
| `state` | string | Initial job state (typically `pending`) |

### Example

**Prompt:**
```
Submit an evaluation named "llama3-safety-check" using the safety-and-fairness-v1
collection against my model at https://llama3.example.com/v1 named llama-3.2-8b.
```

**What the assistant sends:**
```json
{
  "name": "llama3-safety-check",
  "model": {
    "url": "https://llama3.example.com/v1",
    "name": "llama-3.2-8b"
  },
  "collection": {
    "id": "safety-and-fairness-v1"
  }
}
```

**Response:**
```
Evaluation job created: a1b2c3d4-e5f6-7890-abcd-ef1234567890 (state: pending)
```

## get_job_status

Get the current status of an evaluation job including overall state, progress percentage, and per-benchmark status with timestamps. Designed for polling — call repeatedly to monitor a running evaluation.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_id` | string | Yes | ID of the evaluation job to check |

### Response

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Job identifier |
| `state` | string | Current state: `pending`, `running`, `completed`, `failed`, `cancelled`, or `partially_failed` |
| `progress_percent` | int | Completion percentage (0–100) |
| `benchmarks` | object[] | Per-benchmark status (see below) |
| `created_at` | string | ISO 8601 timestamp |
| `started_at` | string | ISO 8601 timestamp of first benchmark start |

**`benchmarks` array items:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Benchmark identifier |
| `provider_id` | string | Provider running this benchmark |
| `status` | string | Benchmark-level status |
| `started_at` | string | ISO 8601 timestamp |
| `completed_at` | string | ISO 8601 timestamp |

### Example

**Prompt:**
```
Check the status of job a1b2c3d4-e5f6-7890-abcd-ef1234567890.
```

**Response:**
```
Job a1b2c3d4-e5f6-7890-abcd-ef1234567890: running (50% complete)
```

## cancel_job

Cancel a running or pending evaluation job. The job will be stopped and its benchmarks marked as cancelled.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_id` | string | Yes | ID of the evaluation job to cancel |

### Response

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Job identifier |
| `message` | string | Confirmation message |

### Example

**Prompt:**
```
Cancel the evaluation job a1b2c3d4-e5f6-7890-abcd-ef1234567890.
```

**Response:**
```
Job a1b2c3d4-e5f6-7890-abcd-ef1234567890 cancelled successfully
```
