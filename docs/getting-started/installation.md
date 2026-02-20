# Installation

Install EvalHub components for your use case.

## Prerequisites

### Required

- **Python 3.12+**

### Optional (for production deployment)

- **Kubernetes/OpenShift cluster**
- **TrustyAI Operator**

## Server Installation

The EvalHub server orchestrates evaluation jobs and manages providers.

=== "Kubernetes/OpenShift"

    Install using the TrustyAI Operator:

    ```bash
    # Install TrustyAI Operator
    kubectl apply -f https://github.com/trustyai-explainability/trustyai-service-operator/releases/latest/download/trustyai-operator.yaml

    # Create EvalHub instance
    kubectl apply -f - <<EOF
    apiVersion: trustyai.opendatahub.io/v1alpha1
    kind: EvalHub
    metadata:
      name: evalhub
      namespace: evalhub
    spec:
      replicas: 1
    EOF
    ```

=== "Local Development"

    For local development, the SDK client automatically manages the server:

    ```bash
    pip install eval-hub-sdk[server]
    ```

    When you use the Python SDK client, it will transparently start and manage the local server on `http://localhost:8080` using SQLite for storage. No manual server startup required.

## Client Installation

The client SDK allows you to submit evaluations and query results from Python.

```bash
pip install eval-hub-sdk[client]
```

### Usage

```python
from evalhub.client import EvalHubClient
from evalhub.models.api import ModelConfig, BenchmarkSpec

# Connect to EvalHub server
client = EvalHubClient(base_url="http://localhost:8080")

# List available providers
providers = client.list_providers()

# Submit evaluation
job = client.submit_evaluation(
    model=ModelConfig(
        url="http://localhost:11434/v1",
        name="qwen2.5:1.5b"
    ),
    benchmarks=[
        BenchmarkSpec(
            benchmark_id="mmlu",
            provider_id="lm_evaluation_harness"
        )
    ]
)

# Check job status
status = client.get_job_status(job.job_id)
print(f"Status: {status.status}")
```

## Provider Configuration

Providers are evaluation frameworks (LightEval, GuideLLM, RAGAS, etc.) that run as containerised adapters.

### Adding a Provider

=== "Kubernetes/OpenShift"

    Create a ConfigMap with the provider configuration:

    ```yaml
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: evalhub-providers
      namespace: evalhub
    data:
      providers.yaml: |
        providers:
        - provider_id: guidellm
          provider_type: performance
          provider_name: GuideLLM
          description: Performance benchmarking framework
          container_image: quay.io/evalhub/community-guidellm:latest
          benchmarks:
          - benchmark_id: performance_test
            name: Performance Benchmark
            description: Measure throughput and latency
            category: performance
    ```

    Apply the configuration:

    ```bash
    kubectl apply -f evalhub-providers.yaml
    ```

=== "Local Development"

    Create a `providers.yaml` file:

    ```yaml
    providers:
    - provider_id: guidellm
      provider_type: performance
      provider_name: GuideLLM
      description: Performance benchmarking framework
      container_image: quay.io/evalhub/community-guidellm:latest
      benchmarks:
      - benchmark_id: performance_test
        name: Performance Benchmark
        description: Measure throughput and latency
        category: performance
    ```

    Place it in the server's configuration directory or specify its path via environment variable:

    ```bash
    export EVALHUB_PROVIDERS_CONFIG=./providers.yaml
    eval-hub-server
    ```

### Using the Provider

Once the provider is configured, it can be used like any built-in provider:

```python
# List all providers (including custom ones)
providers = client.list_providers()

# Submit evaluation using custom provider
job = client.submit_evaluation(
    model=ModelConfig(
        url="http://vllm-server:8000/v1",
        name="meta-llama/Llama-3.2-1B-Instruct"
    ),
    benchmarks=[
        BenchmarkSpec(
            benchmark_id="performance_test",
            provider_id="guidellm",
            config={
                "profile": "constant",
                "rate": 10,
                "max_seconds": 60
            }
        )
    ]
)
```

## Model Serving (Optional)

For testing evaluations, you'll need a model serving endpoint.

=== "vLLM (OpenShift)"

    Deploy vLLM on OpenShift:

    ```bash
    oc apply -f - <<EOF
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: vllm-server
      namespace: evalhub
    spec:
      replicas: 1
      selector:
        matchLabels:
          app: vllm
      template:
        metadata:
          labels:
            app: vllm
        spec:
          containers:
          - name: vllm
            image: vllm/vllm-openai:latest
            args:
            - --model
            - meta-llama/Llama-3.2-1B-Instruct
            - --port
            - "8000"
            ports:
            - containerPort: 8000
            resources:
              limits:
                nvidia.com/gpu: 1
    ---
    apiVersion: v1
    kind: Service
    metadata:
      name: vllm-server
      namespace: evalhub
    spec:
      selector:
        app: vllm
      ports:
      - port: 8000
        targetPort: 8000
    EOF
    ```

=== "Ollama (Local)"

    Install and run Ollama for local development:

    ```bash
    # Install Ollama
    curl -fsSL https://ollama.com/install.sh | sh

    # Pull and run a model
    ollama run qwen2.5:1.5b

    # Ollama serves at http://localhost:11434/v1
    ```

## Verification

### Server

Check the server is running:

```bash
# Local
curl http://localhost:8080/api/v1/health

# Kubernetes
kubectl get pods -n evalhub -l app=evalhub-server
```

### Client

Verify client installation:

```python
from evalhub.client import EvalHubClient
print('Client installed successfully')
```

### Provider

List available providers:

```bash
curl http://localhost:8080/api/v1/providers
```

## Next Steps

- [Quick Start](quickstart.md) - Run your first evaluation
- [Server Configuration](../server/index.md) - Configure the server
- [API Reference](../reference/api.md) - REST API documentation
