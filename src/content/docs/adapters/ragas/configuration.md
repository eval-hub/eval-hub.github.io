---
title: "Configuration Reference"
description: "Complete reference for RAGAS adapter configuration options"
---

Complete reference for RAGAS adapter configuration options.

## JobSpec Structure

The RAGAS adapter uses a standardised `JobSpec` structure:

```json
{
  "id": "string",
  "provider_id": "ragas",
  "benchmark_id": "string",
  "model": {
    "name": "string",
    "url": "string"
  },
  "parameters": {
    // RAGAS-specific configuration
  },
  "num_examples": 0
}
```

## Core Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `id` | string | Unique job identifier | `"ragas-rag-eval-001"` |
| `provider_id` | string | Must be `"ragas"` | `"ragas"` |
| `benchmark_id` | string | Benchmark identifier | `"ragas_rag_default"` |
| `model.name` | string | Model name for the LLM judge | `"Qwen/Qwen2.5-1.5B-Instruct"` |
| `model.url` | string | OpenAI-compatible API endpoint | `"http://localhost:8000"` |

### Optional Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `num_examples` | integer | Limit the number of dataset samples to evaluate | All samples |
| `callback_url` | string | EvalHub service callback URL | `null` |

## Benchmark Configuration

Two pre-defined benchmark suites are available:

### `ragas_rag_default`: Default Suite

Runs the four core RAG evaluation metrics. Suitable for most use cases.

| Setting | Value |
|---------|-------|
| Metrics | `answer_relevancy`, `context_precision`, `faithfulness`, `context_recall` |
| Primary score | `faithfulness` |
| Pass threshold | 0.5 |

### `ragas_rag_full`: Full Suite

Runs all 11 available metrics for comprehensive RAG evaluation.

| Setting | Value |
|---------|-------|
| Metrics | All 11 metrics (see [Metrics reference](metrics/)) |
| Primary score | `faithfulness` |
| Pass threshold | 0.5 |

## Parameters Reference

All configuration is specified in the `parameters` object of the JobSpec.

### Metric Selection

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `metrics` | array | List of RAGAS metric names to evaluate | Benchmark default |

Available metrics: `answer_relevancy`, `answer_similarity`, `context_precision`, `faithfulness`, `context_recall`, `context_entity_recall`, `nv_accuracy`, `nv_context_relevance`, `factual_correctness`, `noise_sensitivity`, `nv_response_groundedness`.

See the [Metrics reference](metrics/) for details on each metric.

### LLM Configuration

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `max_tokens` | integer | Maximum tokens for LLM completions | `null` (server default) |
| `temperature` | number | Sampling temperature for LLM completions | `null` (adapter default) |

### Embedding Configuration

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `embedding_model` | string | Model name for embeddings | Same as `model.name` |
| `embedding_url` | string | Base URL for embeddings endpoint | Same as `model.url` |

:::caution[Embedding Model Selection]
Several RAGAS metrics (notably `answer_relevancy` and `answer_similarity`) require embedding support. If your LLM endpoint does not serve embeddings, you must configure a separate `embedding_url` and `embedding_model`. A lightweight embedding model such as `all-MiniLM-L6-v2` or `nomic-embed-text` is recommended.
:::

### Data Configuration

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `data_path` | string | Explicit path to dataset file | Auto-resolved |
| `column_map` | object | Map dataset column names to RAGAS expected names | `null` |

**Column mapping**: RAGAS expects columns named `user_input`, `response`, `retrieved_contexts`, and `reference`. If your dataset uses different names, provide a mapping:

```json
{
  "parameters": {
    "column_map": {
      "question": "user_input",
      "answer": "response",
      "contexts": "retrieved_contexts",
      "ground_truth": "reference"
    }
  }
}
```

**Data resolution order** (when `data_path` is not set):

1. `/test_data/dataset.jsonl`, populated by EvalHub's S3 init container
2. First `.jsonl` or `.json` file in `/test_data/`
3. `/data/dataset.jsonl`
4. First `.jsonl` or `.json` file in `/data/`

### Concurrency

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `max_workers` | integer | Parallel workers for RAGAS evaluation (1–10) | `1` |

:::tip[Concurrency Trade-off]
Increasing `max_workers` speeds up evaluation but sends more concurrent requests to the judge endpoint. Start with `1` and increase if the judge endpoint has sufficient capacity.
:::

## LLM Judge Requirements

RAGAS uses an LLM as a judge for several metrics. The judge model receives structured prompts and must return parseable JSON responses.

### Which Metrics Require a Judge

| Metric | LLM Judge | Embeddings |
|--------|-----------|------------|
| `faithfulness` | Yes | No |
| `answer_relevancy` | Yes | Yes |
| `context_precision` | Yes | No |
| `context_recall` | Yes | No |
| `answer_similarity` | No | Yes |
| `context_entity_recall` | No | No |
| `factual_correctness` | Yes | No |
| `noise_sensitivity` | Yes | No |
| `nv_accuracy` | Yes | No |
| `nv_context_relevance` | Yes | No |
| `nv_response_groundedness` | Yes | No |

### Cost and Latency Implications

- Each sample is evaluated independently per metric. For `N` samples and `M` judge-based metrics, expect roughly `N * M` LLM calls.
- Judge prompts are structured and can be lengthy, so set `max_tokens` appropriately (512 is usually sufficient).
- Use a lower `temperature` (e.g. `0.1`) for more deterministic judge outputs.
- The adapter uses chat completions (not legacy completions) to avoid truncation issues.

## Environment Variables

The adapter reads runtime settings from environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `EVALHUB_MODE` | Execution mode (`k8s` or `local`) | No | `k8s` |
| `EVALHUB_JOB_SPEC_PATH` | Path to job spec JSON | Yes (local mode) | `/meta/job.json` |
| `SERVICE_URL` | Eval-hub service URL | No | `null` |
| `REGISTRY_URL` | OCI registry URL | No | `null` |
| `REGISTRY_USERNAME` | Registry username | No | `null` |
| `REGISTRY_PASSWORD` | Registry password | No | `null` |
| `REGISTRY_INSECURE` | Allow insecure registry | No | `false` |
| `LOG_LEVEL` | Logging level | No | `INFO` |

## Complete Example

```json
{
  "id": "ragas-rag-eval-001",
  "provider_id": "ragas",
  "benchmark_id": "ragas_rag_default",
  "benchmark_index": 0,
  "model": {
    "url": "http://127.0.0.1:8000",
    "name": "Qwen/Qwen2.5-1.5B-Instruct"
  },
  "num_examples": 5,
  "parameters": {
    "metrics": [
      "answer_relevancy",
      "context_precision",
      "faithfulness",
      "context_recall"
    ],
    "embedding_model": "all-MiniLM-L6-v2",
    "embedding_url": "http://127.0.0.1:8001",
    "max_tokens": 512,
    "temperature": 0.1
  },
  "callback_url": "http://localhost:8080"
}
```
