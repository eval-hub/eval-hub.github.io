---
title: "Configuration Reference"
description: "Complete reference for ATIF adapter configuration options"
---

Complete reference for ATIF adapter configuration options.

## JobSpec Structure

The ATIF adapter uses a standardised `JobSpec` structure:

```json
{
  "id": "string",
  "provider_id": "atif",
  "benchmark_id": "atif_trajectory_default",
  "benchmark_index": 0,
  "experiment_name": "string",
  "model": {
    "name": "string",
    "url": "string"
  },
  "callback_url": "string",
  "parameters": {
    // ATIF-specific configuration
  }
}
```

`model` configures the **judge**, not the agent that produced the trajectories. The agent and its model are recorded inside each trajectory file.

## Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `id` | string | Unique job identifier | `"atif-regression-001"` |
| `benchmark_id` | string | Benchmark identifier | `"atif_trajectory_default"` |
| `experiment_name` | string | MLflow experiment name; required for durable artifacts | `"agent-regressions"` |
| `model.name` | string | Judge model name | `"microsoft-phi-4"` |
| `model.url` | string | OpenAI-compatible judge endpoint (local mode) | `"http://localhost:8000/v1"` |
| `callback_url` | string | SDK callback URL | `"http://localhost:8081"` |

:::note
In local mode `model.url` is used directly and `model.auth.secret_ref` provides credentials (see below). In Kubernetes the adapter talks to the runtime sidecar instead, and the sidecar owns upstream authentication.
:::

## Model-auth Secret

**Judge URLs and API keys must not be placed in API payload `parameters`.**
The primary judge endpoint is `model.url`; reference its credential Secret with
`model.auth.secret_ref`. Optionally use a separate `judge` connection:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: atif-model-auth
  namespace: team-a
type: Opaque
stringData:
  api-key: "<primary-credential>"
  judge_api-key: "<judge-credential>"
  judge_url: https://judge.example/v1
```

ATIF still selects the judge model with `model.name`; this does not select the
agent model recorded inside trajectory data. With no judge entries it reuses
the primary Secret connection. A judge key alone reuses the primary URL; a judge
URL without its matching key is invalid.

In Kubernetes the adapter reads the projected `judge_api-key:ref` and sidecar URL
under `/var/run/secrets/model`, and sends the reference as a Bearer token in its
HTTPX chat-completions request. The sidecar routes it and substitutes the real
credential. Legacy `judge_url` / `judge_api_key` parameters and
`EVALHUB_JUDGE_PROXY_URL` are ignored; parameter presence alone does not fail a job.

For direct local execution, the same keys are real-value files in the bounded
`file:///` auth directory described below. See
[migration and image availability](/guides/judge-and-scorer-models/#migration-from-inline-connection-parameters)
and [Model Authentication](/guides/model-authentication/).

## Scoring Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `trajectory_path` | string | `/test_data` | ATIF file or directory, scanned recursively in deterministic order |
| `scoring_mode` | string | `auto` | `auto`, `benchmark`, `reference`, or `custom` — see [Scoring Modes](../scoring/) |
| `benchmark_name` | string | unset | Built-in rubric for `benchmark` mode: `swebench-verified`, `terminal-bench`, or `humanevalfix` |
| `reference_registry_path` | string | unset | JSON rubric registry, required in `reference` mode |
| `reference_rubric` | string | `default` | Rubric name selected from the reference registry |
| `provider_params.rubric` | object | unset | Inline custom rubric object or YAML/JSON document string, required in `custom` mode |
| `custom_rubric` | object | unset | Legacy inline rubric alias |
| `custom_rubric_path` | string | unset | Legacy mounted rubric path alias |

:::caution[Exactly one rubric source]
In `custom` mode supply exactly one of `provider_params.rubric`, `custom_rubric`, or `custom_rubric_path`. All forms are limited to 16 KiB and read within collection byte budgets.
:::

## Limits and Validation

Limits protect the job against pathologically large or malformed collections. Collection-wide byte and step budgets are fatal regardless of the invalid-input policy.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_file_bytes` | integer | 10485760 | Maximum size of an individual ATIF JSON file |
| `max_trajectory_files` | integer | 10000 | Maximum number of JSON files discovered |
| `max_collection_bytes` | integer | 67108864 | Collection-wide input byte budget, including ignored and invalid files |
| `max_steps_per_trajectory` | integer | 500 | Maximum steps per trajectory, including nested subagents |
| `max_total_steps` | integer | 10000 | Maximum steps across all accepted roots and embedded descendants |
| `invalid_input_policy` | string | `skip_invalid` | `skip_invalid` records invalid candidates and continues; `fail_fast` aborts |

Symlink paths and non-regular files are rejected; rubric files follow the same policy.

## Aggregation and Thresholds

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `subagent_aggregation` | string | `flat` | `flat`, `hierarchical`, or `separate` — see [Metrics](../metrics/#aggregation-modes) |
| `max_subagent_depth` | integer | 3 | Root depth is zero; deeper descendants remain explicitly unscored and make ancestors incomplete |
| `failure_threshold` | float | 0.5 | Scores strictly below this trigger failure categorization |
| `completion_threshold` | float | 0.5 | Aggregate score at or above this marks a trajectory passed |
| `training_threshold` | float | unset | Optional threshold for complete node-level training selections — see [Artifacts](../artifacts/#training-selections) |
| `partial_result_policy` | string | `fail_fast` | `fail_fast` or `skip_failed_trajectory` when a trajectory cannot be scored |

## Judge Runtime

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `concurrency_limit` | integer | 10 | Maximum trajectories scored concurrently (steps within a trajectory are sequential) |
| `judge_timeout_seconds` | float | 30 | Timeout for each judge HTTP attempt |
| `judge_max_attempts` | integer | 3 | Maximum attempts per judge request, including the initial attempt (1–10) |
| `judge_initial_backoff_seconds` | float | 0.5 | Initial exponential backoff delay for retryable failures |
| `max_judge_requests` | integer | unset | Optional job-wide budget on judge HTTP attempts, including derivation, categorization, and retries |
| `job_timeout_seconds` | float | 3600 | Deadline for the complete scoring phase; cancels outstanding workers when exceeded |
| `max_context_bytes` | integer | 65536 | Maximum serialized judge request size; history gets half this budget and drops oldest frames first (minimum 1024) |

HTTP 429/5xx and transport timeouts are retried with exponential backoff. Other HTTP failures and invalid score responses are not retried. When the scoring deadline is reached, outstanding workers are cancelled and the client closed.

## Judge Routing and Authentication

### Kubernetes

The adapter uses the projected `judge` connection or rewritten `model.url`.
It reads credential references, such as `judge_api-key:ref` or `api-key:ref`,
from the model-auth mount and sends the selected reference as a Bearer token.
The real credential is available only to the sidecar, which owns upstream
authentication and TLS. `EVALHUB_JUDGE_PROXY_URL` is no longer a connection input.

### Local

In direct local mode the adapter uses `judge_url` from the auth directory when
present, otherwise `model.url`:

- `model.auth.secret_ref` must be an absolute `file:///` directory URL
- Use `api-key` for the primary credential, or `judge_api-key` / `judge_url` for a separate judge; an optional `ca_cert` file enables custom CA verification
- The directory must be a regular directory with no symlinks anywhere in its path

```json
{
  "model": {
    "name": "microsoft-phi-4",
    "url": "https://judge.internal.example.com/v1",
    "auth": {
      "secret_ref": "file:///mnt/judge-auth"
    }
  }
}
```

```bash
# Prepare the auth directory (example)
install -d -m 750 ~/.config/atif-judge-auth
install -m 640 /path/to/key ~/.config/atif-judge-auth/api-key
```

:::caution[Credentials stay out of band]
Do not put credentials in the job spec, trajectory inputs, container image, or source control. A different on-disk JobSpec is never used to discover credentials. See the [model authentication guide](/guides/model-authentication/).
:::

## Input Discovery and Validation

`trajectory_path` accepts a single JSON file or a directory scanned recursively in deterministic order:

- `trajectory.json` and `*.atif.json` are explicit candidates
- Other JSON objects with ATIF-like fields (`schema_version`, `atif_schema_version`, `agent`, or `steps`) are also candidates
- Unrelated JSON in collections is ignored; malformed JSON is recorded as invalid rather than guessed to be unrelated

Schema versions `ATIF-v1.0` through `ATIF-v1.8` are validated by the pinned SDK. `schema_version` must be explicit, including in embedded nodes; `atif_schema_version` is accepted as a root alias only if it agrees with the canonical field. Sequential step IDs, embedded references, and trajectory identity uniqueness are SDK-validated; duplicate non-null IDs across accepted trees are invalid.

Producer trajectory IDs are preserved. ID-less roots receive a stable source-qualified SHA-256 evaluation ID. Each node records the original producer ID, input SHA-256, local path, source URI, and a JSON Pointer selector (empty for a root, e.g. `/subagent_trajectories/0` for an embedded child).

:::note[S3 provenance]
When `TEST_DATA_S3_BUCKET`/`TEST_DATA_S3_KEY` are available and files are under `/test_data`, source URIs are reconstructed using the generic init's layout. Otherwise they remain local paths. Local paths are not automatically downloadable URLs.
:::

## Environment Variables

The adapter reads runtime settings from environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `EVALHUB_MODE` | Execution mode (`k8s` or `local`) | No | `k8s` |
| `EVALHUB_JOB_SPEC_PATH` | Path to job spec JSON | Yes (local mode) | `/meta/job.json` (k8s) |
| `TEST_DATA_S3_BUCKET` | S3 bucket for source URI reconstruction | No | unset |
| `TEST_DATA_S3_KEY` | S3 prefix for source URI reconstruction | No | unset |

## Complete Example

```json
{
  "id": "atif-regression-001",
  "provider_id": "atif",
  "benchmark_id": "atif_trajectory_default",
  "benchmark_index": 0,
  "experiment_name": "agent-regressions",
  "model": {
    "name": "microsoft-phi-4",
    "url": "https://judge.internal.example.com/v1",
    "auth": {
      "secret_ref": "file:///mnt/judge-auth"
    }
  },
  "callback_url": "http://localhost:8081",
  "parameters": {
    "trajectory_path": "/test_data",
    "scoring_mode": "auto",
    "concurrency_limit": 2,
    "max_judge_requests": 24,
    "judge_timeout_seconds": 60,
    "partial_result_policy": "skip_failed_trajectory",
    "training_threshold": 0.8
  }
}
```
