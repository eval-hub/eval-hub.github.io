#!/usr/bin/env node
/** Fetch EvalHub collection definitions and generate the build-time catalog. */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const repo = process.env.COLLECTIONS_REPO ?? 'eval-hub/eval-hub';
const ref = process.env.COLLECTIONS_REF ?? 'main';
const outDir = new URL('../src/generated/', import.meta.url);

async function githubFetch(path) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'eval-hub.github.io-fetch-collections',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com/repos/${repo}/${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub API ${response.status} fetching ${path}`);
  return response.json();
}

function shortDescription(description = '') {
  const text = String(description).replace(/\s+/g, ' ').trim();
  const sentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0].trim() ?? text;
  if (sentence.length <= 220) return sentence;
  return `${sentence.slice(0, 219).replace(/\s+\S*$/, '').trimEnd()}…`;
}

async function main() {
  console.log(`Fetching collections from ${repo}@${ref}...`);
  const tree = await githubFetch(`git/trees/${encodeURIComponent(ref)}?recursive=1`);
  if (tree.truncated) throw new Error('GitHub returned a truncated repository tree');
  const paths = tree.tree
    .filter((entry) => entry.type === 'blob' && /^config\/collections\/[^/]+\.ya?ml$/.test(entry.path))
    .map((entry) => entry.path)
    .sort();
  if (!paths.length) throw new Error(`No collection YAML files found in ${repo}@${ref}`);

  const collections = [];
  const ids = new Set();
  for (const path of paths) {
    // Pin every file to the same tree, even if the branch changes during the build.
    const file = await githubFetch(`contents/${path}?ref=${tree.sha}`);
    if (file.encoding !== 'base64' || !file.content) throw new Error(`Unexpected content encoding for ${path}`);
    const rawYaml = Buffer.from(file.content, 'base64').toString('utf8');
    const parsed = yaml.load(rawYaml);
    if (!parsed?.id || ids.has(parsed.id)) throw new Error(`Missing or duplicate collection id in ${path}`);
    ids.add(parsed.id);
    if (!Array.isArray(parsed.benchmarks)) throw new Error(`Missing benchmarks in ${path}`);

    const curationOrder = parsed.curation_order ?? 0;
    if (!Number.isInteger(curationOrder) || curationOrder < 0) throw new Error(`Invalid curation_order in ${path}`);
    const benchmarks = parsed.benchmarks.map((benchmark) => {
      if (!benchmark.id || !benchmark.provider_id) throw new Error(`Missing benchmark id or provider_id in ${path}`);
      return {
        id: benchmark.id,
        providerId: benchmark.provider_id,
        task: benchmark.parameters?.task ?? '',
        fewshot: benchmark.parameters?.num_fewshot ?? benchmark.parameters?.task_args?.fewshot ?? null,
      };
    });

    collections.push({
      id: parsed.id,
      name: parsed.name ?? parsed.id,
      description: shortDescription(parsed.description),
      curationOrder,
      tags: parsed.tags ?? [],
      benchmarks,
      sourceUrl: `https://github.com/${repo}/blob/${tree.sha}/${path}`,
      yaml: rawYaml.replace(/\r\n?/g, '\n'),
    });
    console.log(`  ✓ ${parsed.id} (${benchmarks.length} benchmarks)`);
  }

  collections.sort((a, b) =>
    (a.curationOrder || Infinity) - (b.curationOrder || Infinity) || a.name.localeCompare(b.name),
  );
  const catalog = {
    fetchedAt: new Date().toISOString(),
    source: { repo, ref, sha: tree.sha },
    collections,
  };
  await mkdir(outDir, { recursive: true });
  const outFile = new URL('collections-catalog.json', outDir);
  await writeFile(outFile, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${collections.length} collections to ${fileURLToPath(outFile)}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
