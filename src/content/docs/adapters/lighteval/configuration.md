---
title: "LightEval Configuration"
---

Configuration reference for the LightEval adapter.

## Coming Soon

Detailed configuration documentation is in progress.

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
