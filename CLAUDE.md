# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`alikro` is a Next.js art portfolio site for the artist "alikro". It reads asset metadata and images from the separate `crow-cms` project via its HTTP API (see `shared/cms.ts`). The CMS base URL is configured via `NEXT_PUBLIC_CROW_CMS` and an auth secret via `CROW_CMS_SECRET_KEY`.

The project is small, so the workflow here is lighter than in the more structured repos: dedicated `docs/` and `tasks/` folders aren't required, but they (or ad-hoc top-level `.md` files) are fine when they actually help.

## Collaboration Workflow

### Documentation Organization
- `CLAUDE.md` — conventions and guidance for Claude Code (this file).
- **Tasks, issues and ideas live in Linear, not in this repo** — see *Task tracking* below. `IDEAS.md` still exists as the migration's rollback and is **retired, not authoritative**; do not capture to it.
- `SCRATCHPAD.md` — untracked scratch space for drafting prompts and half-formed ideas. Do not act on its contents unless explicitly asked.
- No `docs/` or `tasks/` folder is set up by default — most work is driven directly from prompts and doesn't need a persistent artifact. If a design doc or task list becomes genuinely useful, it's fine to add one: prefer a top-level `.md` (e.g. `tasks-<topic>.md`, `design-<topic>.md`) until there are enough to justify a folder.

### Task tracking

Work is usually driven through direct prompts. What must survive the session goes to **Linear**, not to a file here. The rule, stated once:

**One project per track, and the project name *is* the track name.** There is no stored track→project mapping — not here, not in the axis track index. Duplicating the mapping is what would let it drift; stating the rule is what prevents that. To find this track's work, look for the project named after the track.

**Labels:** `startable` (an agent can begin now — no gate, no unmet dependency), `blocked-on-user` (needs the user specifically), `parked-until-graduates` (held deliberately, not scheduled — where medium-to-long-term ideas go).

`startable` is a readiness marking, **not** a grant of authority to execute unasked — see *Task Management* below.

A per-effort implementation plan is still welcome as a local `.md` when an effort is large enough to need one — a plan is read as a document, not a queue. Linear tracks the effort.

**What does NOT go to Linear.** Durable records stay in the repo, and getting this wrong is how the tracker fills with things nobody can close:

| Class | Test | Home |
|---|---|---|
| **TASK** | Open, future-facing. Someone must do something. | Linear |
| **RECORD** | Past-facing — diagnosis, measurement, ruling, as-built. Value is being read later. | A top-level `.md` here (see *Documentation Organization*) |
| **HYBRID** | Open task whose body is mostly record. | Both; the issue links to the doc |
| **STANDING NOTE** | Neither past nor actionable — a caution that stays true and an agent needs *while working*. | This file, or a doc `.md`. **Never Linear** |

### Task Management
- Work is usually driven through direct prompts.
- Persistent task `.md` files aren't required, but they're welcome when an effort is large enough that tracking it across sessions helps. When one exists, treat its tasks as pre-approved unless stated otherwise.
- **Pre-approval carries to Linear issues labeled `startable`** (only Anton applies that label) — decided 2026-09-01 (ASH-168). Issues without the label: present an approach first.

### Planning & Scope
- For small, well-scoped changes, just do it — no upfront planning needed unless requested.
- For larger or more complex features, design first: sketch the approach, lay out options with tradeoffs, and agree on direction before implementing. When the feature is substantial enough to benefit from a written record, a short top-level design `.md` is a good place for it.
- Ask about ambiguity rather than guessing.
- For non-trivial design decisions (type restructuring, naming, API shape), engage in discussion before implementing. Present concrete options with tradeoffs and a recommendation, but let the user choose.

### Code Changes
- **Review posture: owned.** The user reviews changes before they land.
- Small incremental commits.
- The user makes all commits — do NOT commit unless explicitly asked.
- Propose a commit message after each change.
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
- **Content source**: All asset metadata comes from `crow-cms` via `shared/cms.ts`. Images are served by the CMS (S3-backed) and rendered through `app/AssetImage.tsx`.
- **Storage helpers**: `@upstash/redis` and `@aws-sdk/client-s3` are present for any direct access that bypasses the CMS when needed.
- **Route groups**:
  - `app/(detailed)/` — the main gallery experience with filtering, navigation, and an expanded work modal.
  - `app/(slideshow)/` — slideshow/grid presentation.
  - `app/api/` — `og` (OpenGraph image generation) and `revalidate` (cache revalidation hook called by the CMS when content changes).
- **Shared logic**: `shared/` holds the CMS client, asset/tag/collection types, metadata helpers, query parsing, and small utilities. Frontend code should read from `shared/` rather than reimplementing fetches.

## Environment

Required env vars (see `shared/cms.ts`):
- `NEXT_PUBLIC_CROW_CMS` — base URL of the `crow-cms` instance.
- `CROW_CMS_SECRET_KEY` — bearer token for authenticated CMS requests.

## Related projects

- `../crow-cms` — the CMS backend that serves this site's content. All asset metadata and images flow from there through `shared/cms.ts`. The CMS also calls this repo's `/api/revalidate/[tag]` endpoint when content changes, so when touching that endpoint or the CMS client, check `../crow-cms/CLAUDE.md` and coordinate.
