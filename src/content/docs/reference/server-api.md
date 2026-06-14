---
title: "Server API"
---

Go REST API service for managing LLM evaluation workflows.

## REST API

All endpoints are under `/api/v1`. Request and response bodies use JSON. The OpenAPI 3.1.0 specification is served at `/openapi.yaml`.

See <https://eval-hub.github.io/eval-hub/> for the full specification.

### Evaluation Jobs

```
POST   /api/v1/evaluations/jobs             # Submit evaluation
GET    /api/v1/evaluations/jobs             # List jobs
GET    /api/v1/evaluations/jobs/{id}        # Get job status and results
DELETE /api/v1/evaluations/jobs/{id}        # Cancel job
POST   /api/v1/evaluations/jobs/{id}/events # Status/result callback (adapter → server)
```

### Providers

```
GET    /api/v1/evaluations/providers             # List providers
POST   /api/v1/evaluations/providers             # Register provider
GET    /api/v1/evaluations/providers/{id}        # Get provider
PUT    /api/v1/evaluations/providers/{id}        # Update provider
PATCH  /api/v1/evaluations/providers/{id}        # Patch provider
DELETE /api/v1/evaluations/providers/{id}        # Delete provider
```

Query parameters: `benchmarks=true|false` (default `true`), `scope=system|tenant` (default is not set which means all providers).

Benchmarks are returned as part of the provider response. There is no separate `/benchmarks` endpoint.

#### Agent metadata on providers

Each provider response may include an optional `agent` object with structured metadata for AI agent consumption:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `evaluates` | `string[]` | Semantic capability tags (e.g. `safety`, `reasoning`) |
| `recommended_when` | `string[]` | Natural-language recommendation conditions |
| `target_type` | `string` | `model`, `agent`, or `inference_server` |
| `summary` | `string` | Concise description (max 200 chars) |
| `complements` | `string[]` | Related provider IDs for follow-up evaluations |
| `hints` | `string[]` | Operational guidance for job construction |
| `result_interpretation` | `string[]` | How to interpret evaluation results |

Benchmarks nested in the provider response may include their own `agent` block with `result_interpretation` and `score_ranges`.

Example (abbreviated):

```json
{
  "resource": { "id": "garak" },
  "name": "garak",
  "agent": {
    "evaluates": ["safety", "security", "red_teaming", "toxicity"],
    "target_type": "model",
    "summary": "Red-team an LLM for safety vulnerabilities, toxicity, and OWASP risks"
  }
}
```

Provider agent metadata can be updated via `PATCH /api/v1/evaluations/providers/{id}` with paths under `/agent`. There is no server-side `?target_type=` or `?evaluates=` query filter — filter client-side or use the MCP `discover_providers` tool.

See [Agent Discoverability](/mcp/agent-discoverability/) for the full metadata model and discovery workflows.

### Collections

```
GET    /api/v1/evaluations/collections             # List collections
POST   /api/v1/evaluations/collections             # Create collection
GET    /api/v1/evaluations/collections/{id}        # Get collection
PUT    /api/v1/evaluations/collections/{id}        # Update collection
PATCH  /api/v1/evaluations/collections/{id}        # Patch collection
DELETE /api/v1/evaluations/collections/{id}        # Delete collection
```

#### Agent metadata on collections

Collection responses may include an optional `agent` object with the same fields as providers except `target_type`:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `evaluates` | `string[]` | Dimensions this collection assesses |
| `recommended_when` | `string[]` | When to suggest this collection |
| `summary` | `string` | Concise description for agents |
| `complements` | `string[]` | Related collection or provider IDs |
| `hints` | `string[]` | Operational guidance (duration, resources) |
| `result_interpretation` | `string[]` | How to interpret aggregate scores |

### Health and Metrics

```
GET /api/v1/health    # Health check
GET /metrics          # Prometheus metrics
GET /openapi.yaml     # OpenAPI specification
GET /docs             # Interactive API docs
```

## Configuration

Configuration loads from `config/config.yaml`, with environment variable and file-based secret overrides.

### Key Settings

| Setting | Env Var | Default | Description |
|---------|---------|---------|-------------|
| `service.port` | `PORT` | `8080` | API listen port |
| `database.driver` | - | `sqlite` | `sqlite` or `pgx` |
| `database.url` | `DB_URL` | SQLite in-memory | Connection string |
| `mlflow.tracking_uri` | `MLFLOW_TRACKING_URI` | - | MLflow server URL |
| `prometheus.enabled` | - | `true` | Enable `/metrics` |
| `otel.enabled` | - | `false` | Enable OpenTelemetry |

### Provider Configuration

Providers are loaded from YAML files in `config/providers/`. Built-in providers: `lm_evaluation_harness` (167 benchmarks), `garak` (8), `guidellm` (7), `lighteval` (24).

Custom providers can be added via YAML files or the `POST /api/v1/evaluations/providers` endpoint.

## Runtimes

### Kubernetes (default)

Creates a Kubernetes Job per benchmark with:

- **ConfigMap**: JobSpec mounted at `/meta/job.json`
- **Adapter container**: Runs the evaluation framework
- **Sidecar container**: Forwards status events to the server
- **Volumes**: OCI credentials, MLflow token, model auth secrets

### Local

Spawns subprocesses (up to 5 workers) for each benchmark. Enabled with the `-local` flag. Useful for development without a cluster.

## Deployment

The server is deployed by the [TrustyAI Operator](https://github.com/trustyai-explainability/trustyai-service-operator) via the `EvalHub` custom resource. See [OpenShift Setup](/deployment/openshift-setup/) for production deployment.
