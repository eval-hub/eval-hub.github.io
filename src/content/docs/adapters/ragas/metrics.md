---
title: "Metrics Reference"
description: "Reference for all RAGAS evaluation metrics supported by the EvalHub adapter"
---

The RAGAS adapter supports 11 evaluation metrics, divided into core metrics (available since RAGAS v0.1) and extended metrics (class-based, available since RAGAS v0.4+).

## Metrics Overview

| Metric | Category | LLM Judge | Embeddings | Input Requirements |
|--------|----------|-----------|------------|-------------------|
| `faithfulness` | Core | Yes | No | `user_input`, `response`, `retrieved_contexts` |
| `answer_relevancy` | Core | Yes | Yes | `user_input`, `response`, `retrieved_contexts` |
| `context_precision` | Core | Yes | No | `user_input`, `retrieved_contexts`, `reference` |
| `context_recall` | Core | Yes | No | `retrieved_contexts`, `reference` |
| `answer_similarity` | Core | No | Yes | `response`, `reference` |
| `context_entity_recall` | Core | No | No | `retrieved_contexts`, `reference` |
| `factual_correctness` | Extended | Yes | No | `response`, `reference` |
| `noise_sensitivity` | Extended | Yes | No | `user_input`, `response`, `retrieved_contexts`, `reference` |
| `nv_accuracy` | Extended | Yes | No | `user_input`, `response`, `reference` |
| `nv_context_relevance` | Extended | Yes | No | `user_input`, `retrieved_contexts` |
| `nv_response_groundedness` | Extended | Yes | No | `response`, `retrieved_contexts` |

## Core Metrics

### Faithfulness

Measures whether the generated answer is factually grounded in the retrieved context. A faithfulness score of 1.0 means every claim in the answer can be traced back to the context; 0.0 means the model is hallucinating entirely.

**When to use**: Always include faithfulness in RAG evaluations. It is the primary defence against hallucination, the most critical failure mode for RAG systems.

**How it works**: The LLM judge decomposes the answer into individual claims, then checks each claim against the retrieved context. The score is the fraction of claims supported by the context.

**Required columns**: `user_input`, `response`, `retrieved_contexts`

### Answer Relevancy

Measures how relevant the generated answer is to the original question. High relevancy means the answer directly addresses what was asked; low relevancy means the answer is off-topic or generic.

**When to use**: To detect answers that are factually correct (faithful) but do not actually answer the question. Faithfulness and answer relevancy together cover the two main RAG failure modes.

**How it works**: The LLM judge generates questions from the answer, then measures the semantic similarity (via embeddings) between the generated questions and the original question.

**Required columns**: `user_input`, `response`, `retrieved_contexts`

:::note
Answer relevancy requires both an LLM judge and an embedding model.
:::

### Context Precision

Measures whether the relevant items in the retrieved context are ranked higher than irrelevant ones. High precision means the retriever is surfacing useful documents first.

**When to use**: To evaluate retriever quality, specifically whether the ranking of retrieved documents is effective.

**How it works**: The LLM judge determines which retrieved context items are relevant to the reference answer, then computes a precision score weighted by position.

**Required columns**: `user_input`, `retrieved_contexts`, `reference`

### Context Recall

Measures how much of the reference answer is covered by the retrieved context. High recall means the retriever is finding all the information needed to produce a complete answer.

**When to use**: To detect retrieval gaps, cases where the retriever misses relevant documents, forcing the model to either hallucinate or give an incomplete answer.

**How it works**: The LLM judge decomposes the reference answer into sentences, then checks which sentences can be attributed to the retrieved context. The score is the fraction of attributable sentences.

**Required columns**: `retrieved_contexts`, `reference`

### Answer Similarity

Measures the semantic similarity between the generated answer and the reference answer using embeddings. This is a simpler, non-judge metric that captures whether the answer conveys the same meaning as the reference.

**When to use**: As a lightweight alternative to judge-based metrics when you have a reference answer. Does not require an LLM judge, so it is faster and cheaper to compute.

**How it works**: Computes the cosine similarity between the embedding vectors of the generated answer and the reference answer.

**Required columns**: `response`, `reference`

### Context Entity Recall

Measures the overlap of named entities between the retrieved context and the reference answer. High entity recall means the context contains the key entities (names, places, numbers) needed to answer correctly.

**When to use**: As a fast, non-LLM metric for retriever evaluation. Complements context recall with a more granular, entity-level view.

**How it works**: Extracts named entities from both the context and the reference, then computes the recall (fraction of reference entities found in the context).

**Required columns**: `retrieved_contexts`, `reference`

## Extended Metrics

These metrics use class-based implementations and are available from RAGAS v0.4+.

### Factual Correctness

Measures whether the factual claims in the generated answer match the reference answer. Unlike faithfulness (which checks against the context), factual correctness checks against the ground truth.

**When to use**: When you have a reference answer and want to verify that the generated answer is factually correct, regardless of what the context contains.

**Required columns**: `response`, `reference`

### Noise Sensitivity

Measures how sensitive the model is to irrelevant information in the retrieved context. A low noise sensitivity score means the model correctly ignores noisy context; a high score indicates it incorporates irrelevant information into its answers.

**When to use**: To test robustness against retrieval noise, for example when the retriever returns partially relevant or misleading documents alongside correct ones.

**Required columns**: `user_input`, `response`, `retrieved_contexts`, `reference`

### Answer Accuracy (`nv_accuracy`)

Measures the accuracy of the generated answer against the reference answer, using LLM-based semantic comparison rather than embedding similarity.

**When to use**: When you need a judge-based accuracy score that goes beyond surface-level similarity. Provides a more nuanced assessment than `answer_similarity`.

**Required columns**: `user_input`, `response`, `reference`

### Context Relevance (`nv_context_relevance`)

Measures how relevant the retrieved context is to the original question, without comparing to a reference answer.

**When to use**: To evaluate retriever quality independently of the generation step. Does not require a reference answer, making it useful for production monitoring.

**Required columns**: `user_input`, `retrieved_contexts`

### Response Groundedness (`nv_response_groundedness`)

Measures whether the generated response is grounded in the retrieved context, similar to faithfulness but using a different evaluation approach.

**When to use**: As an alternative or complement to faithfulness. Provides a second perspective on hallucination detection.

**Required columns**: `response`, `retrieved_contexts`

## Dataset Column Requirements

All metrics require a subset of these four columns:

| Column | Description | Example |
|--------|-------------|---------|
| `user_input` | The question or query posed to the RAG system | `"What is the capital of France?"` |
| `response` | The answer generated by the RAG system | `"The capital of France is Paris."` |
| `retrieved_contexts` | List of text passages retrieved by the retriever | `["Paris is the capital and largest city of France."]` |
| `reference` | The ground truth / reference answer | `"The capital of France is Paris."` |

If your dataset uses different column names, configure the `column_map` parameter in the JobSpec. See [Configuration](configuration/) for details.
