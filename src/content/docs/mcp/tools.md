---
title: "Tool Reference"
---

The EvalHub MCP server exposes four tools: one for discovering evaluation providers and three for managing evaluation jobs.

## discover_providers

Discover evaluation providers using [agent metadata](/mcp/agent-discoverability/). Filter by target type and capability tags to find the right provider for a use case. Each result includes a summary, usage hints, result interpretation guidance, and complementary provider suggestions.

### Parameters

| Parameter     | Type       | Required | Description                                                                 |
| ------------- | ---------- | -------- | --------------------------------------------------------------------------- |
| `target_type` | string     | No       | Filter by target type: `model`, `agent`, or `inference_server`              |
| `evaluates`   | string[]   | No       | Filter to providers whose `agent.evaluates` includes **all** listed tags    |

When any filter is set, providers without an `agent` block are excluded.

### Example request

Find model providers that evaluate safety:

```json
{
  "evaluates": ["safety"],
  "target_type": "model"
}
```

### Example response

```json
{
  "providers": [
    {
      "id": "garak",
      "name": "garak",
      "title": "Garak",
      "summary": "Red-team an LLM for safety vulnerabilities, toxicity, and OWASP risks",
      "target_type": "model",
      "evaluates": ["safety", "security", "red_teaming", "toxicity"],
      "hints": [
        "The model endpoint must support OpenAI-compatible chat completions",
        "The 'quick' benchmark runs a single DAN probe for fast smoke testing (~2 min)"
      ],
      "result_interpretation": [
        "attack_success_rate measures how often the model was successfully exploited",
        "LOWER is better -- 0.0 means no attacks succeeded",
        "Scores above 0.3 indicate significant vulnerability"
      ],
      "complements": ["lm_evaluation_harness", "guidellm"],
      "recommended_when": [
        "User asks about model safety or toxicity",
        "Pre-deployment safety gate"
      ]
    }
  ]
}
```

### Notes

- Without filters, all providers are returned (including those without `agent` metadata).
- Prefer this tool over reading `evalhub://providers` when you need filtered, agent-oriented summaries.
- `recommended_when` and `complements` are returned for display; they are not filterable parameters.
- See [Agent Discoverability](/mcp/agent-discoverability/) for the full metadata model.

---

## submit_evaluation

Submit a new model evaluation job.

### Parameters

| Parameter     | Type     | Required | Description                                                             |
| ------------- | -------- | -------- | ----------------------------------------------------------------------- |
| `name`        | string   | Yes      | Job name                                                                |
| `description` | string   | No       | Job description                                                         |
| `tags`        | string[] | No       | Tags for the job                                                        |
| `model`       | object   | Yes      | Model configuration (see below)                                         |
| `benchmarks`  | object[] | No       | List of benchmarks to run (mutually exclusive with `collection`)        |
| `collection`  | object   | No       | Pre-defined benchmark collection (mutually exclusive with `benchmarks`) |
| `experiment`  | object   | No       | MLflow experiment configuration                                         |

**`model` object:**

| Field         | Type   | Required | Description                                                   |
| ------------- | ------ | -------- | ------------------------------------------------------------- |
| `url`         | string | Yes      | Model inference endpoint URL                                  |
| `name`        | string | Yes      | Model display name                                            |
| `auth_secret` | string | No       | Kubernetes Secret reference for model endpoint authentication |

**`benchmarks` array items:**

| Field         | Type   | Required | Description                       |
| ------------- | ------ | -------- | --------------------------------- |
| `id`          | string | Yes      | Benchmark identifier              |
| `provider_id` | string | Yes      | Provider that runs this benchmark |

**`collection` object:**

| Field | Type   | Required | Description           |
| ----- | ------ | -------- | --------------------- |
| `id`  | string | Yes      | Collection identifier |

**`experiment` object:**

| Field               | Type   | Required | Description                       |
| ------------------- | ------ | -------- | --------------------------------- |
| `name`              | string | No       | MLflow experiment name            |
| `tags`              | object | No       | Key-value tags for the experiment |
| `artifact_location` | string | No       | MLflow artifacts storage path     |

### Example request

```json
{
  "name": "gpt-4o-leaderboard",
  "description": "Leaderboard evaluation of GPT-4o",
  "model": {
    "url": "https://api.openai.com/v1",
    "name": "gpt-4o"
  },
  "collection": {
    "id": "leaderboard-v2"
  },
  "experiment": {
    "name": "gpt-4o-may-2026"
  }
}
```

### Example response

```json
{
  "job_id": "job-a1b2c3d4",
  "state": "pending"
}
```

### Notes

- You must provide either `benchmarks` or `collection`, not both.
- If `benchmarks` is provided, it must not be empty.
- Use `get_job_status` to monitor the submitted job.

---

## cancel_job

Cancel a running or pending evaluation job.

### Parameters

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `job_id`  | string | Yes      | The job identifier to cancel |

### Example request

```json
{
  "job_id": "job-a1b2c3d4"
}
```

### Example response

```json
{
  "job_id": "job-a1b2c3d4",
  "message": "Job cancelled successfully"
}
```

### Notes

- Cancellation stops running benchmarks and marks them as cancelled.
- Use `get_job_status` to verify the final state after cancellation.

---

## get_job_status

Get the current status of an evaluation job with progress and per-benchmark details.

### Parameters

| Parameter | Type   | Required | Description                 |
| --------- | ------ | -------- | --------------------------- |
| `job_id`  | string | Yes      | The job identifier to check |

### Example request

```json
{
  "job_id": "job-a1b2c3d4"
}
```

### Example response

```json
{
  "job_id": "job-a1b2c3d4",
  "state": "running",
  "progress_percent": 50,
  "benchmarks": [
    {
      "id": "mmlu",
      "provider_id": "lm-evaluation-harness",
      "status": "completed",
      "started_at": "2026-05-21T10:00:00Z",
      "completed_at": "2026-05-21T10:15:00Z"
    },
    {
      "id": "hellaswag",
      "provider_id": "lm-evaluation-harness",
      "status": "running",
      "started_at": "2026-05-21T10:15:00Z"
    }
  ],
  "created_at": "2026-05-21T09:59:00Z",
  "started_at": "2026-05-21T10:00:00Z"
}
```

### Job states

| State              | Description                              |
| ------------------ | ---------------------------------------- |
| `pending`          | Job is queued and waiting to start       |
| `running`          | One or more benchmarks are executing     |
| `completed`        | All benchmarks finished successfully     |
| `failed`           | One or more benchmarks failed            |
| `cancelled`        | Job was cancelled by the user            |
| `partially_failed` | Some benchmarks completed, others failed |

### Notes

- This tool is designed for polling — call it repeatedly to monitor a running evaluation.
- `progress_percent` ranges from 0 to 100.
- Each benchmark entry includes individual timestamps when available.
