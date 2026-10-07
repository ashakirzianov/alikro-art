# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`alikro` is a Next.js art portfolio site for the artist "alikro". It reads its works from the `alikro-art` workspace in xaxis, through that workspace's `api/works` endpoint (see `shared/cms.ts`), and shows their images from xaxis's CDN. It moved there from `crow-cms`; see `design-xaxis-migration.md`.

The project is small, so the workflow here is lighter than in the more structured repos: dedicated `docs/` and `tasks/` folders aren't required, but they (or ad-hoc top-level `.md` files) are fine when they actually help.

## Collaboration Workflow

### Documentation Organization
- `CLAUDE.md` — conventions and guidance for Claude Code (this file).
- `DECISIONS.md` — decisions in force, grouped by area: what the code cannot say about itself.
- **Tasks, issues and ideas live in the tracker, not in this repo.** How to use it — the tools, the vocabularies, and what belongs in a repo instead — is fleet-wide guidance every agent already carries; this repo adds nothing to it.
- `TRACK.md` — which track this repo belongs to, and its slug. The slug is the tracker's project name and is declared there and nowhere else.
- `SCRATCHPAD.md` — untracked scratch space for drafting prompts and half-formed ideas. Do not act on its contents unless explicitly asked.
- No `docs/` or `tasks/` folder is set up by default — most work is driven directly from prompts and doesn't need a persistent artifact. If a design doc or task list becomes genuinely useful, it's fine to add one: prefer a top-level `.md` (e.g. `tasks-<topic>.md`, `design-<topic>.md`) until there are enough to justify a folder.

### Task Management
- Work is usually driven through direct prompts.
- Persistent task `.md` files aren't required, but they're welcome when an effort is large enough that tracking it across sessions helps. When one exists, treat its tasks as pre-approved unless stated otherwise.
- **Pre-approval carries to issues labeled `agent-ready`** — decided 2026-09-01, re-expressed as a label 2026-09-29. Issues without it: present an approach first.

### Planning & Scope
- For small, well-scoped changes, just do it — no upfront planning needed unless requested.
- For larger or more complex features, design first: sketch the approach, lay out options with tradeoffs, and agree on direction before implementing. When the feature is substantial enough to benefit from a written record, a short top-level design `.md` is a good place for it.
- Ask about ambiguity rather than guessing.
- For non-trivial design decisions (type restructuring, naming, API shape), engage in discussion before implementing. Present concrete options with tradeoffs and a recommendation, but let the user choose.

### Code Changes
- **Review posture: owned.** The user reviews changes before they are pushed.
- Small incremental commits, one logical unit each. Agents commit on their own, staging only the files they touched.
- Pushing is the user's call — do NOT push unless explicitly asked.
- Only add tests when explicitly asked.
- Always run `npm run build` after completing a change. Fix any errors before presenting the summary. Don't present work as done without a passing build.

### Communication Style
- Explanatory — include reasoning behind choices.
- Proactively suggest improvements noticed along the way, and mention them in conversation.

### Review & Iteration
- Present approach before executing (for direct prompts), unless told otherwise.
- Iterate on feedback immediately.

### Conventions & Documentation
- When a new convention emerges from discussion (naming rules, architectural patterns), add it to `CLAUDE.md` immediately.
- `CLAUDE.md` should be the authoritative source of truth for conventions — future conversations should be able to derive them from this file alone.

## Development Commands

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Coding preferences

### General
- Prefer `function name(...) { ... }` style to `const name = (...) => { ... }` style.
- Always put private (non-exported) functions at the bottom of the file, after all exports.

### Types
- Inline prop/parameter types unless the type is referenced from other places. Extract a named type only when it's used in multiple locations.

### Nullability
- Prefer `undefined` over `null` for absent values in app/shared code. Convert at boundaries where an external source (CMS API, etc.) returns `null`.

### Naming
- Use `isLoading` (not `loading`) for boolean loading state.

## CSS and Styling

- Tailwind v4 with PostCSS. Only use colors defined in `app/globals.css` (e.g. `--color-primary`). They work as Tailwind classes (e.g. `text-dimmed`). If a new color is needed, define it in `globals.css` and then use it.

## Architecture Overview

- **Framework**: Next.js 16 App Router, React 19, Tailwind v4.
- **Content source**: All asset metadata comes from xaxis's `api/works` via `shared/cms.ts`, which converts at the boundary (`null` to `undefined`, the ISO upload time to ms) and drops works without an image. The endpoint returns released works only; tattoos are released but hidden by kind in `shared/preprocess.ts`. `shared/metadataStore.ts` caches the read under the `cms-content` tag.
- **Images**: each work's `src` is its full-size WebP on `files.xaxis.app` (`…@.webp`); `shared/image.ts` turns it into a sized variant (`…@w<width>.webp`), and `app/AssetImage.tsx` renders it with snapped widths.
- **Storage helpers**: `@upstash/redis` and `@aws-sdk/client-s3` are unused and retire after cutover.
- **Route groups**:
  - `app/(detailed)/` — the main gallery experience with filtering, navigation, and an expanded work modal.
  - `app/(slideshow)/` — slideshow/grid presentation.
  - `app/api/` — `og` (OpenGraph image generation, converting xaxis's WebP to JPEG with `sharp` because Satori can't decode WebP), `revalidate` (xaxis's signed webhook, which revalidates `cms-content`) and `revalidate/[tag]` (crow's hook, until crow retires).
- **Shared logic**: `shared/` holds the CMS client, asset/tag/collection types, metadata helpers, query parsing, and small utilities. Frontend code should read from `shared/` rather than reimplementing fetches.

## Environment

Required env vars:
- `XAXIS_WORKS_URL` — the works endpoint (`shared/cms.ts`); `https://www.xaxis.app/ws/alikro-art/api/works` in production. Use `www`: the apex redirects there, and `fetch` drops `Authorization` on a cross-origin redirect.
- `XAXIS_SITE_KEY` — bearer secret for that endpoint, minted on `keys/site` in `alikro-art`.
- `XAXIS_WEBHOOK_SECRET` — the secret of the `hooks/site` webhook, which signs its POSTs to `/api/revalidate`.
- `NEXT_PUBLIC_XAXIS_URL` — xaxis's base URL for edit links (`shared/href.ts`); `https://www.xaxis.app`.

The build prerenders pages from the works endpoint, and `shared/cms.ts` throws when `XAXIS_WORKS_URL` or `XAXIS_SITE_KEY` is unset or the fetch fails, so `npm run build` fails without them, locally too: set both in `.env.local`. This is deliberate: a failed build keeps the previous deployment live, where an empty answer would prerender and cache an empty site.

Retiring after cutover: `NEXT_PUBLIC_CROW_CMS` and `CROW_CMS_SECRET_KEY` (used only by `/api/revalidate/[tag]` now), and `NEXT_PUBLIC_IMG_BASE` (unused).

## Related projects

- `../xaxis` — the CMS. The site reads `api/works` in the `alikro-art` workspace, edit links open its objects, and its `hooks/site` webhook posts to `/api/revalidate` after every commit. When touching the read path, the image URL grammar, the webhook route or the edit links, check `../xaxis` and the objects in `alikro-art`.
- `../crow-cms` — the previous CMS, retiring after about two weeks of stable running on xaxis. Until then its hook still calls `/api/revalidate/[tag]`, so coordinate with `../crow-cms/CLAUDE.md` before touching that route.
