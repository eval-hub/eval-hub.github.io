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
      logo: {
        src: './src/assets/evalhub-mascot-nav.png',
        alt: 'EvalHub mascot',
      },
      head: [
        // Preload the two heading font files so they are fetched before CSS runs,
        // eliminating the FOUT flash on first load and View Transition navigation.
        { tag: 'link', attrs: { rel: 'preload', href: '/fonts/cormorant-garamond-latin-600-normal.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' } },
        { tag: 'link', attrs: { rel: 'preload', href: '/fonts/cormorant-garamond-latin-600-italic.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' } },
        { tag: 'link', attrs: { rel: 'preload', href: '/fonts/dm-sans-latin-wght-normal.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' } },
      ],
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
            julian: {
              name: 'Julian Payne',
              url: 'https://github.com/julpayne',
            },
            william: {
              name: 'William Caban Babilonia',
              url: 'https://github.com/williamcaban',
            },
            marius: {
              name: 'Marius Danciu',
              url: 'https://github.com/mariusdanciu',
            },
            matteo: {
              name: 'Matteo Mortari',
              url: 'https://github.com/tarilabs',
            },
            rui: {
              name: 'Rui Vieira',
              url: 'https://github.com/ruivieira',
            },
          },
        }),
        starlightClientMermaid(),
      ],
      favicon: '/favicon.ico',
      customCss: ['./src/styles/custom.css', './src/styles/provider-catalog.css'],
      components: {
        ThemeSelect: './src/components/ThemeSelect.astro',
        MarkdownContent: './src/components/MarkdownContent.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/eval-hub' },
      ],
      editLink: {
        baseUrl: 'https://github.com/eval-hub/eval-hub.github.io/edit/main/',
      },
      sidebar: [
        { label: 'Home', slug: 'home' },
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
            { label: 'Disconnected Cluster', slug: 'guides/disconnected-cluster' },
            { label: 'Local Mode', slug: 'guides/local-mode' },
            { label: 'Local Mode Tutorial', slug: 'guides/local-mode-tutorial' },
            { label: 'Evaluation-Driven Development', slug: 'guides/evaluation-driven-development' },
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
              collapsed: true,
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
              collapsed: true,
              items: [
                { label: 'Overview', slug: 'adapters/lighteval' },
                { label: 'Configuration', slug: 'adapters/lighteval/configuration' },
                { label: 'Benchmarks', slug: 'adapters/lighteval/benchmarks' },
                { label: 'Examples', slug: 'adapters/lighteval/examples' },
              ],
            },
            {
              label: 'IBM CLEAR',
              collapsed: true,
              items: [
                { label: 'Overview', slug: 'adapters/clear' },
              ],
            },
            {
              label: 'RAGAS',
              collapsed: true,
              items: [
                { label: 'Overview', slug: 'adapters/ragas' },
                { label: 'Configuration', slug: 'adapters/ragas/configuration' },
                { label: 'Metrics', slug: 'adapters/ragas/metrics' },
                { label: 'Examples', slug: 'adapters/ragas/examples' },
              ],
            },
          ],
        },
        {
          label: 'MCP',
          items: [
            { label: 'Overview', slug: 'mcp' },
            { label: 'Installation', slug: 'mcp/installation' },
            {
              label: 'Quick Start',
              items: [
                { label: 'Claude Code', slug: 'mcp/quickstart-claude' },
                { label: 'VS Code', slug: 'mcp/quickstart-vscode' },
              ],
            },
            { label: 'Agent Discoverability', slug: 'mcp/agent-discoverability' },
            { label: 'Agent Skills', slug: 'mcp/skills' },
            { label: 'Tools', slug: 'mcp/tools' },
            { label: 'Resources', slug: 'mcp/resources' },
            { label: 'Prompts', slug: 'mcp/prompts' },
            { label: 'Troubleshooting', slug: 'mcp/troubleshooting' },
          ],
        },
        {
          label: 'Providers',
          items: [
            { label: 'Provider Catalog', slug: 'providers/catalog' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Server API', slug: 'reference/server-api' },
            { label: 'Python SDK', slug: 'reference/sdk-client' },
          ],
        },
      ],
    }),
  ],
});
