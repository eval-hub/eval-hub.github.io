# Python SDK

The EvalHub Python SDK provides synchronous and asynchronous clients for the EvalHub REST API, plus an adapter framework for building evaluation integrations.

## Installation

```bash
pip install eval-hub-sdk[client]    # Client only
pip install eval-hub-sdk[adapter]   # Adapter SDK (includes mlflow, oras, olot)
pip install eval-hub-sdk[all]       # Everything
```

## Quick Start

=== "Synchronous"

    ```python
    from evalhub import SyncEvalHubClient
    from evalhub.models.api import ModelConfig, BenchmarkConfig, JobSubmissionRequest

    with SyncEvalHubClient(base_url="http://localhost:8080") as client:
        job = client.jobs.submit(JobSubmissionRequest(
            name="llama3-mmlu-eval",
            model=ModelConfig(url="http://vllm:8000/v1", name="llama-3-8b"),
            benchmarks=[BenchmarkConfig(id="mmlu", provider_id="lm_evaluation_harness")]
        ))

        result = client.jobs.wait_for_completion(job.id, timeout=3600)
        print(f"Status: {result.status}, Results: {result.results}")
    ```

=== "Asynchronous"

    ```python
    from evalhub import AsyncEvalHubClient
    from evalhub.models.api import ModelConfig, BenchmarkConfig, JobSubmissionRequest

    async with AsyncEvalHubClient(base_url="http://localhost:8080") as client:
        job = await client.jobs.submit(JobSubmissionRequest(
            name="llama3-mmlu-eval",
            model=ModelConfig(url="http://vllm:8000/v1", name="llama-3-8b"),
            benchmarks=[BenchmarkConfig(id="mmlu", provider_id="lm_evaluation_harness")]
        ))

        result = await client.jobs.wait_for_completion(job.id, timeout=3600)
    ```

## Client Configuration

```python
client = SyncEvalHubClient(
    base_url="http://localhost:8080",
    auth_token=None,              # Bearer token (or use auth_token_path)
    auth_token_path=None,         # Path to token file
    ca_bundle_path=None,          # CA bundle for TLS
    insecure=False,               # Skip TLS verification
    tenant=None,                  # Namespace for multi-tenant deployments (X-Tenant header)
    timeout=30.0,                 # Request timeout (seconds)
    max_retries=3,                # Retry attempts for 5xx/timeout/connection errors
    retry_initial_delay=1.0,      # Initial retry delay (seconds)
    retry_max_delay=60.0,         # Max retry delay
    retry_backoff_factor=2.0,     # Exponential backoff multiplier
    retry_randomization=True,     # Add jitter to retries
)
```

Auth resolution order: explicit token → token file → Kubernetes ServiceAccount token.

## Resource Operations

### Providers

```python
providers = client.providers.list()
provider = client.providers.get("lm_evaluation_harness")
```

### Benchmarks

```python
benchmarks = client.benchmarks.list()
benchmarks = client.benchmarks.list(provider_id="lm_evaluation_harness")
benchmarks = client.benchmarks.list(category="math")
```

### Collections

```python
collections = client.collections.list()
collection = client.collections.get("healthcare_safety_v1")
```

### Jobs

```python
from evalhub.models.api import JobSubmissionRequest, ModelConfig, BenchmarkConfig, JobStatus

job = client.jobs.submit(JobSubmissionRequest(
    name="llama3-multi-benchmark",
    model=ModelConfig(url="http://vllm:8000/v1", name="llama-3-8b"),
    benchmarks=[
        BenchmarkConfig(id="mmlu", provider_id="lm_evaluation_harness"),
        BenchmarkConfig(id="hellaswag", provider_id="lighteval"),
    ]
))

status = client.jobs.get(job.id)
all_jobs = client.jobs.list(status=JobStatus.RUNNING)

result = client.jobs.wait_for_completion(job.id, timeout=3600, poll_interval=5.0)

client.jobs.cancel(job.id)
client.jobs.cancel(job.id, hard_delete=True)
```

## Async Concurrency

```python
import asyncio
from evalhub import AsyncEvalHubClient
from evalhub.models.api import ModelConfig, BenchmarkConfig, JobSubmissionRequest

async def main():
    async with AsyncEvalHubClient(base_url="http://localhost:8080") as client:
        benchmarks = ["mmlu", "hellaswag", "truthfulqa"]

        jobs = await asyncio.gather(*[
            client.jobs.submit(JobSubmissionRequest(
                name=f"llama3-{b}",
                model=ModelConfig(url="http://vllm:8000/v1", name="llama-3-8b"),
                benchmarks=[BenchmarkConfig(id=b, provider_id="lm_evaluation_harness")]
            ))
            for b in benchmarks
        ])

        results = await asyncio.gather(*[
            client.jobs.wait_for_completion(j.id, timeout=3600)
            for j in jobs
        ])

asyncio.run(main())
```

## Error Handling

```python
import httpx
from evalhub.client.base import ClientError

try:
    job = client.jobs.get("nonexistent-id")
except httpx.HTTPStatusError as e:
    print(f"HTTP {e.response.status_code}")
except httpx.RequestError as e:
    print(f"Connection error: {e}")
except ClientError as e:
    print(f"Client error: {e}")
```

## API Reference

### Client Classes

- `SyncEvalHubClient` - Synchronous client
- `AsyncEvalHubClient` - Asynchronous client
- `EvalHubClient` - Alias for `AsyncEvalHubClient`

### Resources

| Resource | Methods |
|----------|---------|
| `client.providers` | `list()`, `get(id)` |
| `client.benchmarks` | `list(provider_id?, category?, limit?)` |
| `client.collections` | `list()`, `get(id)`, `create(request)`, `delete(id)` |
| `client.jobs` | `submit(request)`, `get(id)`, `list(status?, limit?)`, `cancel(id, hard_delete?)`, `wait_for_completion(id, timeout?, poll_interval?)` |
| `client.health()` | Health check |

### Key Models (`evalhub.models.api`)

| Model | Description |
|-------|-------------|
| `JobSubmissionRequest` | Job submission (model + benchmarks or collection) |
| `ModelConfig` | Model endpoint (url, name, auth) |
| `BenchmarkConfig` | Benchmark reference (id, provider_id, parameters) |
| `EvaluationJob` | Job status and results |
| `JobStatus` | Enum: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED |
| `Provider` | Provider metadata and benchmarks |
| `Collection` | Benchmark collection |

## See Also

- [Architecture](../development/architecture.md) - Adapter architecture
- [Overview](../getting-started/overview.md) - Platform overview
