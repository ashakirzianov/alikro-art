---
track: alikro-art
workspace: aplusaequals
---

# alikro-art

Alina's ("alikro") art portfolio site, alikro.art: a Next.js app that reads its works from the `alikro-art` workspace in xaxis, through that workspace's `api/works` endpoint (`shared/cms.ts`), and shows their images from xaxis's CDN. It moved there from crow-cms; the migration is `alikro-art/xaxis-migration` in xaxis.

## Documentation layout

- The track's context lives in xaxis, in the `aplusaequals` workspace: `alikro-art/about` (`get-project`), the decision log `alikro-art/decisions`, and `alikro-art/xaxis-migration`, the migration effort, open until crow retires. Read the decision log before changing the content model, the webhook or the read path; this file cites its entries by slug, as in (`release-state`).
- `docs/` — when present, notes about working on this checkout.
- `SCRATCHPAD.md` — when present, Anton's untracked drafting space; never open it without an explicit ask.
- `archive/` — when present, finished efforts moved out of `docs/`.

## Review posture

**High-level.** Anton reviews design and interfaces — the content model, the read path, the webhook, the public URLs — not implementation. Agents commit on their own, one logical unit each, staging only the files they touched, and surface the design deltas they introduce rather than landing them silently. (Set by Anton 2026-10-08, replacing *owned*.)

**Agents push; the deploy is the promote.** A push to `main` builds a staged production deployment that serves nothing until promoted (`production-deploy`). Deploying is promoting it, with the dashboard's Promote or `vercel promote <url>`: Anton's call, or an agent's when he asks. Rollback is the same move. A promoted build serves the works it prerendered at build time until the next revalidation, so after a promote, revalidate if the works changed since the build: land a commit under `/alikro-art/`, which fires xaxis's hook, or POST to `/api/revalidate` with the hook's token. A change that carries a migration or schema change, if the repo ever has one, stays Anton's to push.

## Build and commands

Run `npm run build` after a change and fix any errors before presenting the work as done. The build prerenders pages from the works endpoint, and `shared/cms.ts` throws when `XAXIS_WORKS_URL` or `XAXIS_SITE_KEY` is unset or the fetch fails, so the build fails without both, locally too: set them in `.env.local`. This is deliberate: a failed build keeps the previous deployment live, where an empty answer would prerender and cache an empty site.

- `npm run dev` — development server.
- `npm run build`, `npm run start` — production build and server.
- `npm run lint` — broken since Next 16 removed `next lint`: `alikro-art/lint-script-broken`.

## Map

- **Stack**: Next.js 16 App Router, React 19, Tailwind v4.
- **Content**: `shared/cms.ts` reads xaxis's `api/works` (released works only) and converts `uploaded-time` to ms, keeping the milliseconds the sort needs (`upload-time`); `shared/preprocess.ts` hides tattoos by kind, since they are released (`release-state`); and `shared/metadataStore.ts` caches the read under the `cms-content` tag.
- **Images**: the endpoint answers each work's `src` from `imgUrl`, a full-size WebP on `img.xaxis.app`, served by the image bundle `works/.xaxis/img.xabundle`; `shared/image.ts` builds the sized variant URLs from it, and `app/AssetImage.tsx` renders them. A work whose image xaxis makes no variants of (no detected size, or past 50 megapixels) answers no `src`, and the site drops it.
- **Routes**:
  - `app/(detailed)/` — the main gallery: filtering, navigation, and an expanded work modal.
  - `app/(slideshow)/` — slideshow and grid presentation.
  - `app/api/` — `og` (OpenGraph images), `revalidate` (xaxis's hook, checked by its bearer token, which revalidates `cms-content`) and `revalidate/[tag]` (crow's hook, until crow retires).
- **Shared logic**: `shared/` holds the CMS client, the asset (work), tag and collection types, metadata helpers, query parsing and small utilities. Frontend code reads from `shared/` rather than reimplementing fetches.
- **Crow leftovers and dead code** retire with crow, listed in `alikro-art/retire-crow-after-cutover`: the `[tag]` revalidate route, the crow env vars, the import script and `assets.json`, the S3 and Redis dependencies, `WorkModalOld.tsx` and `app/(detailed)/common.ts`. Don't build on them.

## Environment

- `XAXIS_WORKS_URL` — the works endpoint (`shared/cms.ts`): `https://xaxis.app/api/alikro-art/works` in production. Use the apex: it is xaxis's canonical host, and `fetch` drops `Authorization` on a cross-origin redirect.
- `XAXIS_SITE_KEY` — the bearer secret for that endpoint: a credential of the principal `/alikro-art/keys/site.xabundle`.
- `XAXIS_WEBHOOK_SECRET` — the token xaxis's hook `alikro-art-site` sends as `Authorization: Bearer …` with its POSTs of `{ commit, paths }` to `https://www.alikro.art/api/revalidate`: the `www` host, since the hook doesn't follow the apex's redirect (`webhook-host`).
- `NEXT_PUBLIC_XAXIS_URL` — xaxis's base URL for edit links (`shared/href.ts`, `app/(detailed)/console/page.tsx`): `https://xaxis.app`.

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

- `../xaxis` — the CMS. The site reads `api/works` in the `alikro-art` workspace, edit links open its files' pages (`/b/alikro-art/works/…`), and its hook `alikro-art-site` posts to `/api/revalidate` after a landing under `/alikro-art/`. When touching the read path, the image URL grammar, the webhook route or the edit links, check `../xaxis` and the objects in `alikro-art`.
- `../crow-cms` — the previous CMS, retiring from about 2026-10-21. Until then its hook still calls `/api/revalidate/[tag]`, so coordinate with `../crow-cms` before touching that route.
