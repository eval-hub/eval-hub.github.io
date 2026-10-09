# eval-hub.github.io

Documentation site for EvalHub.

## Overview

This repository contains the source for the [EvalHub documentation](https://eval-hub.github.io) built with Astro/Starlight.

## Deployment

### Automatic Deployment

Documentation is built on pushes to `main` and published to the `gh-pages` branch (GitHub Pages source: **Deploy from a branch** → `gh-pages` / root).

The deployment workflow also rebuilds and publishes the site when it receives a `repository_dispatch` event of type `catalogs-updated`. The sender in `eval-hub/eval-hub` emits this event when `config/collections/**` changes on `main`; see [the sender PR](https://github.com/eval-hub/eval-hub/pull/1111). Each build fetches the latest catalogs through `npm run build`.

The receiver workflow must be merged into this repository's default branch before events can trigger it. Configure `DOCS_DISPATCH_TOKEN` in `eval-hub/eval-hub` with **Contents: write** access to this repository. To verify the integration, manually run **Notify documentation of catalog changes** on `main` in `eval-hub/eval-hub`, then check for a **Deploy Documentation** run here. The receiver uses this repository's default branch; the event payload is informational and does not select code to check out.

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
