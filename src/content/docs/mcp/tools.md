---
title: "Tool Reference"
---

The EvalHub MCP server exposes tools for discovering evaluation providers, designing benchmark collections, and managing evaluation jobs.

## Tool: discover_providers

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

### Response metadata

The response includes a `_meta` object with diagnostic fields useful for debugging filter behavior:

| Field                | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `target_types_found` | Comma-separated target types present in results      |
| `target_type`        | The `target_type` filter that was applied             |
| `evaluates_found`    | Comma-separated evaluates tags present in results    |
| `evaluates`          | The `evaluates` filter that was applied               |

### Notes

- Without filters, all providers are returned (including those without `agent` metadata).
- Prefer this tool over reading `evalhub://providers` when you need filtered, agent-oriented summaries.
- `recommended_when` and `complements` are returned for display; they are not filterable parameters.
- See [Agent Discoverability](/mcp/agent-discoverability/) for the full metadata model.

---

## Tool: design_collection

Design a benchmark collection from a natural-language evaluation goal. The tool fetches the live provider catalog and curated collection examples and returns guidance for benchmark selection, weight assignment, and threshold calibration. Returns guidance only — follow it up with `create_collection` to persist the design. This is the model-callable equivalent of the `design_collection` prompt.

### Parameters

| Parameter          | Type   | Required | Description                                                                                                                             |
| ------------------ | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `evaluation_goal`  | string | Yes      | Natural-language description of the evaluation use case (e.g. "enterprise deployment requiring safety, instruction following, and long-context support") |
| `provider_filter`  | string | No       | Comma-separated provider IDs to restrict benchmark selection (e.g. `lm_evaluation_harness,lighteval`); omit to consider all providers    |
| `max_benchmarks`   | int    | No       | Maximum number of benchmarks to include (default 12)                                                                                    |
| `strictness`       | string | No       | Threshold strictness: `lenient`, `moderate`, or `strict`; shifts thresholds down/center/up respectively (default `moderate`)              |

### Example request

Design a collection for an enterprise deployment evaluation:

```json
{
  "evaluation_goal": "enterprise deployment requiring safety, instruction following, and long-context support",
  "strictness": "strict"
}
```

### Example response

```json
{
  "guidance": "Select benchmarks that cover each domain in the evaluation goal... Assign weights proportional to domain importance... Calibrate thresholds using the strictness setting...",
  "benchmarks": [
    {
      "id": "ifeval",
      "provider_id": "lm-evaluation-harness",
      "name": "IFEval",
      "description": "Evaluates instruction following in large language models",
      "tags": ["instruction_following"],
      "metrics": ["prompt_strict_acc"]
    }
  ],
  "collection_examples": [
    {
      "id": "leaderboard-v2",
      "name": "Leaderboard v2",
      "domains": ["reasoning", "knowledge"],
      "description": "A curated set of benchmarks for general model leaderboards.",
      "tags": ["curated"],
      "pass_criteria": {
        "threshold": 0.72
      },
      "benchmarks": [
        {
          "id": "mmlu",
          "provider_id": "lm-evaluation-harness",
          "weight": 1
        }
      ]
    }
  ]
}
```

### Notes

- Returns guidance only — nothing is persisted. Use `create_collection` to persist the designed collection, then reference its ID in `submit_evaluation`.
- The benchmark catalog and curated collection examples are returned as the structured `benchmarks` and `collection_examples` fields, so you can consume them directly instead of re-querying `search_benchmarks`.
- Use this tool when an agent drives the collection design workflow from a conversational request; the `design_collection` prompt is user-invoked and cannot take multi-word arguments via slash commands. Both share the same catalog and calibration guidance.
- Iterate conversationally (e.g. "add more safety benchmarks", "lower the thresholds") before persisting the result with `create_collection`.

---

## Tool: submit_evaluation

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
| `tags`              | object | No       | Key-value tags for the experiment (MCP accepts a map; the REST API uses `{key, value}` objects — see [MLflow](/guides/mlflow/#experiment-configuration-on-jobs)) |
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

## Tool: cancel_job

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
  "message": "Job job-a1b2c3d4 cancelled successfully"
}
```

### Notes

- Cancellation stops running benchmarks and marks them as cancelled.
- Use `get_job_status` to verify the final state after cancellation.

---

## Tool: get_job_status

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
      "completed_at": "2026-05-21T10:15:00Z",
      "result_interpretation": "Higher is better. Measures broad academic knowledge across 57 subjects.",
      "complements": ["hellaswag", "arc_challenge"]
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

:::note
When a benchmark reaches a terminal state (completed or failed), the response is enriched with `result_interpretation` and `complements` from the provider's agent metadata. These fields are omitted for benchmarks still in progress.
:::

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
