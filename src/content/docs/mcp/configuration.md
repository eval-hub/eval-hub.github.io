---
title: "Configuration"
---

The EvalHub MCP server can be configured through CLI flags, a YAML configuration file, or environment variables. When multiple sources set the same value, **CLI flags take highest precedence**, followed by the config file, then environment variables.

## CLI Flags

```
evalhub-mcp [flags]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--transport` | `stdio` | Transport mode: `stdio`, `http`, or `http-sse` |
| `--host` | `localhost` | Bind address for HTTP transports |
| `--port` | `3001` | Port for HTTP transports |
| `--config` | — | Path to YAML configuration file |
| `--insecure` | `false` | Skip TLS certificate verification for the EvalHub backend |
| `--tls-cert` | — | Path to TLS certificate file (for HTTPS on the MCP server) |
| `--tls-key` | — | Path to TLS private key file (for HTTPS on the MCP server) |
| `--version` | — | Print version and exit |

Both `--tls-cert` and `--tls-key` must be provided together. When set, the HTTP server listens over HTTPS.

## Configuration File

Pass `--config <path>` to load settings from a YAML file:

```yaml
# evalhub-mcp.yaml
base_url: https://evalhub.apps.my-cluster.example.com
token: <your-api-token>
tenant: my-team
transport: http
host: 0.0.0.0
port: 3001
insecure: false
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EVALHUB_BASE_URL` | EvalHub backend API URL |
| `EVALHUB_TOKEN` | Authentication token |
| `EVALHUB_TENANT` | Tenant identifier |
| `EVALHUB_TRANSPORT` | Transport mode (`stdio`, `http`, `http-sse`) |
| `EVALHUB_HOST` | HTTP bind address |
| `EVALHUB_PORT` | HTTP port |
| `EVALHUB_INSECURE` | Skip TLS verification for EvalHub backend (`true`/`false`) |
| `EVALHUB_TLS_CERT_FILE` | Path to TLS certificate |
| `EVALHUB_TLS_KEY_FILE` | Path to TLS private key |
| `EVALHUB_LIST_PAGE_LIMIT` | Default page size for list resources |

## Precedence

When the same setting is specified in multiple places:

1. **CLI flags** (highest priority)
2. **YAML config file** (if `--config` is used)
3. **Environment variables** (lowest priority)

For example, if `EVALHUB_TRANSPORT=http` is set as an environment variable but you run `evalhub-mcp --transport stdio`, the server uses stdio.

## Kubernetes Operator

When EvalHub is deployed via the TrustyAI operator, the MCP server is configured through the `spec.mcp` section of the EvalHub custom resource:

```yaml
apiVersion: trustyai.opendatahub.io/v1alpha1
kind: EvalHub
metadata:
  name: evalhub
  namespace: my-namespace
spec:
  replicas: 1
  mcp:
    enabled: true
    replicas: 1
    transport: http
    image: quay.io/evalhub/evalhub-mcp:latest
    authSecret: mcp-auth-token
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 256Mi
    env:
      - name: LOG_LEVEL
        value: "debug"
```

### Operator MCP Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | bool | `false` | Enable MCP server deployment |
| `replicas` | int | `1` | Number of MCP server replicas |
| `transport` | string | `http` | Client-facing transport (`http` or `http-sse`) |
| `evalHubTransport` | string | `http` | Transport for internal EvalHub API calls |
| `image` | string | `quay.io/evalhub/evalhub-mcp:latest` | Container image override |
| `authSecret` | string | — | Kubernetes Secret containing a `token` key for EvalHub API auth |
| `resources` | ResourceRequirements | 100m/128Mi request, 500m/256Mi limit | Container resource requests and limits |
| `env` | []EnvVar | — | Additional environment variables |

### What the Operator Creates

When `spec.mcp.enabled` is `true`, the operator automatically creates:

- **Deployment** (`<name>-mcp`): Runs the MCP server container with health checks
- **Service** (`<name>-mcp`): ClusterIP service on port 8443
- **ConfigMap** (`<name>-mcp-config`): Server configuration YAML
- **Route** (OpenShift only, `<name>-mcp`): Edge-terminated TLS route for external access

TLS certificates are automatically provisioned via OpenShift service signing.

### Checking MCP Status

```bash
kubectl get evalhub <name> -o jsonpath='{.status.mcp}'
```

The status includes:
- `phase`: `Pending`, `Ready`, `Error`, or `Disabled`
- `ready`: Whether the MCP deployment is available
- `url`: Internal service URL

## Example Configurations

### Local Development

```bash
export EVALHUB_BASE_URL="http://localhost:8080"
export EVALHUB_TOKEN="dev-token"
export EVALHUB_TENANT="default"

evalhub-mcp --transport stdio
```

### Shared Team Server

```yaml
# team-mcp.yaml
base_url: https://evalhub.apps.cluster.example.com
token: <team-service-account-token>
tenant: team-a
transport: http
host: 0.0.0.0
port: 3001
```

```bash
evalhub-mcp --config team-mcp.yaml
```

### Secure Production Server

```bash
evalhub-mcp \
  --transport http \
  --host 0.0.0.0 \
  --port 8443 \
  --tls-cert /etc/tls/server.crt \
  --tls-key /etc/tls/server.key \
  --config /etc/evalhub-mcp/config.yaml
```
