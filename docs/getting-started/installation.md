# Installation

## Prerequisites

- **Python 3.11+**
- **Kubernetes/OpenShift cluster** (for production deployment)

## Client SDK

```bash
pip install eval-hub-sdk[client]
```

```python
from evalhub import SyncEvalHubClient
from evalhub.models.api import ModelConfig, BenchmarkConfig, JobSubmissionRequest

client = SyncEvalHubClient(base_url="http://localhost:8080")
providers = client.providers.list()
```

## Server Deployment

=== "Kubernetes/OpenShift"

    Install using the TrustyAI Operator:

    ```bash
    kubectl apply -f https://github.com/trustyai-explainability/trustyai-service-operator/releases/latest/download/trustyai-operator.yaml

    # SQLite (development/testing): no external database needed.
    kubectl apply -f - <<EOF
    apiVersion: trustyai.opendatahub.io/v1alpha1
    kind: EvalHub
    metadata:
      name: evalhub
      namespace: evalhub
    spec:
      replicas: 1
      database:
        type: sqlite
      providers:
        - lm-evaluation-harness
        - garak
        - garak-kfp
        - guidellm
        - lighteval
        - ibm-clear
      collections:
        - leaderboard-v2
        - safety-and-fairness-v1
        - toxicity-and-ethical-principles
    EOF

    # PostgreSQL (production): create the credentials secret first, then the CR.
    kubectl apply -f - <<EOF
    apiVersion: v1
    kind: Secret
    metadata:
      name: evalhub-db-credentials
      namespace: evalhub
    type: Opaque
    stringData:
      db-url: "postgres://user:password@db-host:5432/evalhub"
    EOF
    kubectl apply -f - <<EOF
    apiVersion: trustyai.opendatahub.io/v1alpha1
    kind: EvalHub
    metadata:
      name: evalhub
      namespace: evalhub
    spec:
      replicas: 1
      database:
        type: postgresql
        secret: evalhub-db-credentials
      providers:
        - lm-evaluation-harness
        - garak
        - garak-kfp
        - guidellm
        - lighteval
        - ibm-clear
      collections:
        - leaderboard-v2
        - safety-and-fairness-v1
        - toxicity-and-ethical-principles
    EOF
    ```

    See [OpenShift Setup](../development/openshift-setup.md#evalhub-custom-resource-spec) for a full description of all `spec` fields.

=== "Local Development"

    Build and run from source:

    ```bash
    git clone https://github.com/eval-hub/eval-hub.git
    cd eval-hub
    make build
    ./bin/eval-hub
    ```

    The server starts at `http://localhost:8080` with SQLite in-memory storage.

## Provider Configuration

Providers are defined in YAML files under `config/providers/`. Each provider specifies a container image, resource requirements, and available benchmarks.

```yaml
id: guidellm
name: GuideLLM
description: Performance benchmarking framework
type: builtin
runtime:
  k8s:
    image: quay.io/eval-hub/community-guidellm:latest
    entrypoint: [python, main.py]
    cpu_request: 100m
    memory_request: 128Mi
    cpu_limit: 500m
    memory_limit: 1Gi
benchmarks:
  - id: sweep
    name: Rate Sweep
    category: performance
    metrics: [requests_per_second, mean_ttft_ms, mean_itl_ms]
```

Custom providers can also be created via the REST API:

```bash
curl -X POST http://localhost:8080/api/v1/evaluations/providers \
  -H "Content-Type: application/json" \
  -d @my-provider.json
```

## Model Serving

For evaluations, you need a model endpoint compatible with the OpenAI API.

=== "vLLM (Kubernetes)"

    ```bash
    kubectl apply -f - <<EOF
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: vllm-server
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
            args: [--model, meta-llama/Llama-3.2-1B-Instruct, --port, "8000"]
            ports:
            - containerPort: 8000
            resources:
              limits:
                nvidia.com/gpu: 1
    EOF
    ```

=== "Ollama (Local)"

    ```bash
    curl -fsSL https://ollama.com/install.sh | sh
    ollama run qwen2.5:1.5b
    # Serves at http://localhost:11434/v1
    ```

## Verification

```bash
curl http://localhost:8080/api/v1/health
curl http://localhost:8080/api/v1/evaluations/providers
```

## Next Steps

- [Quick Start](quickstart.md) - Run your first evaluation
- [OpenShift Setup](../development/openshift-setup.md) - Production deployment guide
