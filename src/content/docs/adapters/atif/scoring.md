---
title: "Scoring Modes"
description: "How the ATIF adapter resolves criteria and scores trajectory steps"
---

The ATIF adapter scores every recorded step of a trajectory against a set of criteria. The `scoring_mode` parameter controls where those criteria come from.

| Mode | Criteria source | Required parameters |
|------|----------------|---------------------|
| `auto` | Derived by the judge from the task | none |
| `benchmark` | Built-in benchmark rubric | `benchmark_name` |
| `reference` | Registry rubric with expected answers | `reference_registry_path` |
| `custom` | Inline or mounted rubric | `provider_params.rubric` |

## Auto

In `auto` mode the adapter first resolves a task for each trajectory, then asks the judge to derive scoring criteria for that task.

**Task resolution** prefers, in order:

1. A non-empty `extra.task_instruction` field on the trajectory
2. The first textual `source=user` frame (including text blocks of a multimodal message)

If neither exists, that node fails — auto mode never infers a task from tool output. Use explicit trajectory metadata or an explicit rubric instead. In multi-task user conversations the first user frame is only the initial task; subsequent messages remain history.

Criteria are derived once **per distinct task within a job**, keyed by task and prompt-template hash, so repeated tasks cost a single derivation. Each derivation must return 1–32 uniquely named criteria with positive finite weights. A missing description falls back to the criterion name; invalid JSON or invalid criteria fail explicitly — there is no generic fallback rubric. Exact normalized criteria, criteria/task hashes, prompt version, benchmark registry version when applicable, and judge model settings are persisted with the results.

## Benchmark

`scoring_mode=benchmark` requires `benchmark_name`. Three rubrics are built in (registry version 1):

| Benchmark | Criteria |
|-----------|----------|
| `swe-bench-lite` | `task_correctness`, `patch_quality`, `regression_safety` |
| `terminal-bench` | `task_completion`, `tool_effectiveness`, `environment_safety` |
| `humaneval` | `functional_correctness`, `reasoning_quality`, `code_quality` |

:::caution[Assessment rubrics, not verifiers]
Built-in benchmark rubrics are scoring instructions only. The registry does not contain the benchmark datasets, never executes a benchmark verifier, and a high score is not a correctness claim equivalent to running the benchmark.
:::

## Reference

`scoring_mode=reference` requires a local `reference_registry_path` pointing at a JSON file:

```json
{
  "rubrics": {
    "default": {
      "criteria": [
        {
          "name": "correctness",
          "description": "Matches the reference",
          "weight": 1
        }
      ],
      "references": {
        "default": {
          "answer": "Expected answer"
        }
      }
    }
  }
}
```

`reference_rubric` selects the rubric (default `default`). Reference selection per trajectory uses `extra.reference_id`, then `trajectory_id`, then the optional `default` reference. Missing references fail explicitly rather than scoring without a reference.

## Custom

`scoring_mode=custom` requires `provider_params.rubric` — an object or a safe YAML/JSON document string:

```yaml
name: answer_quality
aggregation: weighted_mean
criteria:
  - name: correctness
    description: Addresses the requested task
    weight: 2
  - name: clarity
    description: Explains the result clearly
    weight: 1
```

The legacy `custom_rubric` and `custom_rubric_path` parameters also work; supply exactly one source. Criteria have unique non-empty names and descriptions (up to 2,000 characters each) and positive finite weights. All forms are limited to 16 KiB.

The judge returns `{"scores": {"correctness": 0.9, "clarity": 0.8}}`; the adapter validates the returned criterion set matches the rubric exactly and computes the aggregate locally using `weighted_mean`, `mean`, or `minimum`.

## Judge Protocol

Every scoring and categorization request carries the task, tool definitions, the current step, recent prior interactions and observations, and available parent delegation evidence.

A dedicated system instruction instructs the judge to treat all trajectory, rubric, and reference content as untrusted evidence rather than instructions. This reduces instruction confusion but is **not** a proof of prompt-injection immunity.

:::note[Response format]
Judges are asked to return bare JSON objects. The adapter also tolerates fenced (```` ```json ````) and prose-wrapped responses by extracting the first balanced JSON object; responses with no valid JSON object are protocol errors, not low scores.
:::

The current prompt generation is `atif-context-v2`, recorded in the `atif_prompt_version` run parameter so results from different prompt versions can be distinguished.

## Context Budgeting

Each request is serialized within `max_context_bytes` (default 65536, minimum 1024):

- Half of the budget is allocated to context and current-step evidence
- Oldest history frames are dropped first; the number of omitted frames is retained per scored step
- Context projection omits top-level step metrics, token arrays, and arbitrary producer extras
- Image and audio references are replaced by explicit omitted markers — evaluation is text-based

Oversized required task, current-step, or delegation evidence, or a complete request over the limit, fails explicitly rather than being silently clipped and scored.

## Score Validation

The judge must return numeric scores in the range [0, 1]:

- Malformed, boolean, non-finite, missing, or out-of-range scores are **protocol failures**, not low-quality scores — the adapter never guesses or defaults a value
- Genuine zero scores are valid
- For backward compatibility, **all recorded frames (including user and system frames) are scored** and participate in denominators; this convention is recorded as `atif_scored_frames=all` in the run metadata

See [Metrics](../metrics/) for how step scores roll up into node, subtree, and collection scores.
