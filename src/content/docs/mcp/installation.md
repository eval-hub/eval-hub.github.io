---
title: "Installation"
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

The `evalhub-mcp` binary is a standalone server that connects AI assistants to EvalHub. It is available for macOS (Intel and Apple Silicon), Linux (amd64 and arm64), and as a container image.

## Prerequisites

- An EvalHub instance (running locally or on a cluster) with a reachable API endpoint
- An authentication token for your EvalHub tenant
- An MCP-compatible AI client ([Claude Code](https://docs.anthropic.com/en/docs/claude-code), [VS Code with GitHub Copilot](https://code.visualstudio.com/), or another MCP client)

## Install the Binary

<Tabs>
<TabItem label="Homebrew (macOS / Linux)">

```bash
brew install evalhub-mcp
```

Verify:

```bash
evalhub-mcp --version
```

</TabItem>
<TabItem label="GitHub Releases">

Download the binary for your platform from [GitHub Releases](https://github.com/eval-hub/eval-hub/releases):

```bash
# macOS (Apple Silicon)
curl -Lo evalhub-mcp https://github.com/eval-hub/eval-hub/releases/latest/download/evalhub-mcp-darwin-arm64

# macOS (Intel)
curl -Lo evalhub-mcp https://github.com/eval-hub/eval-hub/releases/latest/download/evalhub-mcp-darwin-amd64

# Linux (amd64)
curl -Lo evalhub-mcp https://github.com/eval-hub/eval-hub/releases/latest/download/evalhub-mcp-linux-amd64

# Linux (arm64)
curl -Lo evalhub-mcp https://github.com/eval-hub/eval-hub/releases/latest/download/evalhub-mcp-linux-arm64
```

Make it executable and move it to your PATH:

```bash
chmod +x evalhub-mcp
sudo mv evalhub-mcp /usr/local/bin/
```

Verify:

```bash
evalhub-mcp --version
```

</TabItem>
<TabItem label="Build from Source">

Requires Go 1.25 or later.

```bash
git clone https://github.com/eval-hub/eval-hub.git
cd eval-hub
make build-mcp
```

The binary is placed in `./bin/evalhub-mcp`. Move it to your PATH:

```bash
sudo mv ./bin/evalhub-mcp /usr/local/bin/
```

</TabItem>
</Tabs>

## Kubernetes / OpenShift Deployment

If EvalHub is managed by the TrustyAI operator, the MCP server can be deployed as a sidecar by enabling it in the EvalHub custom resource:

```yaml
apiVersion: trustyai.opendatahub.io/v1alpha1
kind: EvalHub
metadata:
  name: evalhub
spec:
  replicas: 1
  mcp:
    enabled: true
    replicas: 1
```

The operator creates a Deployment, Service, ConfigMap, and (on OpenShift) a Route for the MCP server automatically. See [Configuration](/mcp/configuration/#kubernetes-operator) for all available fields.

## Using the EvalHub CLI as an MCP Server

If you already have the [EvalHub CLI](/guides/cli/) installed and configured, you can use it as an MCP server directly without installing `evalhub-mcp` separately:

```bash
claude mcp add evalhub -- evalhub --profile <profile-name> mcp
```

This uses the CLI's built-in `mcp` subcommand with an existing CLI profile for authentication. See the [Quick Start](/mcp/quickstart/) for the full setup flow using either approach.
