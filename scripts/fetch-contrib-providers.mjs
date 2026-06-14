#!/usr/bin/env node
/**
 * Fetch provider.yaml files from eval-hub-contrib and build catalog JSON.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../src/generated');
const OUT_FILE = join(OUT_DIR, 'providers-catalog.json');

const CONTRIB_REPO = process.env.CONTRIB_REPO ?? 'eval-hub/eval-hub-contrib';
const CONTRIB_REF = process.env.CONTRIB_REF ?? 'main';
const PROVIDER_PATH_RE = /^adapters\/[^/]+\/provider\.yaml$/;

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'eval-hub.github.io-fetch-providers',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function githubFetch(url) {
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status} for ${url}: ${body}`);
  }
  return res.json();
}

async function resolveTreeSha() {
  const refData = await githubFetch(
    `https://api.github.com/repos/${CONTRIB_REPO}/git/ref/heads/${CONTRIB_REF}`,
  );
  return refData.object.sha;
}

async function listProviderPaths(treeSha) {
  const tree = await githubFetch(
    `https://api.github.com/repos/${CONTRIB_REPO}/git/trees/${treeSha}?recursive=1`,
  );
  return tree.tree
    .filter((entry) => entry.type === 'blob' && PROVIDER_PATH_RE.test(entry.path))
    .map((entry) => entry.path)
    .sort();
}

async function fetchFileContent(path) {
  const data = await githubFetch(
    `https://api.github.com/repos/${CONTRIB_REPO}/contents/${path}?ref=${CONTRIB_REF}`,
  );
  if (data.encoding !== 'base64' || !data.content) {
    throw new Error(`Unexpected content encoding for ${path}`);
  }
  return Buffer.from(data.content, 'base64').toString('utf8');
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function buildProviderEntry(path, rawYaml, parsed) {
  const adapterDir = path.split('/')[1];
  const benchmarks = (parsed.benchmarks ?? []).map((b) => ({
    id: b.id,
    name: b.name ?? b.id,
    description: b.description ?? '',
    category: b.category ?? '',
    metrics: b.metrics ?? [],
    tags: b.tags ?? [],
  }));

  const categories = uniqueSorted(benchmarks.map((b) => b.category));
  const benchmarkTags = uniqueSorted(benchmarks.flatMap((b) => b.tags ?? []));
  const providerTags = parsed.tags ?? [];

  const k8s = parsed.runtime?.k8s ?? null;
  const local = parsed.runtime?.local;
  const hasLocalRuntime = local != null && local !== false;

  return {
    id: parsed.id,
    name: parsed.name ?? parsed.id,
    title: parsed.title ?? '',
    description: parsed.description ?? '',
    tags: providerTags,
    adapterDir,
    sourceUrl: `https://github.com/${CONTRIB_REPO}/blob/${CONTRIB_REF}/${path}`,
    benchmarkCount: benchmarks.length,
    categories,
    benchmarkTags,
    allTags: uniqueSorted([...providerTags, ...benchmarkTags]),
    runtime: {
      k8s: k8s
        ? {
            image: k8s.image ?? '',
            entrypoint: k8s.entrypoint ?? [],
            cpuRequest: k8s.cpu_request ?? '',
            memoryRequest: k8s.memory_request ?? '',
            cpuLimit: k8s.cpu_limit ?? '',
            memoryLimit: k8s.memory_limit ?? '',
            gpu: k8s.gpu ?? null,
          }
        : null,
      local: hasLocalRuntime,
    },
    benchmarks,
    yaml: rawYaml.replace(/\r\n/g, '\n').replace(/\r/g, '\n'),
  };
}

async function main() {
  console.log(`Fetching providers from ${CONTRIB_REPO}@${CONTRIB_REF}...`);

  let treeSha;
  try {
    treeSha = await resolveTreeSha();
  } catch {
    // ref may be a tag or commit SHA rather than a branch name
    treeSha = CONTRIB_REF;
  }

  const paths = await listProviderPaths(treeSha);
  if (paths.length === 0) {
    throw new Error(
      `No provider.yaml files found under adapters/ in ${CONTRIB_REPO}@${CONTRIB_REF}`,
    );
  }

  const providers = [];
  for (const path of paths) {
    const rawYaml = await fetchFileContent(path);
    const parsed = yaml.load(rawYaml);
    if (!parsed?.id) {
      throw new Error(`Missing id in ${path}`);
    }
    providers.push(buildProviderEntry(path, rawYaml, parsed));
    console.log(`  ✓ ${parsed.id} (${path})`);
  }

  providers.sort((a, b) => a.name.localeCompare(b.name));

  const catalog = {
    fetchedAt: new Date().toISOString(),
    source: { repo: CONTRIB_REPO, ref: CONTRIB_REF },
    providers,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${providers.length} providers to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
