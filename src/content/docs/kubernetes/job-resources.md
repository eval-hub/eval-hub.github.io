---
title: "Job Pod Resource Requirements"
description: "Plan evaluation workload capacity, including the shared LightEval provider’s high-memory allocation."
---

EvalHub runs Kubernetes evaluations in job pods. The provider's
`runtime.k8s` configuration supplies CPU and memory requests and limits for
the adapter container. These settings describe the evaluation workload;
the EvalHub API server has separate resource settings. Other containers
in the job pod also require resources.

Provider defaults are defined in
[`config/providers/`](https://github.com/eval-hub/eval-hub/tree/main/config/providers).
Check the effective provider configuration and job pod in your deployment,
since deployed versions and administrator configuration can differ.

Benchmark-level or evaluation-level `hardware_config` can override provider
defaults, either through direct CPU and memory settings or a referenced
`HardwareProfile`. Benchmark-level configuration takes precedence over the
evaluation-level fallback. See [Hardware Profiles](/guides/hardware-profiles/)
for configuration modes and resource precedence.

## LightEval and LiveCodeBench

The [LightEval provider configuration](https://github.com/eval-hub/eval-hub/blob/main/config/providers/lighteval.yaml)
uses the following adapter container defaults when no hardware configuration
overrides them. Older deployments may still use a `1Gi` memory request and
`8Gi` limit:

| Resource | Request | Limit |
|---|---|---|
| CPU | `500m` | `4000m` |
| Memory | `256Gi` | `512Gi` |

These memory settings are a temporary workaround for LiveCodeBench v6.
Testing with the previous `1Gi` memory request and `8Gi` limit encountered
out-of-memory failures. Prior testing completed with the higher allocation.
The tested allocation does not establish a minimum requirement, and the
underlying memory consumption still requires investigation.

**These defaults apply to benchmarks using the shared LightEval provider
unless overridden by hardware configuration.** They are not selected
automatically per benchmark. The `256Gi` request affects
scheduling even when a benchmark consumes much less memory; it does not
force the process to consume `256Gi`.

Before submitting an evaluation using these defaults, ask your cluster
administrator to confirm that:

- A node has enough allocatable memory for the adapter's `256Gi` request
  plus the other containers and pod overhead.
- Namespace resource quotas allow the job's total requests and limits,
  including the adapter's `512Gi` memory limit.
- There is capacity for the number of evaluations that will run at once.

If hardware configuration overrides these defaults, use the effective job
resource values for capacity and quota checks.

Insufficient node capacity can leave jobs Pending. Resource quota admission
can reject job pod creation. An out-of-memory failure means the allocation
was insufficient for that execution; increasing the limit does not reduce
the benchmark's memory consumption.

## Inspect an evaluation pod

Replace the namespace and pod name with those of the evaluation job:

```shell
JOB_NAMESPACE=your-job-namespace
JOB_POD=your-evaluation-pod

oc get pod "$JOB_POD" -n "$JOB_NAMESPACE" \
  -o jsonpath='{range .spec.containers[*]}{.name}{": "}{.resources}{"\n"}{end}'
oc describe pod "$JOB_POD" -n "$JOB_NAMESPACE"
oc get resourcequota -n "$JOB_NAMESPACE"
```

Inspect the pod's resource settings, events, and container termination
reason. If no pod was created, inspect the corresponding Job's events and
namespace quotas. Existing pods keep their original resource settings
when provider defaults change; verify the settings on a newly created
evaluation after the updated configuration has been deployed.
