import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightClientMermaid from '@pasqal-io/starlight-client-mermaid';
import starlightBlog from 'starlight-blog';

// For fork previews, set base to the repo name. Remove before merging upstream.
const base = process.env.ASTRO_BASE || undefined;

export default defineConfig({
  site: 'https://eval-hub.github.io',
  base,
  integrations: [
    starlight({
      title: 'EvalHub',
      plugins: [
        starlightBlog({
          authors: {
            evalhub: {
              name: 'EvalHub Team',
              url: 'https://github.com/eval-hub',
            },
            sagar: {
              name: 'Narayan Sagar',
              url: 'https://github.com/nbs-rh',
            },
            prabhu: {
              name: 'Prabhu Padashetty',
              url: 'https://github.com/ppadashe-psp',
            },
            sobha: {
              name: 'Sobha Cheruku',
              url: 'https://github.com/scheruku-rh',
            },
            biak: {
              name: 'Gin Biak Naulak',
              url: 'https://github.com/gnaulak-redhat',
            },
          },
        }),
        starlightClientMermaid(),
      ],
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
            { label: 'Local Mode', slug: 'guides/local-mode' },
            { label: 'Local Mode Tutorial', slug: 'guides/local-mode-tutorial' },
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
          label: 'MCP',
          items: [
            { label: 'Overview', slug: 'mcp' },
            { label: 'Installation', slug: 'mcp/installation' },
            { label: 'Quick Start', slug: 'mcp/quickstart' },
            { label: 'Configuration', slug: 'mcp/configuration' },
            { label: 'Tool Reference', slug: 'mcp/tools' },
            { label: 'Resource Reference', slug: 'mcp/resources' },
            { label: 'Prompt Reference', slug: 'mcp/prompts' },
            { label: 'Troubleshooting', slug: 'mcp/troubleshooting' },
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
