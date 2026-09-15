---
title: "LM Evaluation Harness Benchmarks"
description: "Benchmark integration and validation guidance for LM Evaluation Harness"
---

## Provider scope

The `lm_evaluation_harness` provider exposes LM Evaluation Harness tasks that
are registered in EvalHub. Registered tasks include ARC tasks, MMLU variants,
HellaSwag variants, TruthfulQA variants, HumanEval, and MBPP.

Use the [LM Evaluation Harness task catalog](https://github.com/opendatahub-io/lm-evaluation-harness/blob/incubation/lm_eval/tasks/README.md)
to inspect tasks available in the runner source. In a running EvalHub
deployment, the provider endpoint returns the tasks registered in EvalHub:

```bash
curl -s "$EVALHUB_URL/api/v1/evaluations/providers/lm_evaluation_harness" | jq .
```

For an authenticated deployment, include the authorization and tenant headers
described in [Multi-tenancy](/architecture/multi-tenancy/).

The provider YAML in eval-hub and the task files in lm-evaluation-harness must
agree on benchmark IDs. A provider entry alone does not make a task runnable.

## Integration checklist

Before opening a provider change, verify:

- [ ] The task ID resolves in the target `incubation` checkout.
- [ ] Any follow-up commits and task dependencies are included.
- [ ] If adding a new task to `incubation`, update `lm_eval/tasks/README.md` so it is discoverable in the task catalog.
- [ ] The task's dataset can be loaded in the intended connected or disconnected environment.
- [ ] Optional imports succeed inside the `ta-lmes-job` image.
- [ ] Required environment variables are set in the image or runtime configuration.
- [ ] Unsafe tasks have an appropriate execution boundary.
- [ ] A small smoke test (for example, `num_examples: 1`) completes in the published image.
- [ ] The resulting metric names match the provider configuration.
- [ ] TrustyAI Operator points to the image containing the task and dependencies.

## Local validation

For a local source checkout, first verify task loading:

```bash
python - <<'PY'
from lm_eval import tasks

manager = tasks.TaskManager()
manager.load_task_or_group(["arc_easy"])
print("task loading succeeded")
PY
```

Replace `arc_easy` with the target LM Evaluation Harness task ID when
validating a newly integrated benchmark.

For image-only dependencies, first build and tag the runner image locally:

```bash
docker build -f Dockerfile.lmes-job -t ta-lmes-job:local .
```

Then verify imports in that image:

```bash
docker run --rm --entrypoint python ta-lmes-job:local \
  -c "import evaluate, bert_score, tinyBenchmarks; print('dependencies available')"
```

Use the published image for the final smoke test. A local virtual environment
can verify Python imports, but it does not prove that the built `ta-lmes-job`
image contains those imports.

## Related references

- [LM Evaluation Harness task catalog](https://github.com/opendatahub-io/lm-evaluation-harness/blob/incubation/lm_eval/tasks/README.md)
- [Dataset mapping](https://github.com/opendatahub-io/lm-evaluation-harness/blob/incubation/docs/dataset-mapping.md)
- [EvalHub provider configuration](https://github.com/eval-hub/eval-hub/blob/main/config/providers/lm_evaluation_harness.yaml)
