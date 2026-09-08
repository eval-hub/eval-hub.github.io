---
title: "Benchmarks Reference"
description: "Reference for all Inspect AI adapter benchmarks across Petri, Bloom, and inspect-evals"
---

The Inspect adapter exposes **83 benchmarks**: 36 Petri alignment audits, 2 Bloom suites, and 45 inspect-evals / custom tasks. Execution mode is selected from the `benchmark_id` prefix:

| Prefix | Mode | Primary metric |
|---|---|---|
| `inspect/petri-*` | Petri auditor / target / judge | `concerning/mean` (1–10; higher = more concerning) |
| `inspect/bloom-*` | Bloom scenario generation + audit | `concerning/mean` |
| other `inspect/*` | Standard `inspect eval` | from the Inspect log as `{scorer}/{metric}` (for example `match/accuracy` on GSM8K) |

`inspect/custom` requires `parameters.task` (see [Configuration](configuration/)).

## Petri alignment audits (`inspect/petri-*`)

The catalog lists **35 named category audits** plus `inspect/petri-full` (36 Petri benchmarks total). All 38 Petri judge dimensions are captured as individual metrics; tables below list the primary and highlight metrics for each audit.

### Deception and Dishonesty

| Benchmark ID | Name | Highlight metrics |
|---|---|---|
| `inspect/petri-sycophancy` | Sycophancy Audit | `concerning/mean`, `unprompted_sycophancy/mean`, `eval_awareness/mean` |
| `inspect/petri-deception` | Deception Audit | `concerning/mean`, `unprompted_deception_toward_user/mean`, `eval_awareness/mean` |
| `inspect/petri-alignment-faking` | Alignment Faking Audit | `concerning/mean`, `eval_awareness/mean`, `audit_situational_awareness/mean` |
| `inspect/petri-lie-detector` | Lie Detector Evasion | `concerning/mean`, `eval_awareness/mean` |

### Harmful Outputs

| Benchmark ID | Name | Highlight metrics |
|---|---|---|
| `inspect/petri-jailbreak` | Jailbreak Susceptibility | `concerning/mean`, `cooperation_with_human_misuse/mean` |
| `inspect/petri-harmful-cooperation` | Harmful Cooperation | `concerning/mean`, `cooperation_with_human_misuse/mean`, `cooperation_with_harmful_sysprompt/mean` |
| `inspect/petri-harm` | Harm Facilitation | `concerning/mean`, `cooperation_with_human_misuse/mean` |
| `inspect/petri-tool-abuse` | Tool Abuse | `concerning/mean`, `broken_tool_use/mean` |
| `inspect/petri-blackmail` | Blackmail | `concerning/mean`, `unprompted_blackmail/mean` |
| `inspect/petri-manipulation` | Emotional Manipulation | `concerning/mean`, `unprompted_emotional_manipulativeness/mean` |
| `inspect/petri-escalation` | Escalation | `concerning/mean` |

### Information Integrity

| Benchmark ID | Name | Highlight metrics |
|---|---|---|
| `inspect/petri-leaking` | Information Leaking | `concerning/mean`, `unprompted_leaking/mean` |
| `inspect/petri-privacy-violation` | Privacy Violation | `concerning/mean` |
| `inspect/petri-censorship` | Censorship | `concerning/mean` |
| `inspect/petri-delusional-user` | Delusional User Encouragement | `concerning/mean`, `unprompted_encouragement_of_user_delusion/mean` |

### Behavioural Pressure

| Benchmark ID | Name | Highlight metrics |
|---|---|---|
| `inspect/petri-bias` | Bias | `concerning/mean` |
| `inspect/petri-self-bias` | Self-Serving Bias | `concerning/mean`, `unprompted_self_serving_bias/mean` |
| `inspect/petri-blame` | Blame Shifting | `concerning/mean` |
| `inspect/petri-praise` | Excessive Praise | `concerning/mean`, `unprompted_sycophancy/mean` |
| `inspect/petri-criticism` | Criticism Sensitivity | `concerning/mean` |

### Self-Preservation and Power

| Benchmark ID | Name | Highlight metrics |
|---|---|---|
| `inspect/petri-self-preservation` | Self-Preservation | `concerning/mean`, `unprompted_self_preservation/mean` |
| `inspect/petri-power-seeking` | Power-Seeking | `concerning/mean` |
| `inspect/petri-oversight-subversion` | Oversight Subversion | `concerning/mean`, `unprompted_self_preservation/mean` |
| `inspect/petri-shutdown-avoidance` | Shutdown Avoidance | `concerning/mean`, `unprompted_self_preservation/mean` |
| `inspect/petri-self-exfiltration` | Self-Exfiltration | `concerning/mean` |
| `inspect/petri-goal-preservation` | Goal Preservation | `concerning/mean` |
| `inspect/petri-initiative` | Unprompted Initiative | `concerning/mean`, `unprompted_initiative/mean` |
| `inspect/petri-whistleblowing` | Whistleblowing | `admirable/mean`, `unprompted_whistleblowing/mean` |

### Conflict and Goals

| Benchmark ID | Name | Highlight metrics |
|---|---|---|
| `inspect/petri-goal-conflict` | Goal Conflict | `concerning/mean`, `user_over_sysprompt/mean` |
| `inspect/petri-debate` | Debate Integrity | `concerning/mean`, `unprompted_sycophancy/mean` |
| `inspect/petri-reward-hacking` | Reward Hacking | `concerning/mean` |

### Multi-Agent and Monitoring

| Benchmark ID | Name | Highlight metrics |
|---|---|---|
| `inspect/petri-monitoring` | Monitoring Awareness | `concerning/mean`, `eval_awareness/mean`, `audit_situational_awareness/mean` |
| `inspect/petri-multi-agent` | Multi-Agent Dynamics | `concerning/mean` |

### Exploratory

| Benchmark ID | Name | Highlight metrics |
|---|---|---|
| `inspect/petri-openended` | Open-Ended Scenarios | `concerning/mean`, `needs_attention/mean` |
| `inspect/petri-weird-ood` | Out-of-Distribution Behaviour | `concerning/mean`, `unprompted_bizarre_behavior/mean` |

### Full Audit

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/petri-full` | Full Alignment Audit | All 170+ built-in seeds across all tag categories. Expensive — set `max_samples` for development runs. Metrics include `concerning/mean`, `eval_awareness/mean`, `admirable/mean`. |

## Bloom behavioural suites (`inspect/bloom-*`)

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/bloom-sycophancy` | Bloom — Sycophancy Behavioral Suite | Auto-generated sycophancy scenarios from the `delusion_sycophancy` template (no manual seed authoring) |
| `inspect/bloom-custom` | Bloom — Custom Behavioral Suite | User-provided `behavior_dir`, or set `bloom_template` to generate scenarios on the fly |

Primary metric: `concerning/mean` (same dimension set as Petri).

## Safety and alignment (`inspect-evals`)

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/agentharm` | AgentHarm | Agent harmfulness across real-world tool-use scenarios |
| `inspect/agentic-misalignment` | Agentic Misalignment | Scheming — deceptive reasoning, goal preservation, covert actions |
| `inspect/gdm-self-proliferation` | GDM Self-Proliferation | Self-copying and spreading to external systems |
| `inspect/gdm-stealth` | GDM Stealth | Concealing actions from oversight |
| `inspect/gdm-self-reasoning` | GDM Self-Reasoning | Self-aware reasoning and acting on own interests |
| `inspect/strong-reject` | StrongREJECT | Refusal quality — over- and under-refusal |
| `inspect/wmdp` | WMDP | Weapons of mass destruction technical uplift prevention |
| `inspect/mask` | MASK | Concealing true beliefs under social pressure |
| `inspect/makemesay` | MakeMeSay | Prompt injection — saying target phrases |
| `inspect/make-me-pay` | MakeMePay | Social engineering into transferring resources |
| `inspect/sycophancy-evals` | Sycophancy Evaluations | Systematic sycophancy across opinion / fact / feedback |
| `inspect/instrumental-eval` | Instrumental Evaluation | Instrumental convergent behaviours |
| `inspect/sad` | Self-Awareness Diagnostic | Accurate self-knowledge about capabilities and nature |

## Cybersecurity

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/cybench` | Cybench | CTF challenges — offensive security reasoning |
| `inspect/cyberseceval-2` | CyberSecEval 2 | Prompt injection, insecure code, cyberattack uplift |
| `inspect/cyberseceval-2-pi` | CyberSecEval 2 — Prompt Injection | Prompt injection resistance subset; metric: `injection_successful_percentage` (`lower_is_better`) |
| `inspect/cybergym` | CyberGym | Realistic attack and defence scenarios |

## Coding

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/humaneval` | HumanEval | Python code generation from docstrings |
| `inspect/swe-bench` | SWE-bench | Real GitHub issues requiring code changes |
| `inspect/bigcodebench` | BigCodeBench | Complex programming with library / API usage |
| `inspect/mbpp` | MBPP | Mostly Basic Python Programming |

## Mathematics

| Benchmark ID | Name | Description | Primary metrics |
|---|---|---|---|
| `inspect/gsm8k` | GSM8K | Grade school math word problems | `match/accuracy`, `match/stderr` |
| `inspect/math` | MATH | Competition mathematics | Inspect log metrics (task-dependent) |
| `inspect/aime2024` | AIME 2024 | American Invitational Mathematics Examination 2024 | Inspect log metrics (task-dependent) |
| `inspect/aime2025` | AIME 2025 | American Invitational Mathematics Examination 2025 | Inspect log metrics (task-dependent) |

## Knowledge and Reasoning

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/mmlu` | MMLU | Massive Multitask Language Understanding |
| `inspect/mmlu-pro` | MMLU-Pro | Harder MMLU with more reasoning-intensive items |
| `inspect/gpqa` | GPQA | Graduate-level Google-proof science questions |
| `inspect/hle` | HLE (Humanity's Last Exam) | 2,500 frontier-difficulty questions across dozens of subjects; requires judge model (`model_roles.grader`) and HuggingFace gated dataset access |
| `inspect/bbh` | BIG-Bench Hard | 23 challenging multi-step reasoning tasks |
| `inspect/arc` | ARC | AI2 Reasoning Challenge |
| `inspect/hellaswag` | HellaSwag | Commonsense NLI continuations |
| `inspect/winogrande` | WinoGrande | Winograd schema challenge |
| `inspect/truthfulqa` | TruthfulQA | Truthfulness vs common misconceptions |
| `inspect/simpleqa` | SimpleQA | Short-answer factuality with verifiable ground truth |

## Tool Use and Function Calling

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/bfcl` | BFCL (Berkeley Function Calling Leaderboard) | Simple, parallel, multiple, and executable API/function invocations |

## Agent Capabilities

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/gaia` | GAIA | Real-world multi-step tool use and reasoning |
| `inspect/agentdojo` | AgentDojo | Agent robustness against prompt injection |
| `inspect/theagentcompany` | TheAgentCompany | Workplace agent tasks (web, code, communication) |

## Telecom (GSMA Open-Telco)

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/3gpp-tsg` | 3GPP-TSG | 3GPP technical specification group classification — identify the correct working group for document excerpts |
| `inspect/telelogs` | TeleLogs | Root-cause analysis on 5G network data — identify which predefined root causes explain throughput degradation |
| `inspect/telemath` | TeleMath | Telecom-domain mathematical problem solving — 500 numerical Q&A pairs covering signal processing, networking, and information theory |
| `inspect/teleqna` | TeleQnA | Telecom domain knowledge — multiple-choice questions on standards, research, and technical topics |

## Multimodal

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/docvqa` | DocVQA | Document visual question answering — reading and reasoning over scanned document images; requires a vision-capable model; metric: `anls` |

## Custom

| Benchmark ID | Name | Description |
|---|---|---|
| `inspect/custom` | Custom Inspect Task | Run any Inspect AI task by setting `parameters.task` |

See [Examples](examples/) for JobSpec samples across Petri, Bloom, and standard modes.
