# eval-hub.github.io

Documentation site for EvalHub.

## Overview

This repository contains the source for the [EvalHub documentation](https://eval-hub.github.io) built with Astro/Starlight.

## Deployment

### Automatic Deployment

Documentation is built on pushes to `main` and published to the `gh-pages` branch (GitHub Pages source: **Deploy from a branch** → `gh-pages` / root).

### Pull request previews

Same-repo pull requests get a sticky preview comment with a URL like:

`https://eval-hub.github.io/pr-preview/pr-<number>/`

Previews are cleaned up when the PR is closed. Fork PRs are not previewed (build CI still runs).

**One-time repository settings** (required for preview and production branch deploys):

1. **Settings → Pages** — Source: **Deploy from a branch**, Branch: `gh-pages` / `/ (root)`
2. **Settings → Actions → General → Workflow permissions** — **Read and write permissions** (and allow workflows to create PRs if prompted)

Without write permissions, `deploy.yml` and `pr-preview.yml` cannot update `gh-pages`.

## Generated catalogs

`npm run dev` and `npm run build` refresh the provider and collection catalogs from GitHub. To refresh them separately, run `npm run fetch-providers` or `npm run fetch-collections`.

The collection catalog reads `config/collections/*.yaml` (and `.yml`) from `eval-hub/eval-hub`. Override the source with `COLLECTIONS_REPO` and `COLLECTIONS_REF` (branch, tag, or commit). `GITHUB_TOKEN` is used when available. Generated JSON is written to `src/generated/` and is not committed.

Collections with `curation_order > 0` appear first in ascending priority order; zero or omitted values appear in the non-curated section. Descriptions use the first sentence, capped at 220 characters, and the full definition remains available from each card.

## Adding Blog Posts

Blog posts live in `src/content/docs/blog/`. Create a new Markdown file there with this frontmatter:

```markdown
---
title: "Your Post Title"
date: 2026-05-02T00:00:00.000Z
authors:
  - evalhub
excerpt: >
  A short summary shown in the blog index.
---

Post content goes here.
```

- `date` controls the publish date and sort order.
- `authors` must match a key defined in the `starlightBlog` authors config in `astro.config.mjs`.
- The filename becomes the URL slug (e.g. `my-post.md` → `/blog/my-post/`).

## License

See the [LICENSE](LICENSE) file for details.
