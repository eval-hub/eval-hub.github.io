import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightClientMermaid from '@pasqal-io/starlight-client-mermaid';

// For fork previews, set base to the repo name. Remove before merging upstream.
const base = process.env.ASTRO_BASE || undefined;

export default defineConfig({
  site: 'https://eval-hub.github.io',
  base,
  integrations: [
    starlight({
      title: 'EvalHub',
      plugins: [starlightClientMermaid()],
      customCss: ['./src/styles/custom.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/eval-hub' },
      ],
      editLink: {
        baseUrl: 'https://github.com/eval-hub/eval-hub.github.io/edit/main/',
      },
      sidebar: [
        { label: 'Home', slug: 'index' },
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quickstart' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'CLI', slug: 'guides/cli' },
            { label: 'Model Authentication', slug: 'guides/model-authentication' },
            { label: 'Using Custom Data', slug: 'guides/custom-data' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { label: 'System Overview', slug: 'architecture/system-overview' },
            { label: 'Multi-Tenancy', slug: 'architecture/multi-tenancy' },
          ],
        },
        {
          label: 'Deployment',
          items: [
            { label: 'OpenShift Setup', slug: 'deployment/openshift-setup' },
          ],
        },
        {
          label: 'Adapters',
          items: [
            {
              label: 'GuideLLM',
              items: [
                { label: 'Overview', slug: 'adapters/guidellm' },
                { label: 'Configuration', slug: 'adapters/guidellm/configuration' },
                { label: 'Profiles', slug: 'adapters/guidellm/profiles' },
                { label: 'Metrics', slug: 'adapters/guidellm/metrics' },
                { label: 'Examples', slug: 'adapters/guidellm/examples' },
              ],
            },
            {
              label: 'LightEval',
              items: [
                { label: 'Overview', slug: 'adapters/lighteval' },
                { label: 'Configuration', slug: 'adapters/lighteval/configuration' },
                { label: 'Benchmarks', slug: 'adapters/lighteval/benchmarks' },
                { label: 'Examples', slug: 'adapters/lighteval/examples' },
              ],
            },
            {
              label: 'IBM CLEAR',
              items: [
                { label: 'Overview', slug: 'adapters/clear' },
              ],
            },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Server API', slug: 'reference/server-api' },
            { label: 'Python SDK', slug: 'reference/sdk-client' },
            { label: 'MCP', slug: 'reference/mcp' },
            { label: 'CVE Fixer', slug: 'reference/cve-fixer' },
          ],
        },
      ],
    }),
  ],
});
