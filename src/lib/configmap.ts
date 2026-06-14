import yaml from 'js-yaml';
import type { CatalogProvider, ConfigMapOptions } from '../types/configmap';

/**
 * Convert a provider id to a Kubernetes-safe slug (underscores to hyphens).
 * e.g. "lm_evaluation_harness" becomes "lm-evaluation-harness"
 */
export function toK8sSlug(id: string): string {
  return id.replace(/_/g, '-');
}

/**
 * Derive default ConfigMapOptions from a provider, with optional overrides.
 */
export function defaultConfigMapOptions(
  provider: Pick<CatalogProvider, 'id' | 'yaml'>,
  overrides?: Partial<ConfigMapOptions>,
): ConfigMapOptions {
  const slug = toK8sSlug(provider.id);
  return {
    providerId: provider.id,
    providerYaml: provider.yaml,
    namespace: 'opendatahub',
    name: `evalhub-provider-${slug}`,
    providerType: 'system',
    providerName: slug,
    ...overrides,
  };
}

/**
 * Generate a Kubernetes ConfigMap YAML from structured options.
 *
 * Uses js-yaml to serialise the outer ConfigMap structure, ensuring correct
 * indentation and escaping. The inner provider YAML is embedded as a YAML
 * block scalar via the data key.
 */
export function buildConfigMapYaml(opts: ConfigMapOptions): string {
  const dataKey = `${opts.providerId}.yaml`;

  const configMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: opts.name,
      namespace: opts.namespace,
      labels: {
        'trustyai.opendatahub.io/evalhub-provider-type': opts.providerType,
        'trustyai.opendatahub.io/evalhub-provider-name': opts.providerName,
      },
    },
    data: {
      [dataKey]: opts.providerYaml,
    },
  };

  return yaml.dump(configMap, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}

/**
 * Convenience: build ConfigMap YAML directly from a provider with optional overrides.
 */
export function providerToConfigMapYaml(
  provider: Pick<CatalogProvider, 'id' | 'yaml'>,
  overrides?: Partial<ConfigMapOptions>,
): string {
  return buildConfigMapYaml(defaultConfigMapOptions(provider, overrides));
}
