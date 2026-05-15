---
title: "Troubleshooting"
---

## Server Unreachable / Connection Refused

**Symptoms:** The AI client reports the MCP server is not available or connection was refused.

**For stdio transport:**
- Verify the `evalhub-mcp` binary is on your `PATH`:
  ```bash
  which evalhub-mcp
  ```
- Test the binary runs correctly:
  ```bash
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}' | evalhub-mcp
  ```
  This should return a JSON-RPC response with server capabilities.
- Re-register the server:
  ```bash
  claude mcp remove evalhub
  claude mcp add evalhub --transport stdio -- evalhub-mcp
  ```

**For HTTP transport:**
- Check the server process is running:
  ```bash
  curl http://localhost:3001/health
  ```
  Expected response: `{"status":"ok"}`
- Verify the port is not in use by another process:
  ```bash
  lsof -i :3001
  ```
- Check firewall rules if connecting from another machine.

## Authentication Failure

**Symptoms:** Tools or resources return authentication errors.

- Verify your token is set and valid:
  ```bash
  echo $EVALHUB_TOKEN
  ```
- Generate a fresh token if using Kubernetes ServiceAccount authentication:
  ```bash
  export EVALHUB_TOKEN=$(kubectl create token <service-account> -n <namespace>)
  ```
- Confirm `EVALHUB_TENANT` matches your assigned tenant.
- Restart the MCP server after updating credentials.

## Client Not Detecting Server

**Symptoms:** The server doesn't appear in `claude mcp list` or VS Code doesn't recognize it.

**Claude Code (stdio):**
- Confirm the registration:
  ```bash
  claude mcp list
  ```
- If the server shows errors, remove and re-add:
  ```bash
  claude mcp remove evalhub
  claude mcp add evalhub --transport stdio -- evalhub-mcp
  ```
- Ensure environment variables (`EVALHUB_BASE_URL`, `EVALHUB_TOKEN`, `EVALHUB_TENANT`) are set in the shell where you launched Claude Code.

**Claude Code (HTTP):**
- Ensure the server is running before registering:
  ```bash
  evalhub-mcp --transport http --host localhost --port 3001 &
  claude mcp add evalhub --transport http http://localhost:3001
  ```

**VS Code:**
- Check your `settings.json` MCP configuration for syntax errors.
- Reload the VS Code window (Cmd/Ctrl+Shift+P → "Developer: Reload Window").
- Check the VS Code Output panel for MCP-related error messages.

## TLS Certificate Errors

**Symptoms:** Errors mentioning certificate verification, `x509`, or `certificate signed by unknown authority`.

**For self-signed EvalHub backends:**
- Add the `--insecure` flag to skip TLS verification for the backend connection:
  ```bash
  evalhub-mcp --transport http --insecure
  ```
  Or set the environment variable:
  ```bash
  export EVALHUB_INSECURE=true
  ```

**For the MCP server's own HTTPS:**
- Ensure both `--tls-cert` and `--tls-key` point to valid PEM files.
- On Kubernetes with OpenShift, TLS certificates are provisioned automatically by the operator.

The `--insecure` flag only affects the connection from the MCP server **to** the EvalHub backend. It does not affect the MCP server's own TLS configuration.

## EvalHub Backend Unreachable

**Symptoms:** The MCP server starts but tools and resources return connection errors.

The MCP server is designed to start even if the EvalHub backend is unreachable. Verify the backend URL:

```bash
curl -k $EVALHUB_BASE_URL/api/v1/health
```

If the backend is down:
- Check the EvalHub deployment:
  ```bash
  kubectl get pods -l app=evalhub
  ```
- Verify `EVALHUB_BASE_URL` points to the correct host and port.
- For Kubernetes deployments, ensure the service is accessible from where the MCP server runs.

## Common Error Messages

| Error | Cause | Resolution |
|-------|-------|------------|
| `validation error: provide at least one of 'benchmarks' or 'collection'` | `submit_evaluation` called without specifying what to evaluate | Include either a `benchmarks` array or a `collection` object |
| `validation error: provide 'benchmarks' or 'collection', not both` | Both `benchmarks` and `collection` specified | Use one or the other, not both |
| `validation error: 'job_id' is required` | `cancel_job` or `get_job_status` called without a job ID | Pass the job ID returned by `submit_evaluation` |
| `invalid job status "xyz"` | Invalid status filter on jobs resource | Use: `pending`, `running`, `completed`, `failed`, `cancelled`, or `partially_failed` |
| `resource not found` | Requested ID does not exist | Check the ID with a list resource first |

## Using MCP Inspector for Debugging

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is a visual debugging tool for MCP servers:

```bash
npx @modelcontextprotocol/inspector
```

Configure it with:
- **Command:** `evalhub-mcp`
- **Arguments:** (leave empty for stdio, or configure for HTTP)

The inspector lets you browse available tools, resources, and prompts, and test them interactively.

## Health Check Endpoint

When running in HTTP mode, the server exposes a health endpoint:

```bash
curl http://localhost:3001/health
```

A `200 OK` response with `{"status":"ok"}` confirms the server is running and accepting connections.
