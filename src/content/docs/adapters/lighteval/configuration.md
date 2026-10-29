---
title: "LightEval Configuration"
---

Configuration reference for the LightEval adapter.

## Coming Soon

Detailed configuration documentation is in progress.

## Model authentication

For OpenAI-compatible API access, configure `model.url` and a model-auth Secret
containing `api-key`, referenced by `model.auth.secret_ref`. URLs and API keys
must not be placed in API payload `parameters` or backend passthrough settings.
The Kubernetes adapter uses the projected credential reference and sidecar URL;
see [Model Authentication](/guides/model-authentication/) for the shared contract.
Local model-loading parameters remain separate from endpoint authentication.

## Basic Configuration

```json
{
  "id": "job-123",
  "benchmark_id": "hellaswag",
  "model": {
    "name": "gpt2",
    "url": "http://localhost:8000/v1"
  },
  "parameters": {
    "provider": "endpoint",
    "num_few_shot": 0,
    "random_seed": 42,
    "batch_size": 1,
    "parameters": {
      "temperature": 0.0,
      "max_tokens": 100
    }
  }
}
```

For complete documentation, see the [LightEval README](https://github.com/eval-hub/eval-hub-contrib/tree/main/adapters/lighteval).

## Kubernetes resource requirements

The shared LightEval provider has a high-memory allocation for LiveCodeBench.
Before submitting evaluations, review the
[job pod resource requirements](/kubernetes/job-resources/) for the allocation,
provider-wide scope, and scheduling and quota implications.
