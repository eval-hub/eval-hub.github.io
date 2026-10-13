---
title: "Artifacts and Training Data"
description: "MLflow artifact layout, detailed result schema, and training-data selection for ATIF evaluations"
---

Detailed ATIF results are persisted as MLflow artifacts. This page describes the artifact layout, the detailed result schema, and how training-data selections are produced.

## MLflow Requirement

An `experiment_name` on the job and the SDK MLflow callback are required. Missing configuration fails before judge work starts, and a failed upload or a save returning no run ID fails the job rather than dropping detailed scores. The returned `JobResults` carries the MLflow run ID, and run parameters record the scoring configuration (`atif_prompt_version`, `atif_judge`, `atif_scoring_mode`, `atif_subagent_aggregation`, and related fields).

## Artifact Layout

Without a `training_threshold`:

```text
atif/evaluation_results.json
```

With a `training_threshold`:

```text
atif/report.json
atif/training/eligible_trajectories.json
atif/training/ineligible_trajectories.json
```

`atif/report.json` carries job metadata, the Environment Card, summaries, and cohort paths.

## Detailed Result Schema

`atif/evaluation_results.json` uses schema version **2**, which adds explicit completeness, node relationships, source selectors, criteria provenance, and loading diagnostics. Per trajectory it records:

- Status (`scored`/`failed`), own and aggregate scores, and completeness
- Per-step scores with criteria, failure categories, and omitted-history counts
- The producer trajectory ID, input SHA-256, local path, source URI, and JSON Pointer selector
- Criteria provenance: exact normalized criteria, criteria/task hashes, prompt version, benchmark registry version when applicable, and judge model/settings

The completion event's `artifacts["evalhub.atif_report"]` carries the schema version, MLflow run ID, artifact paths, scored/eligible counts, completeness, and selection unit. Details and manifests stay out of the completion event; the index exists so a consumer can retrieve MLflow details.

## Training Selections

Set `training_threshold` to produce node-level training cohorts:

- **Eligibility** requires complete subtree scoring and `aggregate_score >= training_threshold`
- Cohorts are **flat and disjoint**: records contain parent/child IDs, not embedded copies of nodes from the other cohort
- An eligible root may still contain an ineligible descendant
- Without a threshold, eligibility is unspecified and no cohorts are produced

:::note[Score-based selections only]
Cohorts are score-based selections. They are not claims about privacy, licensing, or training suitability — those require separate review.
:::

### Manifest Entries

Each cohort record contains:

| Field | Meaning |
|-------|---------|
| `source_uri` | Where the source file came from (S3 reconstruction when available, otherwise a local path) |
| `trajectory_id` | The producer trajectory ID |
| `selector` | JSON Pointer to the selected node (empty for a root, e.g. `/subagent_trajectories/0`) |
| `sha256` | Hash of the source file |

Selections are **node-level**: they are not permission to export entire source files or embedded subtrees. A consumer must resolve the selector, exclude separately selected descendants from the node export, and verify the hash. `source_paths` is informational only.

## Environment Card

The Environment Card summarizes common schema version, agent name/version, model, and tool counts across the collection:

- Mixed collections use `null` for non-common fields and are marked `heterogeneous`
- Agent version is never mislabeled as model version
- Per-node metadata and provenance are retained in artifacts; duplicate full raw trajectories are not stored by default

## Retrieving Results

Fetch artifacts from the MLflow run referenced in the job's results. Set `MLFLOW_TRACKING_URI` to the tracking server the job used before running the command; without it, the CLI looks for the run on the local filesystem and cannot find it:

```bash
export MLFLOW_TRACKING_URI=<tracking server URI used by the job>

mlflow artifacts download \
  --run-id <run_id> \
  --artifact-path atif \
  --dst-path ./atif-results
```

Searchable MLflow parameters include eligible counts that correctly account for embedded nodes. A generic artifact index is not a finished UI: server storage, tenant-authorized retrieval, and report browsing are separate integration concerns.
