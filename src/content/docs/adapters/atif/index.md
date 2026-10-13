---
title: "ATIF Trajectory Adapter"
description: "Evaluate pre-recorded ATIF agent trajectories with an OpenAI-compatible LLM judge"
---

The ATIF adapter integrates [ATIF](https://github.com/agent-trajectory/atif) (Agent Trajectory Interchange Format) trajectory evaluation with the eval-hub evaluation service using the evalhub-sdk framework adapter pattern.

## Overview

ATIF is a JSON schema for recording agent trajectories: the task, every model turn, tool call, and environment observation an agent produced while running. The adapter takes **already-recorded** trajectories and scores them with an OpenAI-compatible LLM judge. It never reruns an agent, never executes trajectory tools, and never substitutes for a benchmark's verifier.

Typical uses:

- **Agent regression testing**: score a fixed corpus of recorded trajectories after a prompt, model, or tooling change and compare aggregate scores over time.
- **Failure analysis**: every low-scoring step is classified into a fixed failure taxonomy, so common failure modes surface across a collection.
- **Training-data selection**: an optional threshold produces eligible/ineligible cohorts with source-addressable, hash-verified manifests.

### Key Features

- **Four scoring modes**: `auto` derives criteria from the task, `benchmark` selects a built-in rubric, `reference` scores against a registry of expected answers, and `custom` uses an inline or mounted rubric
- **Nested subagent support**: embedded `subagent_trajectories` are scored up to a configurable depth, with `flat`, `hierarchical`, or `separate` aggregation
- **Failure categorization**: steps below a threshold are classified as `tool_selection_failure`, `context_loss`, `policy_boundary_violation`, or `reasoning_failure`
- **Bounded, observable judging**: per-request byte caps, job-wide request budgets, retries with exponential backoff, and OpenTelemetry metrics
- **Provenance by design**: input SHA-256 hashes, source URIs, JSON Pointer selectors, and criteria/prompt versions are persisted with every result

:::caution[What this adapter is not]
- It does **not** execute benchmarks or claim verifier-equivalent correctness. Built-in benchmark rubrics are assessment rubrics only.
- Evaluation is text-based. Image and audio references are replaced with explicit omitted markers; this is not multimodal judging.
- Judge scores are model opinions for regression tracking, not ground truth.
:::

## Architecture

The adapter follows the eval-hub framework adapter pattern:

![ATIF adapter architecture](/images/diagrams/atif-architecture.svg)

**Workflow:**

1. **Discover** JSON files under the mounted input path and identify ATIF candidates, recording accepted/ignored/invalid files
2. **Resolve criteria** — derive per-task criteria with the judge (`auto`), or load a benchmark, reference, or custom rubric
3. **Score** each step of every accepted trajectory with bounded context, sequentially within each trajectory and concurrently across roots
4. **Aggregate** node and subtree scores, and categorize steps below the failure threshold
5. **Persist** versioned details, training selections, and provenance to MLflow
6. **Return** compact metrics and an artifact index through the SDK callbacks, together with the MLflow run ID

## Execution Contract

The SDK entry point is `run_benchmark_job(config, callbacks) -> JobResults`. `config.model` is the **judge**: any OpenAI-compatible chat completions endpoint.

:::note[MLflow is required]
An `experiment_name` on the job and the SDK MLflow callback are required. Detailed per-step results live in MLflow artifacts; missing configuration fails before any judge work, and a failed upload fails the job rather than dropping detailed scores. See the [MLflow guide](/guides/mlflow/).
:::

## Quick Start

### Building the Container

```bash
make image-atif
```

### Running Locally

For local testing without Kubernetes, point the adapter directly at a judge endpoint:

```bash
# Set environment for local mode
export EVALHUB_MODE=local
export EVALHUB_JOB_SPEC_PATH=/run/job.json

# Mount a job spec, the trajectory collection, and the judge auth directory
podman run --rm \
  -e EVALHUB_MODE=local \
  -e EVALHUB_JOB_SPEC_PATH=/run/job.json \
  -e MLFLOW_TRACKING_URI=http://127.0.0.1:5000 \
  -v $(pwd)/job.json:/run/job.json:ro \
  -v $(pwd)/test_data:/test_data:ro \
  -v ~/.config/atif-judge-auth:/mnt/judge-auth:ro \
  quay.io/evalhub/community-atif:latest
```

The job spec references the judge through `model.url` and a file-based `model.auth.secret_ref` pointing at the mounted auth directory. See [Judge Routing and Authentication](configuration/#judge-routing-and-authentication) and [Examples](examples/) for complete job specs.

:::tip[Local development]
See the [local mode guide](/guides/local-mode/) for running the full stack (server, sidecar, and adapters) on your machine.
:::

## Container Image

```bash
# Pull from registry
podman pull quay.io/evalhub/community-atif:latest

# Run with a custom job spec
podman run \
  -e EVALHUB_MODE=local \
  -e EVALHUB_JOB_SPEC_PATH=/meta/job.json \
  -v $(pwd)/job.json:/meta/job.json:ro \
  quay.io/evalhub/community-atif:latest
```

## Next Steps

- [Configuration](configuration/) — full parameter reference, judge routing, and input validation rules
- [Scoring Modes](scoring/) — auto-derived, benchmark, reference, and custom rubrics
- [Metrics](metrics/) — score semantics, aggregation, and the failure taxonomy
- [Artifacts](artifacts/) — MLflow artifact layout and training-data selection
- [Examples](examples/) — ready-to-run job specs for every scoring mode
