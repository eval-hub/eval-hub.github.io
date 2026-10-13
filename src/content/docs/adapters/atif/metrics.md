---
title: "Metrics and Results"
description: "Score semantics, aggregation modes, and failure categorization for ATIF evaluations"
---

The ATIF adapter reports a small set of summary metrics to the eval-hub service and records detailed per-step results as MLflow artifacts.

## Reported Metrics

| Metric | Description |
|--------|-------------|
| `atif_overall_score` | Collection-level aggregate score; also drives `overall_score` |
| `atif_trajectory_count` | Number of scored trajectories contributing to the aggregate |
| `atif_failure_categorization_rate` | Fraction of low-scoring trajectories where every low-scoring step received an actionable category |

The run's `overall_score` equals `atif_overall_score`, and `num_examples_evaluated` counts scored trajectories. Detailed results — per-trajectory and per-step scores, criteria, categories, and provenance — are persisted to MLflow (see [Artifacts](artifacts/)).

## Score Semantics

Scores are floats in [0, 1] at every level:

- **Step score**: the judge's score for one recorded step against the resolved criteria
- **Node own score**: the mean of the node's step scores
- **Subtree aggregate**: step-count-weighted combination of a node's own score and its descendants' aggregates:

```
(own_mean × own_steps + Σ child_aggregate × child_steps) / (own_steps + Σ child_steps)
```

- **A node passes** when it is complete and its aggregate score is at or above `completion_threshold` (inclusive)
- **A step is a failure candidate** when its score is strictly below `failure_threshold`

Root depth is zero. Nodes beyond `max_subagent_depth` remain explicitly unscored; failed or omitted required children make their ancestors `complete=false`. The all-failed-root case always fails the job; `partial_result_policy=skip_failed_trajectory` otherwise retains failed nodes and lets successful roots contribute. Repeated agent names are not treated as cycles.

## Aggregation Modes

`atif_overall_score` depends on `subagent_aggregation`:

| Mode | Collection score |
|------|-----------------|
| `flat` | Mean of each scored node's own mean (not a global step-weighted mean) |
| `hierarchical` | Mean of root subtree aggregates |
| `separate` | Mean of root own scores; descendants remain in detail artifacts only |

## Failure Categorization

Steps below `failure_threshold` are sent back to the judge for classification into a fixed taxonomy:

| Category | Meaning |
|----------|---------|
| `tool_selection_failure` | The agent chose the wrong tool or wrong tool arguments |
| `context_loss` | The agent lost track of task requirements or prior evidence |
| `policy_boundary_violation` | The step crossed a stated policy or safety boundary |
| `reasoning_failure` | The agent's reasoning did not support its action |
| `none` | No actionable failure is detectable — a valid abstention |

Invalid categorization responses are recorded as `uncategorized`; transport failures record `categorization_status=judge_error`. Raw malformed responses and raw exception messages are never persisted in score results. Judge responses are capped at 64 KiB and retained rationales at 2,000 characters.

### Categorization Rate

`atif_failure_categorization_rate` measures the fraction of low-scoring trajectories for which **every** low-scoring step received an actionable category (i.e. not `none`). The no-detected-failures convention is 1.0.

:::caution[Proxy metric]
This rate measures judge response validity, not ground-truth detection or category accuracy. `none` is a valid abstention and counts against actionable coverage.
:::

## Interpreting Results

- **Judge scores are model opinions.** Use them for regression tracking across comparable runs (same judge, same prompt version, same rubric) rather than as absolute quality claims. The `atif_prompt_version` and `atif_judge` run parameters record what produced a score.
- **All frames are scored.** For backward compatibility, user and system frames participate in step-score denominators (`atif_scored_frames=all`).
- **Zeros are real.** A genuine `0.0` is a valid score; protocol failures surface as errors, not as zeros.
- **Completeness matters.** `atif_complete` in the run metadata is true only when every node scored completely and no input was invalid — a job with skipped subagents or invalid files reports `false`.

## Observability

The adapter exports OpenTelemetry metrics for the judge interaction:

| Metric | Signal |
|--------|--------|
| `atif.judge.call.latency` | Per-request latency |
| `atif.judge.call.count` | Request count |
| `atif.judge.call.success` | HTTP successes |
| `atif.judge.call.errors` | Transport/HTTP errors |
| `atif.judge.protocol.errors` | Invalid judge protocol responses |
| `atif.judge.token.count` | Input/output token counts |

HTTP success and valid protocol responses are deliberately separate signals: a judge can return HTTP 200 with an unusable body. See the [OpenTelemetry guide](/guides/opentelemetry/).
