---
title: "Prompt Reference"
---

MCP prompts are structured conversation templates that guide the AI assistant through complex evaluation workflows. Each prompt returns a sequence of messages that the assistant uses to drive the interaction.

## edd_workflow

Guides the AI assistant through the Evaluation-Driven Development (EDD) cycle — a structured methodology for building AI applications with continuous evaluation feedback.

The workflow follows three phases:
1. **Define** — Establish evaluation criteria for the application type
2. **Measure** — Run benchmarks and collect metrics
3. **Iterate** — Analyze results and improve

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `application_type` | Yes | Type of application being evaluated. One of: `rag`, `agent`, `safety`, `classifier` |

Each application type loads domain-specific guidance. For example, `rag` focuses on retrieval quality and context relevance, while `safety` emphasizes bias detection and harmful content evaluation.

### Example

**Prompt:**
```
Use the edd_workflow prompt for a RAG application.
```

The assistant receives structured guidance for defining RAG-specific evaluation criteria, selecting appropriate benchmarks, running evaluations, and iterating on results.

### Valid Application Types

| Type | Focus |
|------|-------|
| `rag` | Retrieval quality, context relevance, answer accuracy |
| `agent` | Task completion, tool use, multi-step reasoning |
| `safety` | Bias detection, harmful content, fairness |
| `classifier` | Classification accuracy, precision, recall |

## evaluate_model

Step-by-step guidance for evaluating a model end-to-end: discover available benchmarks, select appropriate ones, submit an evaluation, and review results.

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `model_url` | No | URL of the model inference endpoint. If omitted, the assistant asks for it. |
| `benchmark_preferences` | No | Preferences for benchmark selection (e.g. "reasoning", "safety", "general"). If omitted, the assistant helps you choose. |

### Example

**With model URL:**
```
Use the evaluate_model prompt with model URL https://llama3.example.com/v1.
```

The assistant guides you through benchmark selection and evaluation submission for the specified model.

**Without model URL:**
```
Use the evaluate_model prompt.
```

The assistant first helps you identify your model endpoint, then proceeds with benchmark discovery and evaluation.

## compare_runs

Guidance for comparing two or more evaluation runs side-by-side: select jobs, fetch results, compare metrics, and summarize findings.

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `job_ids` | No | Comma-separated list of evaluation job IDs to compare. If omitted, the assistant helps you select jobs. |

### Example

**With job IDs:**
```
Use the compare_runs prompt to compare jobs a1b2c3d4 and e5f6g7h8.
```

**Without job IDs:**
```
Use the compare_runs prompt.
```

The assistant fetches the list of completed jobs and helps you select which ones to compare.

At least two job IDs are required for comparison.
