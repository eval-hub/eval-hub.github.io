---
title: "LM Evaluation Harness Configuration"
description: "Configure LM Evaluation Harness benchmarks in EvalHub"
---

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
| `tokenizer` | Hugging Face tokenizer ID or local path used with the OpenAI-compatible endpoint |
| `random_seed` | Random seed used by LM Evaluation Harness; defaults to `42` |
| `parameters` | Nested scalar generation parameters serialized as LM Evaluation Harness generation kwargs |

Only the top-level keys listed above are interpreted by the adapter. Keys in
the nested `parameters` object are serialized as generation kwargs; other
top-level keys are not automatically translated into task configuration.

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
