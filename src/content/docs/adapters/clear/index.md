---
title: "IBM CLEAR Adapter"
---

The IBM CLEAR adapter integrates [IBM CLEAR](https://github.com/IBM/CLEAR) (Comprehensive LLM Error Analysis and Reporting) with the eval-hub evaluation service using the evalhub-sdk framework adapter pattern.

## Overview

CLEAR runs an agentic, step-by-step pipeline over JSON traces (for example MLflow-style agent traces). It uses an LLM-as-judge to identify recurring failure patterns and writes a structured report.

### Key Features

- **Agentic evaluation pipeline**: Multi-step LLM-as-judge analysis of agent interaction traces
- **Failure pattern detection**: Identifies and clusters recurring error patterns across runs
- **Trace-native input**: Processes MLflow-style JSON agent traces directly
- **Structured reporting**: Outputs `clear_results.json` with categorised issue statistics and scores
- **Flexible inference backends**: LiteLLM (default) or direct OpenAI-compatible endpoints

### Supported Trace Formats

- MLflow agent traces (JSON)
- LangGraph agent traces
- Any JSON trace format conforming to the CLEAR input schema

## Architecture

The adapter resolves where traces live, runs the CLEAR agentic pipeline, reads `clear_results.json`, maps CLEAR statistics into `JobResults` / `EvaluationResult` metrics, reports progress to the eval-hub sidecar, and optionally pushes artifacts to MLflow or an OCI bundle.

**Workflow:**

1. **Input traces** — Prefers `/test_data` or `/data` when eval-hub has staged data from S3 (`test_data_ref`), or set `parameters.data_dir` to a directory of `*.json` traces. Alternatively, fetch traces from an MLflow experiment with `parameters.mlflow_traces_experiment_name` (requires `MLFLOW_TRACKING_URI`).
2. **Configuration** — Job parameters drive CLEAR (`eval_model_name`, `provider`, `inference_backend`, frameworks, etc.); `model.url` is used as the OpenAI-compatible endpoint.
3. **Execution** — CLEAR prepares trace data and runs the step-by-step agentic pipeline.
4. **Output** — Metrics (interactions, issues, agent scores) are returned to eval-hub; `clear_results.json` is persisted under the run output. Result upload via `callbacks.mlflow.save()` uses JobSpec `experiment_name` when set; otherwise CLEAR applies `parameters.mlflow_experiment_name` before calling `save()`.

## Quick Start

### Running Locally

```bash
export EVALHUB_MODE=local
export EVALHUB_JOB_SPEC_PATH=meta/job.json
# Point at a directory of agent trace JSON files
export EVALHUB_DATA_DIR=./my-traces

python main.py
```

### Running on Kubernetes

Submit a job through the eval-hub API using provider `ibm-clear` and benchmark `agentic-evaluation`.

**Traces from S3:**

1. Upload trace files to `s3://my-bucket/traces/`
2. Configure the job's `test_data_ref.s3` field
3. The adapter auto-discovers `*.json` files under `/test_data` inside the pod

**Traces from MLflow:**

1. Set `MLFLOW_TRACKING_URI` on the runtime
2. Set `parameters.mlflow_traces_experiment_name` (or `mlflow_traces_experiment_id`) on the job
3. Optionally filter with `mlflow_traces_filter`, `mlflow_traces_run_id`, or `mlflow_traces_max_results`

Job `experiment.name` (JobSpec `experiment_name`) is the preferred experiment for CLEAR **results**. If it is unset, CLEAR copies `parameters.mlflow_experiment_name` onto the JobSpec before `callbacks.mlflow.save()`, so a parameter-only job can still create an MLflow run. `parameters.mlflow_traces_experiment_name` is separate and controls where **input traces** are fetched. See the [MLflow guide](/guides/mlflow/#clear-traces-in-results-out).

## Configuration Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `data_dir` | string | Directory containing `*.json` trace files |
| `eval_model_name` | string | LLM judge model name (e.g. `openai/gpt-4o`) |
| `provider` | string | Inference provider (`openai`, `anthropic`, etc.) |
| `agent_framework` | string | Agent framework used to generate traces (e.g. `langgraph`) |
| `observability_framework` | string | Observability framework (e.g. `mlflow`) |
| `inference_backend` | string | `litellm` (default) or `endpoint` |
| `mlflow_traces_experiment_name` | string | MLflow experiment name to fetch input traces from |
| `mlflow_traces_experiment_id` | string | MLflow experiment id to fetch input traces from (alternative to name) |
| `mlflow_traces_filter` | string | Optional MLflow trace search filter |
| `mlflow_traces_run_id` | string | Optional run id filter for traces |
| `mlflow_traces_max_results` | int | Max traces to fetch (default `500`) |
| `mlflow_experiment_name` | string | Fallback result-upload experiment when JobSpec `experiment_name` is unset (CLEAR copies it onto the JobSpec before `callbacks.mlflow.save()`) |

## Provider Details

| Field | Value |
| --- | --- |
| Provider ID | `ibm-clear` |
| Benchmark ID | `agentic-evaluation` |

## Source

- **Adapter**: [eval-hub-contrib/adapters/clear](https://github.com/eval-hub/eval-hub-contrib/tree/main/adapters/clear)
- **Upstream**: [IBM/CLEAR](https://github.com/IBM/CLEAR)
