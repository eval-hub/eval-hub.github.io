# OpenShift Development Setup

Complete guide for deploying and developing EvalHub on OpenShift with OpenDataHub.

## Overview

This guide covers deploying a custom EvalHub instance on OpenShift integrated with OpenDataHub.

!!! note "OpenDataHub Integration"
    EvalHub is integrated into OpenDataHub via the TrustyAI Operator, which manages EvalHub deployments as custom resources.

## Prerequisites

### Required Tools

- **OpenShift CLI (`oc`)** - Version 4.12+
- **kubectl** - Compatible with your OpenShift version
- **jq** - JSON processor for manifest manipulation
- **Git** - For cloning repositories
- **Podman** or **Docker** - For building custom images

### Cluster Access

Ensure you have access to an OpenShift cluster:

```bash
# Login to OpenShift
oc login --server=https://api.your-cluster.example.com:6443

# Verify access
oc whoami
oc cluster-info
```

!!! warning "Administrator Access Required"
    Installing OpenDataHub and the TrustyAI Operator requires cluster-admin or equivalent permissions.

## OpenDataHub Installation

OpenDataHub provides the foundation for deploying EvalHub on OpenShift.

### 1. Install OpenDataHub Operator

Install the OpenDataHub Operator (version 3.3 or higher) from OperatorHub in the OpenShift web console:

1. Navigate to **Operators → OperatorHub**
2. Search for "OpenDataHub"
3. Click **Install**
4. Select **fast** channel
5. Choose **All namespaces on the cluster** installation mode
6. Click **Install**

Wait for the operator installation to complete:

```bash
# Check operator installation
oc get csv -n openshift-operators | grep opendatahub

# Should show PHASE: "Succeeded"
```

### 2. Configure OpenDataHub

After the operator is installed, configure OpenDataHub from the operator's dashboard:

1. Navigate to **Operators → Installed Operators**
2. Select **OpenDataHub Operator**
3. Go to the **Data Science Cluster** tab
4. Click **Create DataScienceCluster**
5. Use default settings for most components
6. **Important**: Under the TrustyAI component, configure LMEval security settings:
   - Set `permitCodeExecution` to **allow**
   - Set `permitOnline` to **allow**
7. Click **Create**

!!! warning "Security Settings"
    The `permitCodeExecution` and `permitOnline` settings control whether evaluation jobs can execute arbitrary code or access the internet. For development and testing, set these to `allow`. For production deployments, consider setting to `deny` based on your security requirements.

Verify the DataScienceCluster is ready:

```bash
# Check DSC status
oc get datasciencecluster default-dsc -o jsonpath='{.status.phase}'

# Should output: "Ready"

# List deployed components
oc get pods -n opendatahub
```

## TrustyAI Operator Deployment

The TrustyAI Operator manages EvalHub custom resources.

### 1. Verify TrustyAI Operator Installation

The TrustyAI Operator is installed automatically as part of the DataScienceCluster:

```bash
# Check TrustyAI Operator pods
oc get pods -n opendatahub -l control-plane=trustyai-service-operator-controller-manager

# Check TrustyAI CRDs
oc get crd | grep trustyai
```

Example CRDs (actual list may vary):

- `evalhubs.trustyai.opendatahub.io` - EvalHub instances
- `trustyaiservices.trustyai.opendatahub.io` - TrustyAI services
- `lmevaljobrequests.trustyai.opendatahub.io` - LMEval job requests

## EvalHub Custom Resource

Deploy an EvalHub instance using a custom resource.

### 1. Create EvalHub Namespace

```bash
# Create namespace for EvalHub workloads
oc create namespace evalhub-test

# Label for monitoring and networking
oc label namespace evalhub-test \
  opendatahub.io/dashboard=true \
  evalhub.trustyai.io/managed=true
```

### 2. Deploy EvalHub Instance

Create an EvalHub custom resource:

```bash
oc apply -f - <<EOF
apiVersion: trustyai.opendatahub.io/v1alpha1
kind: EvalHub
metadata:
  name: evalhub
  namespace: evalhub-test
spec:
  replicas: 1
EOF
```

### 3. Verify Deployment

```bash
# Check EvalHub CR status
oc get evalhub evalhub -n evalhub-test

# Should show STATUS: Ready

# Check EvalHub pods
oc get pods -n evalhub-test -l app=evalhub

# Check EvalHub service
oc get svc -n evalhub-test -l app=evalhub

# Check route (if OAuth is enabled)
oc get route -n evalhub-test -l app=evalhub
```

### 4. Access EvalHub

Get the EvalHub URL:

```bash
# Get route URL
EVALHUB_URL=$(oc get route evalhub -n evalhub-test -o jsonpath='{.spec.host}')
echo "EvalHub URL: https://$EVALHUB_URL"

# Test health endpoint
curl -k "https://$EVALHUB_URL/api/v1/health"
```

With OAuth enabled:

```bash
# Get authentication token
TOKEN=$(oc whoami -t)

# Access EvalHub with token
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://$EVALHUB_URL/api/v1/providers"
```

## Development Workflow

Develop and test custom EvalHub providers on OpenShift.

### 1. Clone Repositories

```bash
# Clone EvalHub repositories
git clone https://github.com/eval-hub/eval-hub.git
git clone https://github.com/eval-hub/eval-hub-sdk.git
git clone https://github.com/eval-hub/eval-hub-contrib.git

# Clone TrustyAI Operator (for operator development)
git clone https://github.com/trustyai-explainability/trustyai-service-operator.git
```

### 2. Upload Custom Operator Manifests

You can deploy EvalHub directly using the manifests from the cloned TrustyAI operator repository without any modifications. Alternatively, if you want to use custom images or configurations, you can modify the manifests before uploading them.

For development and testing, you can upload TrustyAI operator manifests directly to the OpenDataHub operator without rebuilding operator images. This allows you to iterate quickly on operator configurations, CRDs, and RBAC definitions.

!!! warning "Development Only"
    This approach is intended for development and testing only. Production deployments should use proper operator image releases.

#### Overview

The process involves:

1. Creating a PersistentVolumeClaim to store custom manifests
2. Patching the OpenDataHub operator CSV to mount the PVC
3. Copying your custom manifests into the operator pod
4. Restarting the operators to load the new manifests

This is based on the [OpenDataHub component development workflow](https://raw.githubusercontent.com/opendatahub-io/opendatahub-operator/refs/heads/main/hack/component-dev/README.md).

#### Prepare Custom Manifests

Clone the TrustyAI operator repository to get the manifests:

```bash
# Clone TrustyAI operator (if not already cloned)
git clone https://github.com/trustyai-explainability/trustyai-service-operator.git
cd trustyai-service-operator
```

The operator repository has the following structure under `config/`:

```bash
config/
├── crd/
│   └── bases/
│       ├── trustyai.opendatahub.io_evalhubs.yaml
│       ├── trustyai.opendatahub.io_lmevaljobrequests.yaml
│       └── trustyai.opendatahub.io_trustyaiservices.yaml
├── default/
│   ├── kustomization.yaml
│   └── manager_auth_proxy_patch.yaml
├── manager/
│   ├── kustomization.yaml
│   └── manager.yaml
├── manifests/
│   └── ...
├── overlays/
│   └── odh/
│       ├── kustomization.yaml
│       └── params.env
├── rbac/
│   ├── auth_proxy_client_clusterrole.yaml
│   ├── auth_proxy_role.yaml
│   ├── auth_proxy_role_binding.yaml
│   ├── auth_proxy_service.yaml
│   ├── evalhub_jobs_proxy_role.yaml
│   ├── evalhub_resource_manager_binding.yaml
│   ├── evalhub_resource_manager_role.yaml
│   ├── kustomization.yaml
│   ├── leader_election_role.yaml
│   ├── leader_election_role_binding.yaml
│   ├── role.yaml
│   ├── role_binding.yaml
│   ├── service_account.yaml
│   └── ...
└── samples/
    └── ...
```

To deploy as-is, use the manifests without modifications. To customize, edit the configuration files:

```bash
# Example: Update image references
vim config/overlays/odh/params.env

# Example: Modify RBAC permissions
vim config/rbac/evalhub_resource_manager_role.yaml
```

#### Upload Manifests

Follow these steps to upload your custom manifests to the OpenDataHub operator:

**Step 1: Create PersistentVolumeClaim**

```bash
cat <<EOF | oc apply -n openshift-operators -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: trustyai-manifests
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
EOF
```

**Step 2: Patch CSV to mount manifests**

```bash
# Get the OpenDataHub operator CSV name
CSV=$(oc get csv -n openshift-operators -o name | grep opendatahub-operator | head -n1 | cut -d/ -f2)

# Patch CSV to mount the PVC
oc patch csv "${CSV}" -n openshift-operators --type json -p '[
  {"op": "replace", "path": "/spec/install/spec/deployments/0/spec/replicas", "value": 1},
  {"op": "replace", "path": "/spec/install/spec/deployments/0/spec/strategy/type", "value": "Recreate"},
  {"op": "add", "path": "/spec/install/spec/deployments/0/spec/template/spec/securityContext", "value": {"fsGroup": 1001}},
  {"op": "add", "path": "/spec/install/spec/deployments/0/spec/template/spec/volumes/-", "value": {"name": "trustyai-manifests", "persistentVolumeClaim": {"claimName": "trustyai-manifests"}}},
  {"op": "add", "path": "/spec/install/spec/deployments/0/spec/template/spec/containers/0/volumeMounts/-", "value": {"name": "trustyai-manifests", "mountPath": "/opt/manifests/trustyai"}}
]'
```

!!! note "CSV Patch Idempotency"
    The patch command may fail if already applied. This is expected and can be safely ignored.

**Step 3: Copy manifests into operator pod**

```bash
# Wait for the operator pod to be ready after patching
oc wait --for=condition=ready pod -n openshift-operators -l name=opendatahub-operator --timeout=120s

# Get the operator pod name
POD=$(oc get pod -n openshift-operators -l name=opendatahub-operator -o jsonpath='{.items[0].metadata.name}')

# Copy manifests from your local repository to the operator pod
oc cp ./trustyai-service-operator/config/. openshift-operators/${POD}:/opt/manifests/trustyai
```

**Step 4: Restart operators**

```bash
# Restart OpenDataHub operator
oc rollout restart deploy -n openshift-operators -l name=opendatahub-operator

# Restart TrustyAI operator
oc rollout restart deployment/trustyai-service-operator-controller-manager -n opendatahub
```

Wait for the operators to be ready:

```bash
# Wait for OpenDataHub operator
oc wait --for=condition=available deployment -n openshift-operators -l name=opendatahub-operator --timeout=120s

# Wait for TrustyAI operator
oc wait --for=condition=available deployment/trustyai-service-operator-controller-manager -n opendatahub --timeout=120s
```

#### Verify Custom Manifests

After uploading and restarting, verify the operators are using your custom manifests:

```bash
# Check operator pods are running
oc get pods -n openshift-operators -l name=opendatahub-operator
oc get pods -n opendatahub -l control-plane=trustyai-service-operator-controller-manager

# Check TrustyAI operator logs for manifest loading
oc logs -n opendatahub -l control-plane=trustyai-service-operator-controller-manager --tail=50

# Verify ConfigMap has your custom values
oc get configmap trustyai-service-operator-config -n opendatahub -o yaml
```

Test your changes by creating or updating an EvalHub CR:

```bash
# Delete existing EvalHub if it exists
oc delete evalhub evalhub -n evalhub-test --ignore-not-found

# Create EvalHub with custom manifests
oc apply -f - <<EOF
apiVersion: trustyai.opendatahub.io/v1alpha1
kind: EvalHub
metadata:
  name: evalhub
  namespace: evalhub-test
spec:
  replicas: 1
EOF

# Check if custom changes are applied
oc get evalhub evalhub -n evalhub-test -o yaml
oc get pods -n evalhub-test -l app=evalhub
```

#### Iterate on Changes

To update your manifests during development:

1. **Modify manifests** in your local directory (e.g., `./trustyai-service-operator/config/`)
2. **Copy updated manifests to the operator pod**:
   ```bash
   POD=$(oc get pod -n openshift-operators -l name=opendatahub-operator -o jsonpath='{.items[0].metadata.name}')
   oc cp ./trustyai-service-operator/config/. openshift-operators/${POD}:/opt/manifests/trustyai
   ```
3. **Restart operators**:
   ```bash
   oc rollout restart deploy -n openshift-operators -l name=opendatahub-operator
   oc rollout restart deployment/trustyai-service-operator-controller-manager -n opendatahub
   ```
4. **Test changes** by recreating the EvalHub CR

The operators will automatically load your updated manifests.

#### Important Notes

- **RWO Storage**: The PVC uses ReadWriteOnce access mode, requiring single-replica operator deployment
- **Recreate Strategy**: The CSV is patched to use "Recreate" deployment strategy to avoid PVC conflicts
- **Not Idempotent**: The CSV patch may fail if already applied (this is expected)
- **Development Only**: This workflow is not suitable for production deployments

#### Cleanup

To remove custom manifests and restore the operator to default:

```bash
# Delete the PVC
oc delete pvc trustyai-manifests -n openshift-operators

# Restore CSV to default by reinstalling the operator
# Or manually remove the volumeMounts and volumes from the CSV
```

### 3. Build Custom EvalHub Image

If you want to use a custom EvalHub server image (for example, with modified code or dependencies), build and push it to your container registry, then update the operator manifests before uploading them.

Build a custom EvalHub server image:

```bash
cd eval-hub

# Build with Podman
podman build -t quay.io/your-org/eval-hub:dev .

# Push to registry
podman login quay.io
podman push quay.io/your-org/eval-hub:dev
```

Update the operator manifests to use your custom image:

```bash
# Edit the params.env file in the operator repository
cd trustyai-service-operator
vim config/overlays/odh/params.env

# Change evalHubImage to your custom image
# evalHubImage=quay.io/your-org/eval-hub:dev
```

Then upload the modified manifests using the commands from the previous section:

```bash
# Copy manifests to operator pod
POD=$(oc get pod -n openshift-operators -l name=opendatahub-operator -o jsonpath='{.items[0].metadata.name}')
oc cp ./trustyai-service-operator/config/. openshift-operators/${POD}:/opt/manifests/trustyai

# Restart operators
oc rollout restart deploy -n openshift-operators -l name=opendatahub-operator
oc rollout restart deployment/trustyai-service-operator-controller-manager -n opendatahub
```

Delete and recreate the EvalHub instance to use the new image:

```bash
# Delete existing instance
oc delete evalhub evalhub -n evalhub-test

# Recreate with new image
oc apply -f - <<EOF
apiVersion: trustyai.opendatahub.io/v1alpha1
kind: EvalHub
metadata:
  name: evalhub
  namespace: evalhub-test
spec:
  replicas: 1
EOF
```

### 4. Test Deployment

Verify the EvalHub deployment by listing available providers and submitting a test evaluation.

**List available providers:**

```bash
# Get EvalHub URL and token
EVALHUB_URL=$(oc get route evalhub -n evalhub-test -o jsonpath='{.spec.host}')
TOKEN=$(oc whoami -t)

# List all providers
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://$EVALHUB_URL/api/v1/providers" | jq .

# List benchmarks for a specific provider
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://$EVALHUB_URL/api/v1/providers/lm_evaluation_harness/benchmarks" | jq .
```

**Submit a test evaluation:**

```bash
# Create evaluation request
cat > eval-request.json <<EOF
{
  "model": {
    "url": "http://vllm-server.models.svc.cluster.local:8000/v1",
    "name": "meta-llama/Llama-3.2-1B-Instruct"
  },
  "benchmarks": [
    {
      "id": "mmlu",
      "provider_id": "lm_evaluation_harness"
    }
  ],
  "experiment": {
    "name": "test-deployment",
    "tags": [
      {
        "key": "environment",
        "value": "development"
      }
    ]
  }
}
EOF

# Submit evaluation
curl -k -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @eval-request.json \
  "https://$EVALHUB_URL/api/v1/evaluations/jobs" | jq .
```

## Troubleshooting

### EvalHub Pod Not Starting

**Symptoms:** EvalHub pod stuck in Pending or CrashLoopBackOff

**Diagnostics:**

```bash
# Check pod status
oc get pods -n evalhub-test -l app=evalhub

# Describe pod for events
oc describe pod -n evalhub-test -l app=evalhub

# Check logs
oc logs -n evalhub-test -l app=evalhub --tail=100
```

**Common causes:**

1. **Image pull failure**
   ```bash
   # Check image pull secrets
   oc get secret -n evalhub-test

   # Verify image exists
   podman pull quay.io/opendatahub/odh-eval-hub:latest
   ```

2. **Insufficient resources**
   ```bash
   # Check node capacity
   oc describe node | grep -A5 "Allocated resources"

   # Reduce resource requests in CR
   oc edit evalhub evalhub -n evalhub-test
   ```

3. **ConfigMap missing**
   ```bash
   # Check operator ConfigMap
   oc get configmap trustyai-service-operator-config -n opendatahub
   ```

### Evaluation Jobs Failing

**Symptoms:** Jobs complete but report failure status

**Diagnostics:**

```bash
# Find evaluation job
oc get jobs -n evalhub-test -l app=evalhub

# Check job status
oc describe job <job-name> -n evalhub-test

# Check adapter pod logs
oc logs -n evalhub-test -l job-name=<job-name> -c adapter

# Check sidecar logs (if present)
oc logs -n evalhub-test -l job-name=<job-name> -c sidecar
```

**Common causes:**

1. **Callback URL unreachable**
   ```bash
   # Verify EvalHub service is accessible from job pods
   oc get svc evalhub -n evalhub-test

   # Test connectivity from job pod
   oc exec -it <job-pod> -n evalhub-test -- \
     curl -v http://evalhub.evalhub-test.svc.cluster.local:8080/api/v1/health
   ```

2. **Model endpoint unreachable**
   ```bash
   # Check if model server is accessible
   oc exec -it <job-pod> -n evalhub-test -- \
     curl -v http://vllm-server.models.svc.cluster.local:8000/v1/models
   ```

3. **Insufficient job resources**
   ```bash
   # Check for OOMKilled status
   oc get pods -n evalhub-test -l job-name=<job-name> \
     -o jsonpath='{.items[*].status.containerStatuses[*].state}'

   # Increase memory limits in provider config
   ```

### OAuth Authentication Issues

**Symptoms:** 401 Unauthorized when accessing EvalHub API

**Diagnostics:**

```bash
# Check OAuth configuration
oc get route evalhub -n evalhub-test -o yaml | grep -A10 tls

# Verify token is valid
oc whoami -t

# Test authentication
TOKEN=$(oc whoami -t)
curl -k -v -H "Authorization: Bearer $TOKEN" \
  "https://$(oc get route evalhub -n evalhub-test -o jsonpath='{.spec.host}')/api/v1/health"
```

**Solutions:**

1. **Regenerate token**
   ```bash
   oc login --token=<new-token>
   ```

2. **Check RBAC configuration**
   ```bash
   # Verify ClusterRoleBinding exists
   oc get clusterrolebinding | grep evalhub

   # Check user permissions
   oc auth can-i create evaluationjobs.trustyai.opendatahub.io
   ```

### Operator Not Reconciling

**Symptoms:** EvalHub CR created but no pods deployed

**Diagnostics:**

```bash
# Check operator logs
oc logs -n opendatahub \
  -l control-plane=trustyai-service-operator-controller-manager \
  --tail=100

# Check EvalHub CR status
oc get evalhub evalhub -n evalhub-test -o yaml

# Check events
oc get events -n evalhub-test --sort-by='.lastTimestamp'
```

**Solutions:**

1. **Restart operator**
   ```bash
   oc delete pod -n opendatahub \
     -l control-plane=trustyai-service-operator-controller-manager
   ```

2. **Check CRD versions**
   ```bash
   # Verify CRD is installed
   oc get crd evalhubs.trustyai.opendatahub.io

   # Check stored versions
   oc get crd evalhubs.trustyai.opendatahub.io \
     -o jsonpath='{.status.storedVersions}'
   ```

3. **Recreate EvalHub CR**
   ```bash
   oc delete evalhub evalhub -n evalhub-test
   oc apply -f evalhub-cr.yaml
   ```

## Next Steps

- [Creating Adapters](creating-adapters.md) - Build custom evaluation providers
- [Architecture](architecture.md) - Understand EvalHub architecture
- [API Reference](../reference/api.md) - REST API documentation
- [TrustyAI Operator Documentation](https://github.com/trustyai-explainability/trustyai-service-operator) - Operator details

## Additional Resources

- [OpenDataHub Documentation](https://opendatahub.io/docs/)
- [OpenShift Documentation](https://docs.openshift.com/)
- [Kubernetes Operators](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [EvalHub GitHub](https://github.com/eval-hub/eval-hub)
- [TrustyAI Operator GitHub](https://github.com/trustyai-explainability/trustyai-service-operator)
