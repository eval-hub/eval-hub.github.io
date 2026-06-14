/**
 * Shared ConfigMap generation utilities for Node scripts.
 *
 * Canonical types live in src/types/configmap.ts.
 * This file mirrors src/lib/configmap.ts for use in plain Node (.mjs) scripts
 * that cannot import TypeScript directly.
 */
import yaml from 'js-yaml';

/**
 * Convert a provider id to a Kubernetes-safe slug (underscores to hyphens).
 * e.g. "lm_evaluation_harness" becomes "lm-evaluation-harness"
 *
 * @param {string} id
 * @returns {string}
 */
export function toK8sSlug(id) {
  return id.replace(/_/g, '-');
}

/**
 * Generate a Kubernetes ConfigMap YAML wrapping a provider definition.
 *
 * @param {import('../../src/types/configmap').ConfigMapOptions} opts
 * @returns {string}
 */
export function buildConfigMapYaml({
  providerId,
  providerYaml,
  namespace = 'opendatahub',
  name = `evalhub-provider-${toK8sSlug(providerId)}`,
  providerType = 'system',
  providerName = toK8sSlug(providerId),
}) {
  const dataKey = `${providerId}.yaml`;

  const configMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name,
      namespace,
      labels: {
        'trustyai.opendatahub.io/evalhub-provider-type': providerType,
        'trustyai.opendatahub.io/evalhub-provider-name': providerName,
      },
    },
    data: {
      [dataKey]: providerYaml,
    },
  };

  return yaml.dump(configMap, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}
