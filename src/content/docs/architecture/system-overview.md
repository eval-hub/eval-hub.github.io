---
title: "System Overview"
---

EvalHub consists of three components that work together to orchestrate LLM evaluations.

| Component | Description | Technology |
| ----------- | ------------- | ------------ |
| **Server** | REST API, job orchestration, provider management | Go, SQLite / PostgreSQL |
| **SDK** | Client library, adapter framework, data models | Python 3.11+ |
| **Contrib** | Community framework adapters | Python containers (UBI9) |
| **Jobs** | Isolated evaluation execution | Kubernetes Jobs |
| **Registry** | Immutable artifact storage | OCI registries |

![EvalHub system architecture](/images/diagrams/overview-system-architecture.svg)

## Data Flow

1. **Client submits evaluation** via SDK or REST API
2. **Server creates Kubernetes Job** with adapter container and sidecar
3. **ConfigMap mounted** with JobSpec at `/meta/job.json`
4. **Adapter loads JobSpec**, runs evaluation, reports progress via callbacks
5. **Sidecar forwards events** to the server via `POST /api/v1/evaluations/jobs/{id}/events`
6. **Adapter persists artifacts** to OCI registry and logs metrics to MLflow
7. **Server stores results** in PostgreSQL, returns status to client

## Core Concepts

### Providers

Evaluation providers represent frameworks. Each provider has a set of benchmarks and a container image that runs evaluations.

Built-in providers: `lm_evaluation_harness`, `garak`, `guidellm`, `lighteval`. Custom providers can be registered via YAML configuration or the REST API.

### Benchmarks

Benchmarks are specific evaluation tasks within a provider. Examples: `mmlu` (lm_evaluation_harness), `hellaswag` (lighteval), `sweep` (guidellm).

### Collections

Curated sets of benchmarks with weighted scoring, enabling domain-specific evaluation with a single API call.

```yaml
collection_id: healthcare_safety_v1
benchmarks:
  - benchmark_id: mmlu_medical
    provider_id: lm_evaluation_harness
    weight: 2.0
  - benchmark_id: toxicity
    provider_id: garak
    weight: 1.0
```

### Jobs

Kubernetes Jobs that execute evaluations in isolated pods. Each job has an adapter container (runs the framework) and a sidecar (forwards status events to the server).

### Adapters

Containerised applications implementing the `FrameworkAdapter` interface from the SDK. Each adapter loads a JobSpec, runs the evaluation framework, reports progress via callbacks, persists artifacts to OCI, and returns structured results.

## Adapter Pattern

All adapters implement the `FrameworkAdapter` interface from the SDK:

```python
from evalhub.adapter import FrameworkAdapter, JobSpec, JobResults, JobCallbacks
from evalhub.adapter.models import JobStatusUpdate, JobStatus, JobPhase, MessageInfo, OCIArtifactSpec

class MyAdapter(FrameworkAdapter):
    def run_benchmark_job(
        self,
        config: JobSpec,
        callbacks: JobCallbacks
    ) -> JobResults:
        callbacks.report_status(JobStatusUpdate(
            status=JobStatus.RUNNING,
            phase=JobPhase.RUNNING_EVALUATION,
            progress=0.5,
            message=MessageInfo(message="Running evaluation", message_code="running_evaluation")
        ))

        raw_results = self._run_evaluation(config)
        metrics = self._parse_results(raw_results)

        oci_result = callbacks.create_oci_artifact(OCIArtifactSpec(
            files_path=self._output_dir,
            coordinates=config.exports.oci.coordinates
        ))

        return JobResults(
            id=config.id,
            benchmark_id=config.benchmark_id,
            benchmark_index=config.benchmark_index,
            model_name=config.model.name,
            results=metrics,
            overall_score=self._calculate_score(metrics),
            num_examples_evaluated=len(metrics),
            duration_seconds=self._get_duration(),
            oci_artifact=oci_result
        )
```

The adapter entrypoint creates callbacks and reports results:

```python
def main():
    adapter = MyAdapter()
    callbacks = DefaultCallbacks.from_adapter(adapter)
    results = adapter.run_benchmark_job(adapter.job_spec, callbacks)

    # Optional: persist metrics to MLflow
    run_id = callbacks.mlflow.save(results, adapter.job_spec)
    if run_id:
        results.mlflow_run_id = run_id

    callbacks.report_results(results)
```

## Component Diagram

![Adapter component diagram](/images/diagrams/adapter-component.svg)

## Data Flow

### 1. Initialisation

![Adapter initialisation sequence](/images/diagrams/adapter-init-sequence.svg)

### 2. Execution

![Adapter execution sequence](/images/diagrams/adapter-execution-sequence.svg)

### 3. Artifact Persistence

![Adapter artifact persistence sequence](/images/diagrams/adapter-artifact-sequence.svg)

## Key Abstractions

### JobSpec

Job configuration loaded from `/meta/job.json` (mounted ConfigMap):

```python
class JobSpec:
    id: str
    provider_id: str
    benchmark_id: str
    benchmark_index: int
    model: ModelConfig          # url, name, auth
    parameters: dict            # adapter-specific parameters
    callback_url: str           # sidecar base URL
    num_examples: int | None
    experiment_name: str | None # MLflow experiment
    tags: list[dict]
    exports: JobSpecExports | None  # OCI coordinates
```

### JobResults

Structured results returned by the adapter:

```python
class JobResults:
    id: str
    benchmark_id: str
    benchmark_index: int
    model_name: str
    results: list[EvaluationResult]
    overall_score: float | None
    num_examples_evaluated: int
    duration_seconds: float
    completed_at: datetime
    oci_artifact: OCIArtifactResult | None
    mlflow_run_id: str | None  # set after callbacks.mlflow.save()
```

### JobCallbacks

Communication interface for the adapter:

```python
class JobCallbacks(ABC):
    def report_status(self, update: JobStatusUpdate) -> None:
        """Send status update via POST /api/v1/evaluations/jobs/{id}/events"""

    def create_oci_artifact(self, spec: OCIArtifactSpec) -> OCIArtifactResult:
        """Push artifacts to OCI registry using oras/olot"""

    def report_results(self, results: JobResults) -> None:
        """Send final results via POST /api/v1/evaluations/jobs/{id}/events"""
```

### DefaultCallbacks

The SDK provides `DefaultCallbacks` which:

- Sends status events to the sidecar via HTTP POST
- Pushes OCI artifacts using `oras` and `olot`
- Provides `callbacks.mlflow.save()` for adapters to call explicitly; `save()` records metrics only when `experiment_name` is set (see [MLflow](/guides/mlflow/))
- Handles auth via ServiceAccount tokens or explicit tokens

### AdapterSettings

Environment-based configuration loaded via `pydantic-settings`:

- `EVALHUB_MODE`: `k8s` or `local` (default `local`)
- `EVALHUB_JOB_SPEC_PATH`: path to job spec (default `/meta/job.json` in k8s, `meta/job.json` locally)
- `OCI_AUTH_CONFIG_PATH`: Docker config for OCI registry auth
- `OCI_INSECURE`: skip TLS verification for OCI registry
- `EVALHUB_AUTH_TOKEN_PATH`: path to ServiceAccount token file
- `EVALHUB_CA_BUNDLE_PATH`: path to CA bundle for TLS
- `EVALHUB_INSECURE`: skip TLS verification for EvalHub connection
- `EVALHUB_MLFLOW_BACKEND`: `odh` (default; built-in REST client) or `upstream` (official `mlflow` package)

## Adapter Container Images

Adapters are built as UBI9 Python containers with a standard layout:

```text
adapters/<name>/
├── main.py           # Entrypoint with FrameworkAdapter implementation
├── requirements.txt  # eval-hub-sdk[adapter] + framework dependencies
├── Containerfile     # UBI9 Python, entrypoint: python main.py
└── meta/
    └── job.json      # Example job spec for local testing
```
