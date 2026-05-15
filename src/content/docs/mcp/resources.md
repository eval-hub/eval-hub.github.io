---
title: "Resource Reference"
---

MCP resources are read-only data endpoints that the AI assistant can query. All EvalHub resources use the `evalhub://` URI scheme.

## Providers

### List all providers

| | |
|---|---|
| **URI** | `evalhub://providers` |
| **Description** | List all registered evaluation providers |
| **Pagination** | `?limit=N&offset=N` |

**Example response:**
```json
[
  {
    "resource": { "id": "lm_evaluation_harness" },
    "name": "LM Evaluation Harness",
    "description": "EleutherAI language model evaluation framework"
  },
  {
    "resource": { "id": "guidellm" },
    "name": "GuideLLM",
    "description": "Performance benchmarking"
  }
]
```

### Get a provider by ID

| | |
|---|---|
| **URI** | `evalhub://providers/{id}` |
| **Description** | Get a specific evaluation provider and its details |

**Example:** `evalhub://providers/lm_evaluation_harness`

## Benchmarks

### List all benchmarks

| | |
|---|---|
| **URI** | `evalhub://benchmarks` |
| **Description** | List all benchmarks across all providers |

### Filter by label

| | |
|---|---|
| **URI** | `evalhub://benchmarks?label=<label>` |
| **Description** | Filter benchmarks by one or more labels |
| **Labels** | `rag`, `safety`, `agents`, and others depending on the server |

Multiple labels can be specified: `evalhub://benchmarks?label=rag&label=safety`

**Example response:**
```json
[
  {
    "resource": { "id": "mmlu" },
    "name": "Massive Multitask Language Understanding",
    "provider_id": "lm_evaluation_harness",
    "labels": ["reasoning", "knowledge"]
  }
]
```

### Get a benchmark by ID

| | |
|---|---|
| **URI** | `evalhub://benchmarks/{id}` |
| **Description** | Get a specific benchmark with full details |

**Example:** `evalhub://benchmarks/mmlu`

## Collections

### List all collections

| | |
|---|---|
| **URI** | `evalhub://collections` |
| **Description** | List all pre-defined benchmark collections |
| **Pagination** | `?limit=N&offset=N` |

**Example response:**
```json
[
  {
    "resource": { "id": "leaderboard-v2" },
    "name": "Leaderboard v2",
    "description": "Standard leaderboard benchmark collection",
    "benchmarks": [
      { "id": "mmlu", "provider_id": "lm_evaluation_harness" },
      { "id": "hellaswag", "provider_id": "lm_evaluation_harness" }
    ]
  }
]
```

### Get a collection by ID

| | |
|---|---|
| **URI** | `evalhub://collections/{id}` |
| **Description** | Get a specific collection with its benchmark list |

**Example:** `evalhub://collections/leaderboard-v2`

## Jobs

### List all jobs

| | |
|---|---|
| **URI** | `evalhub://jobs` |
| **Description** | List all evaluation jobs |
| **Pagination** | `?limit=N&offset=N` |

### Filter by status

| | |
|---|---|
| **URI** | `evalhub://jobs?status=<status>` |
| **Description** | Filter evaluation jobs by status |
| **Valid statuses** | `pending`, `running`, `completed`, `failed`, `cancelled`, `partially_failed` |

**Example:** `evalhub://jobs?status=running`

### Get a job by ID

| | |
|---|---|
| **URI** | `evalhub://jobs/{id}` |
| **Description** | Get full job details including configuration, per-benchmark progress, results, and MLflow experiment URLs |

**Example response:**
```json
{
  "resource": { "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
  "name": "llama3-safety-check",
  "config": {
    "model": { "url": "https://llama3.example.com/v1", "name": "llama-3.2-8b" },
    "collection": { "id": "safety-and-fairness-v1" }
  },
  "status": {
    "state": "completed",
    "benchmarks": [
      {
        "id": "bbq",
        "provider_id": "lm_evaluation_harness",
        "status": "completed",
        "started_at": "2026-03-25T10:00:00Z",
        "completed_at": "2026-03-25T10:15:00Z"
      }
    ]
  },
  "results": {
    "benchmarks": [
      { "id": "bbq", "metrics": { "acc": 0.82 } }
    ]
  }
}
```

## Server Version

| | |
|---|---|
| **URI** | `evalhub://server/version` |
| **Description** | Server version and build metadata |

**Example response:**
```json
{
  "version": "0.4.0",
  "git_hash": "abc1234",
  "build_date": "2026-03-20T12:00:00Z",
  "go_version": "go1.25.0",
  "os": "linux",
  "arch": "amd64",
  "mcp_library": "github.com/modelcontextprotocol/go-sdk",
  "mcp_library_version": "v1.6.0"
}
```

## Autocompletion

The MCP server supports autocompletion for parameterized resource URIs. When typing a URI in a compatible client, the server can suggest:

- Provider IDs for `evalhub://providers/{id}`
- Benchmark IDs for `evalhub://benchmarks/{id}`
- Collection IDs for `evalhub://collections/{id}`
- Job IDs for `evalhub://jobs/{id}`
- Status values for `evalhub://jobs?status=`
- Labels for `evalhub://benchmarks?label=`

Completion values are cached for 30 seconds to reduce backend calls.
