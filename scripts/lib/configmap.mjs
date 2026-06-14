/**
 * Generate a Kubernetes ConfigMap YAML wrapping a provider definition.
 */
export function buildConfigMapYaml({
  providerId,
  providerYaml,
  namespace = 'opendatahub',
  name = `evalhub-provider-${providerId}`,
  providerType = 'system',
  providerName = providerId,
}) {
  const dataKey = `${providerId}.yaml`;
  const indented = providerYaml
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');

  return `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    trustyai.opendatahub.io/evalhub-provider-type: ${providerType}
    trustyai.opendatahub.io/evalhub-provider-name: ${providerName}
data:
  ${dataKey}: |
${indented}
`;
}
