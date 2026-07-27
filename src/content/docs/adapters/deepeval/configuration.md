---
title: "Configuration Reference"
description: "Complete reference for DeepEval adapter configuration options"
---

Complete reference for DeepEval adapter configuration options.

## JobSpec Structure

The DeepEval adapter uses the standard EvalHub `JobSpec` structure:

```json
{
  "id": "string",
  "provider_id": "deepeval",
  "benchmark_id": "string",
  "benchmark_index": 0,
  "experiment_name": "string",
  "model": {
    "url": "string",
    "name": "string",
    "auth": {
      "secret_ref": "string"
    }
  },
  "parameters": {
    "threshold": 0.5
  },
  "test_data_ref": {
    "s3": {
      "bucket": "string",
      "path": "string",
      "secret_ref": {
        "name": "string",
        "namespace": "string"
      }
    }
  },
  "callback_url": "string"
}
```

## Core Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|---|---|---|---|
| `id` | string | Unique job identifier | `"deepeval-faithfulness-001"` |
| `provider_id` | string | Must be `"deepeval"` | `"deepeval"` |
| `benchmark_id` | string | Benchmark to run (see [Benchmarks](benchmarks/)) | `"faithfulness"` |
| `model.name` | string | Name of the evaluated model | `"gpt-4o"` |
| `model.url` | string | OpenAI-compatible endpoint for the evaluated model | `"https://api.openai.com/v1"` |

### Optional Parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `benchmark_index` | integer | Index when running multiple benchmarks | `0` |
| `experiment_name` | string | MLflow experiment name for result tracking | `null` |
| `parameters` | object | DeepEval-specific configuration (see below) | `{}` |
| `test_data_ref` | object | S3 reference for the evaluation dataset | `null` |
| `callback_url` | string | EvalHub service callback URL | `null` |

## Benchmark Configuration

Eight benchmarks are available across two evaluation modes. See [Benchmarks](benchmarks/) for the full reference including required dataset columns and output metrics.

| Benchmark ID | Name | Mode | Category |
|---|---|---|---|
| `faithfulness` | Faithfulness | Single-turn | RAG evaluation |
| `relevancy` | Answer Relevancy | Single-turn | RAG evaluation |
| `hallucination` | Hallucination | Single-turn | Safety |
| `correctness` | Correctness | Single-turn | Accuracy |
| `summarization` | Summarization | Single-turn | NLP |
| `conversation-completeness` | Conversation Completeness | Multi-turn | Multi-turn |
| `role-adherence` | Role Adherence | Multi-turn | Multi-turn |
| `knowledge-retention` | Knowledge Retention | Multi-turn | Multi-turn |

## Parameters Reference

All configuration is specified in the `parameters` object of the JobSpec.

### Judge Model

| Parameter | Type | Description | Default |
|---|---|---|---|
| `eval_model_name` | string | Name of the judge model | `model.name` |
| `eval_model_url` | string | Base URL of the judge model endpoint | `model.url` |

:::note[Separate Judge Endpoint]
The judge model defaults to the same model being evaluated. To use a separate, more capable model as judge (a common pattern), set `eval_model_name` and `eval_model_url` to point to a different endpoint. Any OpenAI-compatible server is supported.
:::

### Scoring

| Parameter | Type | Description | Default |
|---|---|---|---|
| `threshold` | float | Minimum score for a test case to pass | `0.5` |

### Data

| Parameter | Type | Description | Default |
|---|---|---|---|
| `dataset_format` | string | Input dataset format: `csv`, `jsonl`, or `json` | `csv` |
| `data_dir` | string | Path to dataset directory | Auto-resolved |

Data resolution order (when `data_dir` is not set):

1. `/test_data/` — populated by EvalHub's S3 init container
2. `/data/`

:::tip[Use JSONL for Multi-Turn]
Multi-turn benchmarks (`conversation-completeness`, `role-adherence`, `knowledge-retention`) require a `turns` field containing a list of conversation turns. JSONL or JSON formats are strongly recommended because they represent this natively. CSV requires the `turns` field to be a JSON-encoded string, which is error-prone.
:::

### Concurrency

| Parameter | Type | Description | Default |
|---|---|---|---|
| `max_concurrent` | integer | Maximum test cases evaluated concurrently | `1` |
| `throttle_value` | float | Seconds to wait between test case evaluations | `0` |

:::tip[Rate-Limited Endpoints]
Use `max_concurrent` and `throttle_value` together to pace requests to a rate-limited or overloaded judge endpoint. The default of `max_concurrent=1` runs test cases serially, which is the safest starting point.
:::

### Timeouts and Retries

| Parameter | Type | Description | Default |
|---|---|---|---|
| `per_attempt_timeout_seconds` | float | Per-attempt timeout for each LLM judge call | `300.0` |
| `retry_max_attempts` | integer | Total LLM call attempts per metric (including first) | `2` |
| `retry_cap_seconds` | float | Maximum backoff between retry attempts | `5.0` |

:::note[Reasoning Models]
The default timeout of 300 seconds accommodates reasoning models (e.g. DeepSeek-R1, Phi-4) that emit long chain-of-thought sequences before producing a response token. If your judge is a fast, non-reasoning model, reduce `per_attempt_timeout_seconds` to detect failures earlier.
:::

### Multi-Turn

| Parameter | Type | Description | Default |
|---|---|---|---|
| `chatbot_role` | string | Chatbot persona for Role Adherence benchmark | `null` |

`chatbot_role` can also be provided per record in the dataset as a `chatbot_role` column, which takes precedence over the parameter value.

## MLflow Integration

When `experiment_name` is set in the JobSpec and `MLFLOW_TRACKING_URI` is configured, the adapter logs evaluation results to MLflow automatically.

### What Is Logged

For each completed evaluation, the adapter logs:

- **Metrics**: Primary score for the benchmark (e.g. `faithfulness_score`, `hallucination_score`)
- **Parameters**: `benchmark_id`, `threshold`, `eval_model_name`, `dataset_format`, `num_test_cases`
- **Tags**: `provider_id`, `job_id`

### Environment Variables for MLflow

| Variable | Description | Example |
|---|---|---|
| `MLFLOW_TRACKING_URI` | MLflow server URL | `http://mlflow-service:5000` |
| `MLFLOW_EXPERIMENT` | Default experiment name (overridden by `experiment_name` in JobSpec) | `deepeval-evals` |

See the [MLflow guide](/guides/mlflow/) for setup and configuration details.

## Environment Variables

| Variable | Description | Required | Default |
|---|---|---|---|
| `EVALHUB_MODE` | Execution mode: `k8s` or `local` | No | `k8s` |
| `EVALHUB_JOB_SPEC_PATH` | Path to the job spec JSON file | Yes (local mode) | `/meta/job.json` |
| `OPENAI_API_KEY` | API key for OpenAI-compatible judge endpoint | When using OpenAI | — |
| `ANTHROPIC_API_KEY` | API key for Anthropic judge endpoint | When using Anthropic | — |
| `DEEPEVAL_CACHE_DIR` | DeepEval cache directory | No | `/tmp` |
| `MLFLOW_TRACKING_URI` | MLflow server URL | When using MLflow | — |
| `MLFLOW_EXPERIMENT` | MLflow experiment name (fallback) | No | — |

## Complete Example

```json
{
  "id": "faithfulness-test-001",
  "provider_id": "deepeval",
  "benchmark_id": "faithfulness",
  "benchmark_index": 0,
  "experiment_name": "faithfulness-eval",
  "model": {
    "url": "https://api.openai.com/v1",
    "name": "gpt-4o",
    "auth": {
      "secret_ref": "openai-api-key-secret"
    }
  },
  "parameters": {
    "eval_model_name": "gpt-4o",
    "eval_model_url": "https://api.openai.com/v1",
    "threshold": 0.7,
    "dataset_format": "csv",
    "max_concurrent": 2,
    "throttle_value": 0.5,
    "per_attempt_timeout_seconds": 60.0,
    "retry_max_attempts": 3,
    "retry_cap_seconds": 10.0
  },
  "test_data_ref": {
    "s3": {
      "bucket": "deepeval-datasets",
      "path": "faithfulness/",
      "secret_ref": {
        "name": "deepeval-data-bucket",
        "namespace": "your-namespace"
      }
    }
  },
  "callback_url": "http://evalhub-service:8080"
}
```
