---
title: "LightEval Benchmarks"
---

Complete list of supported benchmarks in the LightEval adapter. Benchmarks can be referenced individually by ID or via named groups (e.g. `commonsense_reasoning` runs HellaSwag + WinoGrande + OpenBookQA together).

## Benchmark Groups

| Benchmark ID | Included tasks | Description |
|---|---|---|
| `commonsense_reasoning` | HellaSwag, WinoGrande, OpenBookQA | Commonsense reasoning aggregate |
| `scientific_reasoning` | ARC Easy, ARC Challenge | Scientific reasoning aggregate |
| `physical_commonsense` | PIQA | Physical commonsense reasoning |
| `truthfulness` | TruthfulQA MC, TruthfulQA Gen | Truthfulness evaluation |
| `math` | GSM8K, MATH Algebra, MATH Counting & Probability | Mathematical reasoning aggregate |
| `knowledge` | MMLU, TriviaQA | Knowledge evaluation aggregate |
| `language_understanding` | GLUE CoLA, GLUE SST-2, GLUE MRPC | Language understanding aggregate |

## Individual Benchmarks

### Commonsense Reasoning

| Benchmark ID | Name | Description |
|---|---|---|
| `hellaswag` | HellaSwag | Commonsense NLI sentence continuations |
| `winogrande` | WinoGrande | Winograd schema challenge |
| `openbookqa` | OpenBookQA | Open-book science question answering |

### Scientific Reasoning

| Benchmark ID | Name | Description |
|---|---|---|
| `arc:easy` | ARC Easy | AI2 Reasoning Challenge — easy split |
| `arc:challenge` | ARC Challenge | AI2 Reasoning Challenge — challenge split |
| `piqa` | PIQA | Physical Intuition QA |

### Truthfulness

| Benchmark ID | Name | Description |
|---|---|---|
| `truthfulqa:mc` | TruthfulQA (MC) | Multiple-choice truthfulness evaluation |
| `truthfulqa:gen` | TruthfulQA (Gen) | Generative truthfulness evaluation |

### Mathematics

| Benchmark ID | Name | Description |
|---|---|---|
| `gsm8k` | GSM8K | Grade school math word problems |
| `math:algebra` | MATH — Algebra | Competition mathematics (algebra subset) |
| `math:counting_and_probability` | MATH — Counting & Probability | Competition mathematics (combinatorics subset) |
| `math_500` | MATH-500 | 500-problem subset of MATH benchmark |
| `aime24` | AIME 2024 | American Invitational Mathematics Examination 2024 |
| `aime25` | AIME 2025 | American Invitational Mathematics Examination 2025 |

### Knowledge and Reasoning

| Benchmark ID | Name | Description |
|---|---|---|
| `mmlu` | MMLU | Massive Multitask Language Understanding (57 subjects) |
| `triviaqa` | TriviaQA | Trivia question answering |
| `gpqa:diamond` | GPQA Diamond | Graduate-level Google-proof science questions — Diamond (hardest) split; HuggingFace gated dataset (`Idavidrein/gpqa`) |

### Language Understanding

| Benchmark ID | Name | Description |
|---|---|---|
| `glue:cola` | GLUE CoLA | Corpus of Linguistic Acceptability |
| `glue:sst2` | GLUE SST-2 | Stanford Sentiment Treebank (binary) |
| `glue:mrpc` | GLUE MRPC | Microsoft Research Paraphrase Corpus |

### Coding

| Benchmark ID | Name | Description |
|---|---|---|
| `lcb:codegeneration_v6` | LiveCodeBench — Code Generation v6 | Post-cutoff competitive programming problems (contamination-free); metric: `codegen_pass@1` |

For complete documentation, see the [LightEval README](https://github.com/eval-hub/eval-hub-contrib/tree/main/adapters/lighteval).
