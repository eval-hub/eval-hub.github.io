---
title: "LM Evaluation Harness Configuration"
description: "Configure LM Evaluation Harness benchmarks in EvalHub"
---

## Model authentication

For OpenAI-compatible API backends, put the primary URL in `model.url` and the
credential in `api-key` in the Secret referenced by `model.auth.secret_ref`.
Do not put model URLs or API keys in API payload `parameters` or backend
passthrough settings. In Kubernetes, use the rewritten sidecar URL and mounted
reference, as described in [Model Authentication](/guides/model-authentication/).
This connection guidance does not change local model-loading or dataset options.

## Evaluation job example

```yaml
name: lm-eval-example
model:
  name: meta-llama/Llama-3.1-8B-Instruct
  url: http://model-endpoint:8080/v1
benchmarks:
  - id: arc_easy
    provider_id: lm_evaluation_harness
    parameters:
      num_examples: 10
      num_few_shot: 5
```

The adapter recognizes the common parameters below. Individual tasks may
impose additional constraints, so use the task definition and its README as
the source of truth.

## Common parameters

| Parameter | Description |
|---|---|
| `num_examples` | Limit the number of evaluated samples; useful for smoke tests but not final metrics |
| `num_few_shot` | Number of few-shot examples, when supported by the task |
| `batch_size` | Request batch size; defaults to `1` |
| `num_concurrent` | Number of concurrent requests, capped by the adapter at `128` |
| `timeout_seconds` | Request timeout in seconds; defaults to `300` |
| `tokenizer` | Hugging Face tokenizer ID or local path used with the OpenAI-compatible endpoint; defaults to `model.name` when omitted |
| `random_seed` | Random seed used by LM Evaluation Harness; defaults to `42` |
| `parameters` | Nested scalar generation parameters serialized as LM Evaluation Harness generation kwargs |

Only the top-level keys listed above are interpreted by the adapter. Keys in
the nested `parameters` object are serialized as generation kwargs; other
top-level keys are not automatically translated into task configuration.

## Tokenizer selection and authentication

The adapter uses a Hugging Face tokenizer even when evaluating a model through
an OpenAI-compatible endpoint. If `benchmarks[].parameters.tokenizer` is omitted,
the adapter uses `model.name` as the Hugging Face tokenizer identifier.
The example above uses
`meta-llama/Llama-3.1-8B-Instruct` for both the served model name and the tokenizer.

If your endpoint uses a model alias that is not a Hugging Face repository ID,
set `parameters.tokenizer` explicitly to a tokenizer compatible with the served
model. For example, for an endpoint serving Llama 3.1 8B Instruct:

```yaml
model:
  name: my-served-llama
  url: http://model-endpoint:8080/v1
  auth:
    secret_ref: my-model-auth
benchmarks:
  - id: arc_easy
    provider_id: lm_evaluation_harness
    parameters:
      tokenizer: meta-llama/Llama-3.1-8B-Instruct
      num_examples: 10
```

With the CLI, pass the tokenizer using `--param tokenizer=...`. For example,
when the endpoint serves `Qwen/Qwen3.6-35B-A3B` under the name `Qwen3.6-35B-A3B`:

```bash
evalhub eval run \
  --name my-eval \
  --model-url https://my-model-url/v1 \
  --model-name Qwen3.6-35B-A3B \
  --provider lm_evaluation_harness \
  --secret-ref my-model-auth \
  --param tokenizer=Qwen/Qwen3.6-35B-A3B \
  -b winogender
```

Without the override, the adapter tries `Qwen3.6-35B-A3B` as the Hugging Face
repository ID. If that repository does not exist, the evaluation fails with a
repository-not-found error.

To download a tokenizer from a gated repository, provide `HF_TOKEN` for a
Hugging Face account with approved access, using a token with read permission
for that repository. This applies both to an explicitly
configured tokenizer and to the implicit `model.name` default. Authentication
to the model endpoint does not grant access to a gated Hugging Face repository.

Use the existing [Hugging Face token Secret setup](/guides/bring-your-own-framework/#environment-variables)
to add an `hf-token` key to your model authentication Secret (`my-model-auth`
in both examples). Reference that Secret through `model.auth.secret_ref` in
the job configuration or `--secret-ref` in the CLI. This makes the token available as
`HF_TOKEN` to the built-in adapter. See
[Model Authentication](/guides/model-authentication/) for combining the Hugging
Face token with endpoint credentials.

For air-gapped clusters, see
[Disconnected Cluster Evaluation](/guides/disconnected-cluster/).

## Task-specific requirements

Some tasks require additional image-level configuration:

| Benchmark(s) | Requirement |
|---|---|
| `careqa_open_perplexity` | `evaluate` and `bert-score` (the runner image also needs `matplotlib` for `bert_score` import) |
| `tinyTruthfulQA` | `tinyBenchmarks` |
| `humaneval`, `humaneval_instruct`, `mbpp` | `HF_ALLOW_CODE_EVAL=1`; generated code is executed and requires isolation |
| Gated Hugging Face datasets | `HF_TOKEN`, or an `hf-token` key in the model authentication Secret |

These requirements belong in the `ta-lmes-job` image or its runtime
configuration. Adding a benchmark to `config/providers/lm_evaluation_harness.yaml`
does not install missing packages.

## Code execution safety

`humaneval`, `humaneval_instruct`, and `mbpp` use the `code_eval` metric, which executes
model-generated Python code. Run these benchmarks only in an appropriately
isolated evaluation environment. The runner must explicitly set
`HF_ALLOW_CODE_EVAL=1` before the benchmark is executed.

In the current LM Evaluation Harness integration, this code runs inside the
evaluation Job container; it is not delegated to a separate code-execution
sandbox.

Do not enable this setting for an untrusted, shared host environment.

## Dataset and token handling

Review the task's `dataset_path`, `dataset_name`, and download code before
deployment. Tasks may download data at runtime, require a Hugging Face token,
or require data to be pre-staged for disconnected clusters. For air-gapped
deployments, see [Disconnected Cluster Evaluation](/guides/disconnected-cluster/).
