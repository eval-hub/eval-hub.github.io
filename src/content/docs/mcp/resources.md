---
title: "Resource Reference"
---

MCP resources provide read-only access to EvalHub data using the `evalhub://` URI scheme. All resources return JSON.

## Providers

### List all providers

**URI:** `evalhub://providers`

Returns all registered evaluation providers.

```json
[
  {
    "id": "garak",
    "name": "Garak",
    "description": "LLM vulnerability scanner and red-teaming framework",
    "agent": {
      "evaluates": ["safety", "security", "red_teaming", "toxicity"],
      "target_type": "model",
      "summary": "Red-team an LLM for safety vulnerabilities, toxicity, and OWASP risks",
      "complements": ["lm_evaluation_harness", "guidellm"],
      "hints": [
        "The model endpoint must support OpenAI-compatible chat completions"
      ],
      "result_interpretation": [
        "attack_success_rate measures how often the model was successfully exploited",
        "LOWER is better -- 0.0 means no attacks succeeded"
      ]
    }
  },
  {
    "id": "guidellm",
    "name": "GuideLLM",
    "description": "Performance and latency benchmarking",
    "agent": {
      "evaluates": ["performance", "throughput", "latency"],
      "target_type": "inference_server",
      "summary": "Benchmark LLM inference server throughput, latency, and scalability"
    }
  }
]
```

:::note
The `agent` block is optional. Providers without agent metadata omit the field. See [Agent Discoverability](/mcp/agent-discoverability/) for field definitions.
:::

### Get a provider by ID

**URI:** `evalhub://providers/{id}`

**Example:** `evalhub://providers/garak`

Returns details for a single provider including its available benchmarks and optional `agent` metadata.

---

## Benchmarks

### List all benchmarks

**URI:** `evalhub://benchmarks`

Returns all benchmarks across all providers. Supports pagination.

**Query parameters:**

| Parameter | Type    | Description                                   |
| --------- | ------- | --------------------------------------------- |
| `limit`   | integer | Maximum items to return (1–2000, default 100) |
| `offset`  | integer | Number of items to skip                       |

**Example:** `evalhub://benchmarks?limit=50&offset=0`

### Get a benchmark by ID

**URI:** `evalhub://benchmarks/{id}`

**Example:** `evalhub://benchmarks/mmlu`

Returns details for a single benchmark including its provider, description, and configuration.

### Filter benchmarks by label

**URI:** `evalhub://benchmarks?label={tag}`

Filter benchmarks by tag. The `label` parameter can be repeated for OR-style filtering.

**Examples:**

- `evalhub://benchmarks?label=safety` — benchmarks tagged "safety"
- `evalhub://benchmarks?label=rag&label=reasoning` — benchmarks tagged "rag" or "reasoning"

---

## Collections

### List all collections

**URI:** `evalhub://collections`

Returns all pre-defined benchmark collections.

```json
[
  {
    "id": "safety-and-fairness-v1",
    "name": "Safety and Fairness v1",
    "description": "Safety and bias evaluation benchmarks",
    "agent": {
      "evaluates": ["safety", "fairness", "bias", "toxicity", "ethics", "truthfulness"],
      "summary": "Comprehensive safety and fairness suite covering toxicity, bias, truthfulness, and ethics",
      "complements": ["garak", "toxicity-and-ethical-principles"],
      "hints": [
        "Runs 6 benchmarks across truthfulness, toxicity, gender bias, social bias, and ethics",
        "Overall pass threshold is 0.758"
      ],
      "result_interpretation": [
        "Aggregate score is a weighted average across all benchmarks, higher is better"
      ]
    }
  },
  {
    "id": "leaderboard-v2",
    "name": "Leaderboard v2",
    "description": "Standard leaderboard benchmarks"
  }
]
```

### Get a collection by ID

**URI:** `evalhub://collections/{id}`

**Example:** `evalhub://collections/leaderboard-v2`

Returns the collection with its full benchmark list and configuration.

---

## Jobs

### List all jobs

**URI:** `evalhub://jobs`

Returns all evaluation jobs. Supports pagination.

**Query parameters:**

| Parameter | Type    | Description                                   |
| --------- | ------- | --------------------------------------------- |
| `limit`   | integer | Maximum items to return (1–2000, default 100) |
| `offset`  | integer | Number of items to skip                       |

**Example:** `evalhub://jobs?limit=20&offset=0`

### Filter jobs by status

**URI:** `evalhub://jobs?status={status}`

| Status             | Description                              |
| ------------------ | ---------------------------------------- |
| `pending`          | Queued, waiting to start                 |
| `running`          | Currently executing                      |
| `completed`        | All benchmarks finished                  |
| `failed`           | One or more benchmarks failed            |
| `cancelled`        | Cancelled by user                        |
| `partially_failed` | Some benchmarks succeeded, others failed |

**Examples:**

- `evalhub://jobs?status=running` — all currently running jobs
- `evalhub://jobs?status=completed&limit=10` — last 10 completed jobs

### Get a job by ID

**URI:** `evalhub://jobs/{id}`

**Example:** `evalhub://jobs/job-a1b2c3d4`

Returns full job details including state, progress, per-benchmark status, and timestamps.

---

## Server metadata

### Server version

**URI:** `evalhub://server/version`

Returns server version and build information.

```json
{
  "version": "0.4.0",
  "build": "abc123",
  "git_hash": "d2c6d42",
  "go_version": "go1.25.9",
  "mcp_library_version": "0.2.0"
}
```

---

## Autocompletion

The MCP server provides autocompletion for resource URI parameters. MCP clients that support completions will suggest valid IDs when you type resource URIs:

- **Provider IDs** — when typing `evalhub://providers/{id}`
- **Benchmark IDs** — when typing `evalhub://benchmarks/{id}`
- **Collection IDs** — when typing `evalhub://collections/{id}`
- **Job IDs** — when typing `evalhub://jobs/{id}`
- **Status values** — when typing `evalhub://jobs?status=`
- **Labels** — when typing `evalhub://benchmarks?label=`

Completions are cached for 30 seconds and support partial matching.
