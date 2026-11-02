---
title: "LightEval Configuration"
---

Configuration reference for the LightEval adapter.

## Coming Soon

Detailed configuration documentation is in progress.

## Model authentication

For OpenAI-compatible API backends, use `model.url` and the model-auth Secret;
keep model URLs and API keys out of `parameters`. Follow the shared
[Model Authentication guide](/guides/model-authentication/) for setup and client usage.

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
