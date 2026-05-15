---
title: "MCP"
---

For comprehensive MCP documentation including installation, quick-start guides, and full API reference, see the dedicated [MCP section](/mcp/).

## Using the EvalHub CLI as an MCP Server

If you already have the [EvalHub CLI](/guides/cli/) installed and configured with profiles, you can use it as the MCP server directly. This is useful when EvalHub is running on a Kubernetes/OpenShift cluster with [multi-tenant](/architecture/multi-tenancy/) RBAC.

### Prerequisites

Create a dedicated ServiceAccount for the agent:

```sh
oc apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: team-a-agent
  namespace: team-a
EOF
```

Grant the ServiceAccount the required permissions:

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
    namespace: team-a
EOF
```

### Configure and register

Set up an "agent" configuration profile for the CLI:

```sh
evalhub --profile agent config set base_url https://evalhub-opendatahub.apps.(...).openshiftapps.com
evalhub --profile agent config set tenant team-a
evalhub --profile agent config set token $(oc create token team-a-agent -n team-a --duration=8760h)
```

Register MCP with Claude Code:

```sh
claude mcp add evalhub -- evalhub --profile agent mcp
```

To install globally (for all Claude Code projects), add `-s user`:

```sh
claude mcp add -s user evalhub -- evalhub --profile agent mcp
```

### Troubleshooting

Verify the EvalHub connection is healthy:

```sh
evalhub --profile agent health
```

Use MCP Inspector to debug:

```sh
npx @modelcontextprotocol/inspector
```

Configure with command `evalhub` and arguments `--profile agent mcp`.
