---
title: "Configuration Reference"
description: "Complete reference for Inspect AI adapter configuration options"
---

Complete reference for Inspect AI adapter configuration options.

## Job submission structure

Jobs are submitted through the EvalHub API / CLI using a `name` + `model` + `benchmarks[]` body (same shape as `evalhub eval run --config`):

```yaml
name: inspect-petri-sycophancy-001
model:
  url: https://maas.example.com/v1
  name: microsoft-phi-4
  auth:
    secret_ref: maas-creds
benchmarks:
  - id: inspect/petri-sycophancy
    provider_id: inspect
    parameters:
      auditor_model: gpt-oss-20b
      judge_model: deepseek-r1-distill-qwen-14b
      max_samples: 5
      max_turns: 20
```

Inside the job pod, EvalHub flattens each benchmark into an adapter `JobSpec` (`provider_id`, `benchmark_id`, `model`, `parameters`). The tables below describe those fields.

## Core Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|---|---|---|---|
| `name` (submission) / `id` (adapter) | string | Job identifier | `"inspect-petri-sycophancy-001"` |
| `benchmarks[].provider_id` / `provider_id` | string | Must be `"inspect"` | `"inspect"` |
| `benchmarks[].id` / `benchmark_id` | string | Benchmark to run (see [Benchmarks](benchmarks/)) | `"inspect/petri-sycophancy"` |
| `model.name` | string | Name of the evaluated (target) model | `"microsoft-phi-4"` |

### Optional Parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `model.url` | string | OpenAI-compatible endpoint for the target (sets global `OPENAI_BASE_URL`) | `null` |
| `model.auth.secret_ref` | string | Kubernetes Secret with model credentials (for example `api-key` for MaaS / LiteLLM) | `null` |
| `benchmark_index` | integer | Index when running multiple benchmarks | `0` |
| `experiment_name` | string | MLflow experiment name for result tracking | `null` |
| `parameters` | object | Inspect-specific configuration (see below) | `{}` |
| `callback_url` | string | EvalHub service callback URL | `null` |

## Model Names and Credentials

Model names are passed as-is — bare (`claude-opus-4-7`, `granite3.3`) or org/model (`ibm-granite/granite-3.3-8b-instruct`). Do not add provider prefixes; the adapter selects the API from credentials.

| Provider style | Model name examples |
|---|---|
| MaaS / LiteLLM | `microsoft-phi-4`, `gpt-oss-20b`, `deepseek-r1-distill-qwen-14b` |
| vLLM / HuggingFace | `ibm-granite/granite-3.3-8b-instruct`, `meta-llama/Llama-3.3-70B-Instruct` |
| Ollama | `granite3.3:8b`, `llama3.3`, `qwen3:32b` |
| OpenRouter | `meta-llama/llama-3.3-70b-instruct` |
| Anthropic | `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001` |

### Kubernetes Secret (recommended for MaaS)

Create a Secret with an `api-key` key and reference it from the job via `model.auth.secret_ref`. Plaintext API-key parameters (`api_key`, `target_api_key`, and other `*_api_key` fields) are for local or development use only — do not include them in persisted Kubernetes/API job submissions. Prefer `model.auth.secret_ref` or environment-based credentials (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) for submitted jobs:

```bash
kubectl create secret generic maas-creds \
  -n <namespace> \
  --from-literal=api-key="$MAAS_API_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -
```

```yaml
model:
  url: https://maas.example.com/v1   # OpenAI-compatible base URL
  name: microsoft-phi-4
  auth:
    secret_ref: maas-creds
```

EvalHub mounts the Secret for the sidecar; the adapter resolves `api-key` via `resolve_model_credentials()` into `OPENAI_API_KEY`. See the [Model authentication](/guides/model-authentication/) guide.

### Global credentials

These apply to all roles that do not have a per-role override:

| Env var / parameter | Used for |
|---|---|
| `OPENAI_BASE_URL` / `model.url` | OpenAI-compatible endpoint (MaaS, vLLM, Ollama `/v1`, OpenRouter) |
| `OPENAI_API_KEY` / mounted `api-key` / `api_key` | API key for the OpenAI-compatible endpoint |
| `ANTHROPIC_API_KEY` / `anthropic_api_key` | Anthropic Messages API |
| `ANTHROPIC_BASE_URL` | Anthropic API base URL override (proxies, on-prem) |

### Client selection priority (per role, no override)

1. `model.url` present → OpenAI-compatible client (for the target)
2. `ANTHROPIC_API_KEY` or `ANTHROPIC_BASE_URL` set → Anthropic client
3. `OPENAI_BASE_URL` or `OPENAI_API_KEY` set → OpenAI-compatible client

### Per-role credential overrides

Each role (target, auditor, judge, scenarios, realism) accepts its own endpoint and key. When set, only that role uses the override.

| Parameter pattern | Effect |
|---|---|
| `{role}_base_url` | OpenAI-compatible endpoint for this role only |
| `{role}_api_key` | API key for that OpenAI-compatible endpoint |
| `{role}_anthropic_base_url` | Anthropic endpoint for this role only |
| `{role}_anthropic_api_key` | Anthropic API key for this role |

:::note[Bloom scenarios step]
The `bloom scenarios` CLI only accepts bare `client/model` strings (for example `openai/gpt-oss-20b`). JSON model specs with `model_args` are not supported at that step. Before the subprocess runs, the adapter maps `scenarios_base_url` / `scenarios_api_key` onto `OPENAI_BASE_URL` / `OPENAI_API_KEY` in a copy of the job environment (or `OLLAMA_BASE_URL` for Ollama endpoints). If those parameters are unset, the scenarios step uses the existing global credentials.
:::

## Parameters Reference

All configuration below is specified in the `parameters` object of each benchmark (CLI/API) or the flattened adapter `JobSpec.parameters`.

### Target model

| Parameter | Type | Description | Default |
|---|---|---|---|
| `api_key` | string | Global API key for OpenAI-compatible endpoints (`OPENAI_API_KEY`). Local/development only — do not include in persisted Kubernetes/API job submissions; use `model.auth.secret_ref` or env-based credentials instead. Not required for unauthenticated vLLM. | `null` |
| `target_base_url` | string | Override endpoint URL for the target when it differs from `model.url` | `null` |
| `target_api_key` | string | API key for the target endpoint when different from `api_key`. Local/development only — do not include in persisted job submissions; prefer `model.auth.secret_ref` or env-based credentials. | `null` |

### Auditor model (Petri / Bloom)

| Parameter | Type | Description | Default |
|---|---|---|---|
| `auditor_model` | string | Auditor model name (bare or org/model) | `"claude-sonnet-4-6"` |
| `auditor_base_url` | string | OpenAI-compatible endpoint for the auditor | `null` |
| `auditor_api_key` | string | OpenAI-compatible API key for the auditor | `null` |
| `auditor_anthropic_base_url` | string | Anthropic base URL for the auditor (proxies / on-prem) | `null` |
| `auditor_anthropic_api_key` | string | Anthropic API key for the auditor | `null` |

### Judge model (Petri / Bloom)

| Parameter | Type | Description | Default |
|---|---|---|---|
| `judge_model` | string | Judge model name. Use the strongest available model — judge quality has the largest impact on audit reliability. | `"claude-opus-4-7"` |
| `judge_base_url` | string | OpenAI-compatible endpoint for the judge | `null` |
| `judge_api_key` | string | OpenAI-compatible API key for the judge | `null` |
| `judge_anthropic_base_url` | string | Anthropic base URL for the judge | `null` |
| `judge_anthropic_api_key` | string | Anthropic API key for the judge | `null` |

### Anthropic (global)

| Parameter | Type | Description | Default |
|---|---|---|---|
| `anthropic_api_key` | string | API key for the Anthropic API. Falls back to `ANTHROPIC_API_KEY`. | `null` |

### Scenarios model (Bloom only)

| Parameter | Type | Description | Default |
|---|---|---|---|
| `scenarios_model` | string | Model for the `bloom scenarios` generation step | `auditor_model` |
| `scenarios_base_url` | string | OpenAI-compatible endpoint for the scenarios model. Mapped to `OPENAI_BASE_URL` (or `OLLAMA_BASE_URL`) in the bloom scenarios subprocess env before that step runs. | `null` |
| `scenarios_api_key` | string | API key for the scenarios endpoint. Mapped to `OPENAI_API_KEY` in the bloom scenarios subprocess env before that step runs. | `null` |

### Realism model (Petri optional)

| Parameter | Type | Description | Default |
|---|---|---|---|
| `realism_model` | string | Optional fourth model role for realism filtering | `auditor_model` |
| `realism_base_url` | string | OpenAI-compatible endpoint for the realism model | `null` |
| `realism_api_key` | string | API key for the realism endpoint | `null` |

### Bloom-specific

| Parameter | Type | Description | Default |
|---|---|---|---|
| `behavior_dir` | string | Path to a pre-built behaviour directory (`bloom init` + `bloom scenarios`). Skips scenario generation when set. | `null` |
| `bloom_template` | string | Template for `bloom init --from <template>`. Required for `inspect/bloom-custom` when `behavior_dir` is unset. Example: `delusion_sycophancy`. | `null` |

### Petri / Bloom audit parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `seed_instructions` | string | Override seed selection: `tags:sycophancy`, `id:seed_name`, `id:seed1,seed2`, inline text, or a path. When unset, the benchmark default seed tag is used. | `null` |
| `judge_dimensions` | string | Override judge dimensions: `tags:safety`, a dimensions directory path, or dimension names. Defaults to all 38 built-in dimensions. | `null` |
| `max_turns` | integer | Maximum auditor turns per scenario | `30` |
| `enable_rollback` | boolean | Allow the auditor to restart from a prior checkpoint | `true` |
| `realism_filter` | boolean | Filter auditor outputs by realism score (boolean or float threshold). Experimental. | `false` |
| `target_tools` | string | Tool-creation mode: `synthetic` (default), `fixed`, or `none` | `"synthetic"` |
| `epochs` | integer | Repeat each seed/scenario N times | `1` |

### Standard mode

| Parameter | Type | Description | Default |
|---|---|---|---|
| `task` | string | Task spec override. Required for `inspect/custom`. Accepts a Python import path (`inspect_evals/mmlu`), file path (`./my_task.py@my_task`), or Petri task (`inspect_petri/audit`). | `null` |
| `sandbox` | string | Execution sandbox: `none`, `docker`, or `k8s`. Use `docker` for tasks that need code-execution isolation (for example `swe-bench`, `humaneval`) when Docker is available. | `none` |

### Common

| Parameter | Type | Description | Default |
|---|---|---|---|
| `max_tasks` | integer | Number of tasks to run concurrently | `1` |
| `max_samples` | integer | Limit samples per task. Strongly recommended for Petri/Bloom development runs to control cost. | `null` |
| `task_args` | object | Pass-through task arguments forwarded as `-T key=value`. For Dish (research preview): `{"dish_scaffold": "claude-code"}`. | `{}` |
| `log_level` | string | Inspect AI log verbosity (`debug`, `info`, `warning`, `error`) | `"info"` |
| `languages` | array | ISO 639 language codes for EvalCard metadata | `[en]` |
| `languages_count` | integer | Number of languages in the evaluation dataset | `1` |

## Kubernetes and Container Notes

### Sandbox

Standard inspect-evals benchmarks run without a Docker sandbox inside Kubernetes pods (code executes in the adapter container). This is the only sandbox available in typical K8s deployments. Override with `parameters.sandbox` if you have a different provider configured (for example `"docker"` for local development with Docker Engine):

```json
{ "parameters": { "sandbox": "docker" } }
```

Petri and Bloom modes do not use a sandbox.

### HuggingFace datasets

Some inspect-evals benchmarks (for example `humaneval`, `mmlu`) download datasets from the HuggingFace Hub. The adapter reads an `hf-token` secret mounted at `/var/run/secrets/model/hf-token` and injects it as `HF_TOKEN` automatically. Mount the secret in your EvalHub provider configuration if gated datasets are required.
