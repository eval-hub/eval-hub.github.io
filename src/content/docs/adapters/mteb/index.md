---
title: "MTEB Adapter"
---

The MTEB adapter integrates [MTEB (Massive Text Embedding Benchmark)](https://github.com/embeddings-benchmark/mteb) with the eval-hub evaluation service using the evalhub-sdk framework adapter pattern.

## Overview

MTEB is a comprehensive benchmark for evaluating text embedding models across diverse task types.

### Key Features

- **Semantic Textual Similarity (STS)**: Measure semantic similarity between sentence pairs
- **Retrieval**: Evaluate document retrieval capabilities (NFCorpus, SciFact, TRECCOVID, ...)
- **Classification**: Text classification tasks (Banking77, EmotionClassification, ...)
- **Clustering**: Document clustering evaluation (ArxivClustering, BiorxivClustering, ...)
- **Reranking**: Passage reranking tasks (AskUbuntu, MindSmall, SciDocs, ...)
- **Bitext Mining**: Parallel sentence mining
- **Pair Classification**: Sentence pair classification

### Supported Models

Any model with a HuggingFace-compatible sentence embedding interface, including:

- `sentence-transformers/*` models
- `BAAI/bge-*` family
- `intfloat/e5-*` family
- Custom OpenAI-compatible text embedding endpoints

## Architecture

The adapter runs MTEB via its CLI (`mteb run`), collects per-task scores, and maps them into eval-hub's `JobResults` structure.

**Workflow:**

1. **Settings-based configuration**: Runtime settings loaded automatically from environment
2. **Automatic JobSpec loading**: Job configuration auto-loaded from mounted ConfigMap
3. **Callback-based communication**: Progress updates and artifacts sent to sidecar via callbacks
4. **OCI artifact persistence**: Results persisted as OCI artifacts via the sidecar
5. **Structured results**: Returns `JobResults` with standardised embedding metrics

## Quick Start

### Building the Container

```bash
make image-mteb
```

### Running Locally

```bash
export EVALHUB_MODE=local
export EVALHUB_JOB_SPEC_PATH=meta/job.json

python main.py
```

### Running on Kubernetes

Submit a job through the eval-hub API using provider `mteb` and any of the benchmark presets listed below.

## Benchmark Presets

| Benchmark ID | Name | Category | Key Metrics |
|---|---|---|---|
| `mteb_sts` | Semantic Textual Similarity Suite | Semantic similarity | `cosine_spearman`, `cosine_pearson` |
| `mteb_retrieval` | Retrieval Suite | Information retrieval | `ndcg_at_10`, `map_at_10` |
| `mteb_classification` | Classification Suite | Classification | `accuracy` |
| `mteb_clustering` | Clustering Suite | Clustering | `v_measure` |
| `mteb_reranking` | Reranking Suite | Reranking | `map` |

## Configuration Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `batch_size` | integer | `32` | Batch size for encoding |
| `device` | string | auto | Device override (`cuda`, `cpu`, `mps`) |
| `languages` | array | `["eng"]` | Language codes to include (ISO 639-3) |
| `verbosity` | integer | `2` | MTEB verbosity level (0–3) |
| `co2_tracker` | boolean | `false` | Enable CO₂ emissions tracking |
| `tasks` | array | — | Explicit MTEB task names (overrides benchmark preset) |
| `task_types` | array | — | Filter by task type (STS, Retrieval, Classification, ...) |

## Container Image

```bash
podman pull quay.io/evalhub/community-mteb:latest

podman run \
  -e EVALHUB_MODE=local \
  -e EVALHUB_JOB_SPEC_PATH=/meta/job.json \
  -v $(pwd)/job.json:/meta/job.json:ro \
  quay.io/evalhub/community-mteb:latest
```

## Source

- **Adapter**: [eval-hub-contrib/adapters/mteb](https://github.com/eval-hub/eval-hub-contrib/tree/main/adapters/mteb)
- **Upstream**: [embeddings-benchmark/mteb](https://github.com/embeddings-benchmark/mteb)
