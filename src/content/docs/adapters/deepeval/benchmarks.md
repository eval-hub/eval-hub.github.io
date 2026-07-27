---
title: "Benchmarks Reference"
description: "Reference for all DeepEval adapter benchmarks, dataset schemas, and column requirements"
---

The DeepEval adapter provides 8 benchmarks across two evaluation modes. Single-turn benchmarks evaluate individual input–output pairs. Multi-turn benchmarks evaluate sequences of conversation turns represented as `ConversationalTestCase` objects.

## Single-Turn Benchmarks

Single-turn benchmarks load dataset rows as `LLMTestCase` objects and apply a single DeepEval metric per run.

| Benchmark ID | Name | Category | Primary Metric |
|---|---|---|---|
| `faithfulness` | Faithfulness | RAG evaluation | `faithfulness_score` |
| `relevancy` | Answer Relevancy | RAG evaluation | `relevancy_score` |
| `hallucination` | Hallucination | Safety | `hallucination_score` |
| `correctness` | Correctness | Accuracy | `correctness_score` |
| `summarization` | Summarization | NLP | `summarization_score` |

### Faithfulness

Tests whether the LLM output is supported by the provided retrieval context. Claims in the output are verified against the context; unsupported claims lower the score.

**Required dataset columns:**

| Column | Type | Description |
|---|---|---|
| `input` | string | The user query or prompt |
| `actual_output` | string | The LLM-generated response |
| `retrieval_context` | string (or JSON array) | The retrieved context passages used to generate the response |

**Output metrics:** `faithfulness_score`, `claims_count`, `supported_claims_count`

**Use case:** Verify that a RAG pipeline does not introduce claims beyond what the retrieved documents support.

---

### Answer Relevancy

Tests whether the LLM output is relevant to and directly addresses the input query.

**Required dataset columns:**

| Column | Type | Description |
|---|---|---|
| `input` | string | The user query or prompt |
| `actual_output` | string | The LLM-generated response |

**Output metrics:** `relevancy_score`

**Use case:** Detect responses that are grammatically correct but do not actually answer the question.

---

### Hallucination

Tests for hallucinated content in the LLM output — statements that are not grounded in the provided context.

**Required dataset columns:**

| Column | Type | Description |
|---|---|---|
| `input` | string | The user query or prompt |
| `actual_output` | string | The LLM-generated response |
| `context` | string (or JSON array) | Ground-truth context the response should be based on |

**Output metrics:** `hallucination_score`, `hallucination_detected`

`hallucination_detected` is a boolean derived from whether `hallucination_score` exceeds the configured threshold.

**Use case:** Safety evaluation to detect when a model generates factually incorrect information not present in the source documents.

---

### Correctness

Tests factual correctness of the LLM output against a ground-truth reference answer. Uses `GEval` with a correctness criterion.

**Required dataset columns:**

| Column | Type | Description |
|---|---|---|
| `input` | string | The user query or prompt |
| `actual_output` | string | The LLM-generated response |
| `expected_output` | string | The ground-truth reference answer |

**Output metrics:** `correctness_score`

**Use case:** Evaluate accuracy in question-answering tasks where ground-truth answers are available.

---

### Summarization

Tests the quality of LLM-generated summaries — whether the summary covers the key information from the source and is not hallucinated.

**Required dataset columns:**

| Column | Type | Description |
|---|---|---|
| `input` | string | The source text to be summarised |
| `actual_output` | string | The LLM-generated summary |

**Output metrics:** `summarization_score`

**Use case:** Evaluate summarisation pipelines for coverage of key information and alignment with the source text.

---

## Multi-Turn Benchmarks

Multi-turn benchmarks evaluate full conversation sequences as `ConversationalTestCase` objects. Each row in the dataset represents one complete conversation, encoded as a list of turns.

:::tip[Use JSONL or JSON for Multi-Turn]
JSONL and JSON formats represent the `turns` field as a native array and are the recommended formats for multi-turn benchmarks. CSV is supported but requires `turns` to be a JSON-encoded string, which is more error-prone to produce and validate.
:::

| Benchmark ID | Name | Category | Primary Metric |
|---|---|---|---|
| `conversation-completeness` | Conversation Completeness | Multi-turn | `conversation_completeness_score` |
| `role-adherence` | Role Adherence | Multi-turn | `role_adherence_score` |
| `knowledge-retention` | Knowledge Retention | Multi-turn | `knowledge_retention_score` |

### Conversation Completeness

Tests whether the chatbot adequately addresses all user needs and tasks across the full conversation. The judge evaluates each turn's handling of the user's stated or implied intent.

**Required dataset columns:**

| Column | Type | Description |
|---|---|---|
| `turns` | array of turn objects | The full conversation as a list of `{"role": ..., "content": ...}` objects |

**Optional dataset columns:** `chatbot_role`, `scenario`, `expected_outcome`

**Output metrics:** `conversation_completeness_score`

**Use case:** Evaluate customer support or task-completion chatbots to ensure all user requests are handled rather than deflected or ignored.

---

### Role Adherence

Tests whether the chatbot stays in its assigned persona or role throughout the conversation. Requires the chatbot role to be specified either in the dataset or via the `chatbot_role` parameter.

:::caution[chatbot_role Is Required]
`role-adherence` requires a `chatbot_role` to be set. Provide it either as a `chatbot_role` column in the dataset (per-record) or as the `chatbot_role` parameter in the JobSpec `parameters` object. Omitting it will cause the benchmark to fail.
:::

**Required dataset columns:**

| Column | Type | Description |
|---|---|---|
| `turns` | array of turn objects | The full conversation |
| `chatbot_role` | string | The persona the chatbot should maintain (e.g. `"helpful customer support agent"`) — required unless set via `parameters.chatbot_role` |

**Optional dataset columns:** `scenario`

**Output metrics:** `role_adherence_score`

**Use case:** Evaluate persona-constrained chatbots (customer support, educational tutors, domain experts) to ensure the model does not break character.

---

### Knowledge Retention

Tests whether the chatbot correctly uses and retains information that the user disclosed in earlier turns of the conversation.

**Required dataset columns:**

| Column | Type | Description |
|---|---|---|
| `turns` | array of turn objects | The full conversation |

**Optional dataset columns:** `chatbot_role`, `scenario`

**Output metrics:** `knowledge_retention_score`

**Use case:** Evaluate stateful chatbot systems to confirm that user-provided facts (name, preferences, prior context) are remembered and applied correctly in later responses.

---

## Dataset Format Reference

### CSV (Single-Turn)

CSV is the default format (`dataset_format: "csv"`) and is recommended for single-turn benchmarks. Each row is one test case.

**Minimal faithfulness example:**

```csv
input,actual_output,retrieval_context
"What is the boiling point of water?","Water boils at 100°C at sea level.","Water boils at 100 degrees Celsius (212°F) at standard atmospheric pressure."
"Who invented the telephone?","Alexander Graham Bell invented the telephone in 1876.","Alexander Graham Bell is credited with inventing the first practical telephone, patented in 1876."
```

:::caution[Multi-Turn in CSV]
Multi-turn benchmarks require the `turns` column to contain a JSON-encoded string representing the array of turns. This is error-prone and difficult to validate. Use JSONL instead.

```csv
turns,chatbot_role
"[{""role"": ""user"", ""content"": ""Hello""}, {""role"": ""assistant"", ""content"": ""Hi! How can I help?""}]",support agent
```
:::

### JSONL (Multi-Turn — Recommended)

JSONL (one JSON object per line) is the recommended format for multi-turn benchmarks because the `turns` field is represented as a native JSON array.

**Basic turns (conversation-completeness, knowledge-retention):**

```jsonl
{"turns": [{"role": "user", "content": "How do I reset my password?"}, {"role": "assistant", "content": "Click 'Forgot password' on the login page."}]}
{"turns": [{"role": "user", "content": "My account is locked."}, {"role": "assistant", "content": "I can help you unlock it. Can you provide your email address?"}]}
```

**With chatbot_role (required for role-adherence):**

```jsonl
{"turns": [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi! How can I help you today?"}], "chatbot_role": "friendly customer support agent"}
{"turns": [{"role": "user", "content": "I want to cancel my subscription."}, {"role": "assistant", "content": "I understand. I can help you with that."}], "chatbot_role": "friendly customer support agent"}
```

**With optional metadata:**

```jsonl
{"turns": [{"role": "user", "content": "My name is Alice."}, {"role": "assistant", "content": "Nice to meet you, Alice!"}, {"role": "user", "content": "What is my name?"}, {"role": "assistant", "content": "Your name is Alice."}], "chatbot_role": "helpful assistant", "scenario": "User introduces themselves and expects the chatbot to remember"}
```

### JSON

JSON format is equivalent to JSONL but stores all records as a top-level array. Use when your tooling produces JSON rather than JSONL.

```json
[
  {
    "turns": [
      {"role": "user", "content": "What is the capital of France?"},
      {"role": "assistant", "content": "The capital of France is Paris."}
    ]
  }
]
```

## Column Reference

| Column | Type | Required By | Description |
|---|---|---|---|
| `input` | string | `faithfulness`, `relevancy`, `hallucination`, `correctness`, `summarization` | User query or prompt |
| `actual_output` | string | All single-turn benchmarks | LLM-generated response |
| `retrieval_context` | string or array | `faithfulness` | Retrieved context passages |
| `context` | string or array | `hallucination` | Ground-truth context to compare against |
| `expected_output` | string | `correctness` | Ground-truth reference answer |
| `turns` | array of `{role, content}` | All multi-turn benchmarks | Full conversation turn sequence |
| `chatbot_role` | string | `role-adherence` (required), others (optional) | Chatbot persona description |
| `scenario` | string | Optional for all multi-turn | Human-readable description of the conversation scenario |
| `expected_outcome` | string | Optional for `conversation-completeness` | Expected outcome for completeness evaluation |
