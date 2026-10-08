# alikro-art

Alina's ("alikro") art portfolio site, alikro.art: a Next.js app that reads its works from the `alikro-art` workspace in xaxis, through that workspace's `api/works` endpoint (`shared/cms.ts`), and shows their images from xaxis's CDN. It moved there from crow-cms; see `docs/xaxis-migration.md`.

## Documentation layout

- `TRACK.md` — which track this repo belongs to, and its slug.
- `DECISIONS.md` — the decision log: decisions in force, with their reasons. Read it before changing the content model, the webhook or the read path.
- `docs/` — designs and records. `docs/xaxis-migration.md` is the migration effort, open until crow retires.
- `SCRATCHPAD.md` — when present, Anton's untracked drafting space; never open it without an explicit ask.
- `archive/` — when present, finished efforts moved out of `docs/`.

## Review posture

**High-level.** Anton reviews design and interfaces — the content model, the read path, the webhook, the public URLs — not implementation. Agents commit on their own, one logical unit each, staging only the files they touched, and surface the design deltas they introduce rather than landing them silently. (Set by Anton 2026-10-08, replacing *owned*.)

**Pushing is Anton's call: a push to `main` deploys alikro.art.** Do not push unless explicitly asked.

## Build and commands

Run `npm run build` after a change and fix any errors before presenting the work as done. The build prerenders pages from the works endpoint, and `shared/cms.ts` throws when `XAXIS_WORKS_URL` or `XAXIS_SITE_KEY` is unset or the fetch fails, so the build needs both in `.env.local`, locally too. This is deliberate: a failed build keeps the previous deployment live, where an empty answer would prerender and cache an empty site.

- `npm run dev` — development server.
- `npm run build`, `npm run start` — production build and server.
- `npm run lint` — broken since Next 16 removed `next lint`: `alikro-art/lint-script-broken`.

## Map

- **Stack**: Next.js 16 App Router, React 19, Tailwind v4.
- **Content**: all work metadata comes from xaxis's `api/works` via `shared/cms.ts`, which converts at the boundary (`null` to `undefined`, the ISO upload time to ms) and drops works without an image. The endpoint returns released works only; tattoos are released but hidden by kind in `shared/preprocess.ts`. `shared/metadataStore.ts` caches the read under the `cms-content` tag.
- **Images**: each work's `src` is its full-size WebP on `files.xaxis.app` (`…@.webp`); `shared/image.ts` turns it into a sized variant (`…@w<width>.webp`), and `app/AssetImage.tsx` renders it with snapped widths.
- **Routes**:
  - `app/(detailed)/` — the main gallery: filtering, navigation, and an expanded work modal.
  - `app/(slideshow)/` — slideshow and grid presentation.
  - `app/api/` — `og` (OpenGraph images), `revalidate` (xaxis's signed webhook, which revalidates `cms-content`) and `revalidate/[tag]` (crow's hook, until crow retires).
- **Shared logic**: `shared/` holds the CMS client, the work, tag and collection types, metadata helpers, query parsing and small utilities. Frontend code reads from `shared/` rather than reimplementing fetches.
- **Crow leftovers** retire with crow, listed in `alikro-art/retire-crow-after-cutover`: `app/api/revalidate/[tag]`, the `NEXT_PUBLIC_CROW_CMS`, `CROW_CMS_SECRET_KEY` and `NEXT_PUBLIC_IMG_BASE` env vars, `scripts/import-to-xaxis.mjs`, `assets.json`, and the unused `@aws-sdk/client-s3` and `@upstash/redis` dependencies. Don't build on them.

## Environment

- `XAXIS_WORKS_URL` — the works endpoint (`shared/cms.ts`): `https://www.xaxis.app/ws/alikro-art/api/works` in production. Use `www`: the apex redirects there, and `fetch` drops `Authorization` on a cross-origin redirect.
- `XAXIS_SITE_KEY` — the bearer secret for that endpoint, minted on `keys/site` in `alikro-art`.
- `XAXIS_WEBHOOK_SECRET` — the secret of the `hooks/site` webhook, which signs its POSTs to `/api/revalidate`.
- `NEXT_PUBLIC_XAXIS_URL` — xaxis's base URL for edit links (`shared/href.ts`): `https://www.xaxis.app`.

## Coding preferences

- Prefer `function name(...) { ... }` to `const name = (...) => { ... }`.
- Put private (non-exported) functions at the bottom of the file, after all exports.
- Inline prop and parameter types; extract a named type only when it is used in more than one place.
- Prefer `undefined` to `null` for absent values in app and shared code; convert at the boundaries where an external source returns `null`.
- Name boolean loading state `isLoading`, not `loading`.
- Add tests only when explicitly asked.

## CSS and styling

Tailwind v4 with PostCSS. Use only the colors defined in `app/globals.css` (e.g. `--color-primary`); they work as Tailwind classes (e.g. `text-dimmed`). A new color is defined in `globals.css` first, then used.

## Related projects

- `../xaxis` — the CMS. The site reads `api/works` in the `alikro-art` workspace, edit links open its objects, and its `hooks/site` webhook posts to `/api/revalidate` after every commit. When touching the read path, the image URL grammar, the webhook route or the edit links, check `../xaxis` and the objects in `alikro-art`.
- `../crow-cms` — the previous CMS, retiring after about two weeks of stable running on xaxis. Until then its hook still calls `/api/revalidate/[tag]`, so coordinate with `../crow-cms` before touching that route.
