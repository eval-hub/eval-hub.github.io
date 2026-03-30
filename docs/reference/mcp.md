# MCP

This guide provides reference details for the MCP server to interact with EvalHub.

## Prerequisites

The following installation steps assumes you want to use a dedicated "agent" ServiceAccount when using [EvalHub multi-tenant](../development/multi-tenancy.md) deployed on an OpenShift cluster.

Create a `team-a-agent` ServiceAccount:

```sh
oc apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: team-a-agent
  namespace: team-a
EOF
```

Grant `team-a-agent` ServiceAccount the required permissions:

```sh
oc apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: evalhub-evaluator
  namespace: team-a
rules:
  - apiGroups: [trustyai.opendatahub.io]
    resources: [evaluations, collections, providers]
    verbs: [get, list, create, update, delete]
  - apiGroups: [mlflow.kubeflow.org]
    resources: [experiments]
    verbs: [create, get]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: evalhub-evaluator-binding
  namespace: team-a
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: evalhub-evaluator
subjects:
  - kind: ServiceAccount
    name: team-a-agent
    namespace: team-a       # required for ServiceAccount subjects
EOF
``` 

## Installation of MCP in the AI Agent

Set "agent" ServiceAccount values in a dedicated profile for the [EvalHub CLI](../getting-started/cli.md):

```sh
evalhub --profile agent config set base_url https://evalhub-opendatahub.apps.(...).openshiftapps.com
evalhub --profile agent config set tenant team-a
evalhub --profile agent config set token $(oc create token team-a-agent -n team-a --duration=8760h)
```

This makes an "agent" configuration profile for the CLI:

```yaml
active_profile: default
profiles:
  agent:
    base_url: https://evalhub-opendatahub.apps.(...).openshiftapps.com
    tenant: team-a
    token: ...
```

Then add MCP "evalhub" via `evalhub` CLI (this example assumes Claude as the AI Agent):

```sh
claude mcp add evalhub -- evalhub --profile agent mcp
```

Please notice this adds the mcp to the current (Claude's) Project, to add globally you need:
- use `-s user` when adding MCP so to install the MCP globally in `~/.claude.json` for all `projects`
- you need evalhub CLI available system-wide

## Troubleshooting

Ensure evalhub "agent" configuration is healthy:

```sh
evalhub --profile agent health
```

Use evalhub "agent" configuration with MCP Inspector by starting it where the evalhub CLI is available:

```sh
npx @modelcontextprotocol/inspector
```

Use:

```
command:
evalhub

arguments:
--profile agent mcp
```

