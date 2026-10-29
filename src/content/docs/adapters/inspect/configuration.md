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

Model identifiers remain parameters; endpoints and credentials come from the
model-auth Secret. Use the identifier served by the selected OpenAI-compatible
endpoint, either bare or `org/model`. An auxiliary `ollama/` prefix explicitly
selects Inspect's Ollama wrapper, which also uses OpenAI-compatible Bearer auth.

| Provider style | Model name examples |
|---|---|
| MaaS / LiteLLM | `microsoft-phi-4`, `gpt-oss-20b`, `deepseek-r1-distill-qwen-14b` |
| vLLM / HuggingFace | `ibm-granite/granite-3.3-8b-instruct`, `meta-llama/Llama-3.3-70B-Instruct` |
| Ollama | `granite3.3:8b`, `llama3.3`, `qwen3:32b` |
| OpenRouter | `meta-llama/llama-3.3-70b-instruct` |
| Models behind an OpenAI-compatible gateway | The model ID exposed by that gateway |

### Kubernetes Secret (recommended for MaaS)

**Model connection URLs and API keys are not supported in API payload
`parameters`.** Keep the target URL in `model.url`, the target credential in
`api-key`, and auxiliary connections in `<role>_api-key` / `<role>_url` entries
of the same Secret. These rules also apply to local auth directories.

The migration below requires an adapter image containing
[contrib PR #263](https://github.com/eval-hub/eval-hub-contrib/pull/263).
For an existing Inspect deployment, update the image and matching catalog
together; see [adapter availability](/guides/judge-and-scorer-models/#migration-from-inline-connection-parameters).

```bash
kubectl create secret generic maas-creds \
  -n <namespace> \
  --from-literal=api-key="$MAAS_API_KEY" \
  --from-literal=auditor_api-key="$AUDITOR_API_KEY" \
  --from-literal=auditor_url="$AUDITOR_URL" \
  --from-literal=judge_api-key="$JUDGE_API_KEY" \
  --from-literal=judge_url="$JUDGE_URL" \
  --dry-run=client -o yaml | kubectl apply -f -
```

```yaml
model:
  url: https://maas.example.com/v1   # OpenAI-compatible base URL
  name: microsoft-phi-4
  auth:
    secret_ref: maas-creds
```

If every role shares the primary connection, create only `api-key`; omit the
role-specific entries. For a separate endpoint provide both role entries. A role
key without a URL uses `model.url` with that key; a role URL without its matching
key is invalid. Use the exact `judge_api-key` spelling, not `judge_api_key`.

### Secret roles and model selection

| Use | Model selection | Secret connection |
|---|---|---|
| Target | `model.name` | `api-key`, with endpoint in `model.url` |
| Petri/Bloom auditor | `auditor_model` | `auditor_api-key` / `auditor_url` |
| Petri/Bloom judge | `judge_model` | `judge_api-key` / `judge_url` |
| Bloom generation | `scenarios_model` | `scenarios_api-key` / `scenarios_url` |
| Optional realism role | `realism_model` | `realism_api-key` / `realism_url` |
| HLE / CyberSecEval collection judge | `judge_model` | `judge_api-key` / `judge_url` |
| StrongREJECT | `grader_model` | `judge_api-key` / `judge_url` |
| Named roles, including standalone HLE | `model_roles: {grader: model_id}` | `grader_api-key` / `grader_url`; use the matching prefix for any role |

### What Inspect receives

The real Secret is mounted only in the sidecar. Inspect reads projected files
under `/var/run/secrets/model`: `judge_api-key` contains `judge_api-key:ref`, and
`judge_url` contains a sidecar URL such as `http://localhost:8080/v1`, preserving
the original API path. `JobSpec.model.url` is also rewritten to the sidecar.
The adapter uses SDK Secret readers and creates role-specific model specs; it
passes the reference as the client's API key. The sidecar selects the real
endpoint and injects its credential from the Bearer reference. Equal projected
URLs do not mean the role credentials are interchangeable.

### Migration for existing Inspect jobs

Remove `api_key`, `target_base_url`, `target_api_key`, role `*_base_url` /
`*_api_key`, and `*_anthropic_*` connection fields from parameters. Put auxiliary
connections in the Secret and the primary URL in `model.url`. Legacy inline
connection fields are ignored; their presence alone does not fail a job, but
their values cannot override or fill missing Secret entries. With no role
entries, the role uses the primary connection.

Connection fields in `model_args`, including nested dictionaries and lists,
are removed before forwarding to Inspect; generation settings are retained.
Legacy `model_roles` dictionaries may contain a `model` name, but their connection
settings are ignored. Auxiliary `OPENAI_JUDGE_*`, `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, and URL environment variables do not configure role
connections. The adapter sets framework environment values from Secret resolution.

Native `anthropic/` auxiliary clients are not supported by this Bearer-reference
contract because they use `x-api-key`. Serve such models through an
OpenAI-compatible gateway. Inspect's Ollama wrapper uses `/v1` and Bearer auth;
its upstream port cannot be detected after the URL has been rewritten.

:::note[Bloom scenarios step]
The `bloom scenarios` CLI only accepts bare `client/model` strings. The adapter
reads `scenarios_api-key` / `scenarios_url` from the Secret and sets
`OPENAI_API_KEY` / `OPENAI_BASE_URL` in an isolated subprocess environment. With
no scenario entries it uses the primary Secret connection, not the auditor's
connection. This step uses the OpenAI-compatible client, including for Ollama.
:::

## Parameters Reference

All configuration below is specified in the `parameters` object of each benchmark (CLI/API) or the flattened adapter `JobSpec.parameters`.

### Target model

The target is configured by `model.name`, `model.url`, and `model.auth.secret_ref`,
outside `parameters`. Do not add target URLs or API keys to this object.

### Auditor model (Petri / Bloom)

| Parameter | Type | Description | Default |
|---|---|---|---|
| `auditor_model` | string | Auditor model name (bare or org/model) | `"claude-sonnet-4-6"` |

### Judge model (Petri / Bloom)

| Parameter | Type | Description | Default |
|---|---|---|---|
| `judge_model` | string | Judge model name. Use the strongest available model — judge quality has the largest impact on audit reliability. | `"claude-opus-4-7"` |

### Scenarios model (Bloom only)

| Parameter | Type | Description | Default |
|---|---|---|---|
| `scenarios_model` | string | Model for the `bloom scenarios` generation step | `auditor_model` |

### Realism model (Petri optional)

| Parameter | Type | Description | Default |
|---|---|---|---|
| `realism_model` | string | Optional fourth model role for realism filtering | `auditor_model` |

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
| `realism_filter` | boolean \| number | Filter auditor outputs by realism score. A boolean enables or disables filtering; a numeric value sets the realism-score threshold (for example `0.6`). Experimental. | `false` |
| `target_tools` | string | Tool-creation mode: `synthetic` (default), `fixed`, or `none` | `"synthetic"` |
| `epochs` | integer | Repeat each seed/scenario N times | `1` |

### Standard mode

| Parameter | Type | Description | Default |
|---|---|---|---|
| `task` | string | Task spec override. Required for `inspect/custom`. Accepts a Python import path (`inspect_evals/mmlu`), file path (`./my_task.py@my_task`), or Petri task (`inspect_petri/audit`). | `null` |
| `judge_model` | string | HLE / CyberSecEval collection grader model; connection uses the `judge` Secret pair | unset |
| `grader_model` | string | StrongREJECT grader model; connection uses the `judge` Secret pair | unset |
| `model_roles` | object | Named role to model ID, e.g. `{"grader": "deployed-grader"}`; connection uses that role's Secret pair | `{}` |
| `model_args` | object | Framework generation settings; connection overrides are ignored | `{}` |
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

Some inspect-evals benchmarks (for example `humaneval`, `mmlu`) download datasets
from the HuggingFace Hub. Add `hf-token` to the model-auth Secret referenced by
`model.auth.secret_ref`. It is passed through to `/var/run/secrets/model/hf-token`,
and the adapter configures `HF_TOKEN` for the framework. See
[Model Authentication](/guides/model-authentication/) for the mount layout.
