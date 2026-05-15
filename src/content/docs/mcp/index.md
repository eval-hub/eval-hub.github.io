---
title: "MCP Overview"
---

The EvalHub MCP server implements the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP), enabling AI coding assistants such as Claude Code, VS Code with GitHub Copilot, and other MCP-compatible clients to interact with EvalHub directly from a conversation.

## What is MCP?

MCP is an open standard that lets AI assistants connect to external tools and data sources through a unified protocol. Instead of manually copying commands or switching between terminal windows, your AI assistant can submit evaluations, check job status, browse benchmarks, and follow structured evaluation workflows — all through natural language.

## What the EvalHub MCP Server Provides

### Tools

Actions the AI assistant can execute on your behalf:

| Tool | Description |
|------|-------------|
| `submit_evaluation` | Submit a new model evaluation job with benchmarks or a collection |
| `get_job_status` | Check job progress, state, and per-benchmark status |
| `cancel_job` | Cancel a running or pending evaluation job |

### Resources

Read-only data the assistant can query using `evalhub://` URIs:

| Resource | URI | Description |
|----------|-----|-------------|
| Providers | `evalhub://providers` | List evaluation providers and their benchmarks |
| Benchmarks | `evalhub://benchmarks` | Browse benchmarks, filter by label |
| Collections | `evalhub://collections` | List pre-defined benchmark collections |
| Jobs | `evalhub://jobs` | List evaluation jobs, filter by status |
| Server Version | `evalhub://server/version` | Server build and version metadata |

All list resources support pagination (`?limit=N&offset=N`). Benchmarks support label filtering (`?label=rag&label=safety`). Jobs support status filtering (`?status=running`).

### Prompts

Structured conversation templates that guide the assistant through complex workflows:

| Prompt | Description |
|--------|-------------|
| `edd_workflow` | Evaluation-Driven Development cycle: Define, Measure, Iterate |
| `evaluate_model` | Step-by-step model evaluation from discovery to results |
| `compare_runs` | Compare metrics across two or more evaluation jobs |

## Transport Modes

The MCP server supports multiple transport modes for different deployment scenarios:

| Mode | Flag | Use Case |
|------|------|----------|
| **stdio** | `--transport stdio` | Local development. The AI client launches the server as a subprocess. |
| **Streamable HTTP** | `--transport http` | Remote or shared deployments. The server runs as a standalone HTTP service. |
| **Legacy HTTP+SSE** | `--transport http-sse` | Older MCP clients that don't support Streamable HTTP. |

## Next Steps

- [Install the MCP server](/mcp/installation/) on your platform
- Follow the [Quick Start](/mcp/quickstart/) to connect your AI assistant in under 5 steps
- Browse the [Tool](/mcp/tools/), [Resource](/mcp/resources/), and [Prompt](/mcp/prompts/) references
- See [Configuration](/mcp/configuration/) for all available options
