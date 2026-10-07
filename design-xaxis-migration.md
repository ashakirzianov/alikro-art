# Moving alikro.art from crow-cms to xaxis

Plan for `alikro-art/migrate-to-xaxis-cms`. Drafted 2026-10-07; Anton's first review ruled on most questions the same day. xaxis side: production at `46b7c5e`, gap list in `xaxis/alikro-art-cms`. No site code changes until the remaining points (§5) are settled.

## 0. The corpus

Measured 2026-10-07 from crow's live metadata (`GET /api/projects/alikro/metadata`) and the S3 listing of `crow-cms/alikro/originals/`. Every live work has its original in S3.

| | Live | February backup (`assets.json`) | xaxis limit |
|---|---|---|---|
| Works | 639 | 523 | — |
| Originals, total | 1,254 MB (1,196 MiB) | 949 MB **500 MiB per workspace owner: exceeded 2.4×**. Production's `user_limits` is empty (xaxis lead, 2026-10-07) |
| Largest file | 10.4 MB (`Flower_5.png`) | 10.4 MB | 25 MiB per file |

- **The limit must be raised before the import.** It is an `INSERT INTO user_limits` on production for the account that owns `alikro-art`. That write is Anton's; there is no tool or UI for it (§5).
- `assets.json` is stale, so the import reads crow live.
- **2 TIFFs** (`broken-vessel`, `a-cup`, ceramics uploaded March 2026). Crow accepts `.tif`/`.tiff` and serves WebP variants of them. xaxis treats TIFF as a plain file, with no reason recorded; its `sharp` decodes TIFF. The xaxis lead ruled it an omission: `xaxis/tiff-images`, urgent, blocks the migration.
- **1 id breaks xaxis's name grammar**: `plate-with-the--dog` becomes `plate-with-the-dog`, with no redirect (ruled).
- **1 GIF** (`gay-love-1`): fine, because xaxis keeps the animation in its variants.
- 494 works are narrower than 1920 px. xaxis serves a wider request at the original width without enlarging, so the loader's widths stand.

## 1. Target content model

Workspace **`alikro-art`**, owned by Anton for now (ruled; `alikro` is Alina's default workspace, owned by her account). It does not exist yet, and which of Anton's two accounts owns it is open (§5). There is one file object per work, at `works/<id>`, and its content is the file pointer.

| crow field | xaxis | Notes |
|---|---|---|
| `id` | name `works/<id>` | |
| `fileName` | the pointer's `file-name` | The site stops using it and builds URLs from `src`. |
| `width`, `height` | the pointer's `width`, `height` | Read from the bytes. The import checks them against crow's values (EXIF rotation could swap them). |
| `uploaded` (ms) | a time property, shape pending `xaxis/time-property` | Dates are day-precision, and every live work shares an upload day with another, so a `-date` would change the sort. `xaxis/time-property` (urgent, needs design) blocks the migration: a `-time` suffix, or `-date` widened to carry a time. |
| `order` | `order-number` | 638 of 639 works have it; fractional values exist. |
| `kind` | `kind` | Values stay, including `tattoo` and `hidden`. |
| `title` | `xaxis-title` | All 639 have one. |
| `year` | `year-number` | |
| `material` | `material` | |
| `tags` | `tags-list` | 440 works have tags. |
| `kind: "unpublished"` | absence of **`public-flag`** | Our own property (§5). |
| — | `xaxis-public-flag` on every work | xaxis's file-publishing switch: without it a file has no public image URL. |

**Publish state.** Two separate facts:
- **`public-flag`** (ours) means the work is released. It is absent while a new upload awaits review, so the review list is "works without `public-flag`".
- **`xaxis-public-flag`** (xaxis's) means its image is served by the CDN.

The import sets both on all 639 works, tattoos and the two `hidden` works included. Tattoos stay out of the review list, and the site keeps hiding them by kind in code. Exposing their image URLs is fine (ruled).

**The read:** `api/works` is a function with `xaxis-api-path: works` and `xaxis-api-key-ref: keys/site`, called with `GET`, and Anton locks it. It returns the works with `public-flag` as `{id, src, width, height, uploaded, order, kind, title, year, material, tags}`, where `src` is `(file-url name)`, the full-size `…@.webp` URL. A work with `public-flag` but no `xaxis-public-flag` has `src: null`, and the site drops it.

## 2. The import

- **Script:** `scripts/import-to-xaxis.mjs`, one-off, deleted at retirement. It reads crow's live metadata, gets each original from S3 with crow's read credentials, and follows the cookbook's "Bulk import": `upload-file`, then the PUT, then `finish-upload`, then `mutate` with about 50 `create!`s per commit.
- **Key:** `keys/import` in `alikro-art`, a text key with `xaxis-api-key-mcp-flag`. Anton locks it and mints a secret on its page, and the script reads the secret from `XAXIS_IMPORT_KEY`. The endpoint is `https://xaxis.app/ws/alikro-art/api/mcp`. The key is deleted after cutover.
- **Idempotency:** for each work, the script hashes the bytes locally and reads `works/<id>`.
  - Missing: upload and create.
  - Same `sha256`: `update!` only the properties that differ.
  - Different `sha256`: `set-content!` with the new file.
  - A second run is a no-op, and it doubles as the delta sync before cutover.
  - Works in xaxis but not in crow are reported, and deleted only with `--apply-deletes`.
- **Rehearsal:** a throwaway workspace, `alikro-art-rehearsal`, with about 40 works chosen for edge cases: the largest files, the TIFFs, the GIF, `plate-with-the--dog`, the work without `order`, works without tags, and EXIF-rotated JPEGs. The script runs there twice (the second run must change nothing) and `npm run dev` runs against it. Then the workspace is deleted. The full import into `alikro-art` is itself staged, since the site isn't switched yet.
- **Verification** after the full import:
  - 639 objects.
  - A property-by-property diff against crow comes out empty.
  - Every `src` answers 200 at `@w640.webp`.

## 3. Site changes

All site work happens **on a branch in its own worktree, never on `main`**, and is seen on that branch's Vercel preview, which has the xaxis env vars. Each unit is one commit, with `npm run build` passing.

**U1. Read path.** In `shared/cms.ts`, `fetchAllAssetMetadata` calls `GET XAXIS_WORKS_URL` with `XAXIS_SITE_KEY` and converts `null` to `undefined` at the boundary. The unused `fetchAssetMetadata` goes. In `AssetMetadata`, `fileName` becomes `src`. The cache tag `crow-content` becomes `cms-content`. The `unpublished` filters go, because the endpoint returns released works only.
- *Stays:* caching in `metadataStore.ts`, queries, collections, the tattoo filter.
- *Verify:* a script compares the ordered ids per collection and tag page from crow and from xaxis; they must be identical.

**U2. Image loader and URL grammar.** In `shared/image.ts`, `imageSrc({src, width})` swaps `@.webp` for `@w<width>.webp`. `quality`, `format` and `NEXT_PUBLIC_IMG_BASE` go.
- *Stays:* `AssetImage`'s snap widths.
- *Verify:* every image on the preview is a 200 WebP from `files.xaxis.app`, and pages match production side by side.

**U3. OG route.** The computed width snaps up to the next listed width, the route fetches the WebP, converts it to JPEG with `sharp` and inlines it as a data URI (Satori cannot decode WebP). `sharp` becomes an explicit dependency.
- *Stays:* layout, `maxDuration`, cache headers.
- *Verify:* `/api/og/all`, `/paintings` and `/tag/Self-portrait` render on the preview. Cold render times are compared against the 8–16 s baseline in `alikro-art/og-cold-render-latency`.

**U4. Revalidation.** A new `app/api/revalidate/route.ts` accepts a POST, checks `X-Xaxis-Signature` (an HMAC-SHA256 of the body, compared in constant time) against `XAXIS_WEBHOOK_SECRET`, and calls `revalidateTag('cms-content', 'max')`. The webhook `hooks/site` posts to **`https://www.alikro.art/api/revalidate`**: the apex 307-redirects there, and webhooks don't follow redirects.
- *Stays:* the old `[tag]` route, until retirement.
- *Verify:* "Send now" returns 200; a bad signature returns 401; an edit in xaxis shows on the site after a reload.

**U5. Edit links.** `hrefForConsole` points to `https://xaxis.app/o/alikro-art:works/<id>`. The console's "Open Editor" opens the `works/` folder (`/ws/alikro-art/p/works`). crow's `filter` parameter is dropped. `NEXT_PUBLIC_XAXIS_URL` replaces `NEXT_PUBLIC_CROW_CMS` here.
- *Verify:* edit links on the preview open the right object.

**U6. Docs.** Update `CLAUDE.md` (architecture, env, related projects). Start `DECISIONS.md` with entries for:
- xaxis as the content source
- `public-flag` as the release state
- the `uploaded` time property
- the OG WebP-to-JPEG conversion
- the `www` webhook host

## 4. Cutover

1. **Prerequisites:** `xaxis/time-property` and `xaxis/tiff-images` closed; `alikro-art` created under the chosen account; that account's `user_limits` row inserted.
2. **Setup:**
   - An agent creates `keys/import`, `keys/site`, `api/works` and `hooks/site` in `alikro-art`.
   - Anton locks them in the browser and mints the secrets.
3. **Import:** rehearsal, then the full import, then verification (§2).
4. **Parallel run:** U1–U6 on the branch's preview reading xaxis, while production stays on crow. Alina keeps editing in crow, and re-running the importer keeps xaxis in step.
5. **Freeze:** Alina stops editing in crow. A final importer run follows, and the diff must be empty.
6. **Switch:** production env vars are set, and Anton merges and pushes. Then "Send now" on the webhook, pre-warm the OG URLs, and Alina edits in xaxis from then on. Anton works out the editing UX with Alina directly.

**Rollback:** Vercel's instant rollback to the last crow deployment. crow is untouched and its hook still fires. Edits made in xaxis after the switch would have to be re-entered in crow, so the rollback window is short (about a week).

**Retires after about two weeks of stable running:**
- this repo:
  - the `NEXT_PUBLIC_CROW_CMS`, `CROW_CMS_SECRET_KEY` and `NEXT_PUBLIC_IMG_BASE` env vars
  - `app/api/revalidate/[tag]`
  - `assets.json` and the import script
  - the unused `@aws-sdk/client-s3` and `@upstash/redis` dependencies
- xaxis: `keys/import`
- crow: `revalidateTagHook` and `ALIKRO_SECRET_KEY`, through `axis/retire-crow-cms-track`
- `img.alikro.art` and the S3 bucket stay up **one month** after cutover for outside links (ruled), then retire with crow.

## 5. Open

1. **Which account owns `alikro-art`, and its limit.** Anton has two accounts: `ashakirzianov@icloud.com`, which owns the `ashakirzianov` workspace and is the one agents connect as, and `shakirzyanov@gmail.com`. Recommend the iCloud account, so the import and the agents work against Anton's usual identity, with a `user_limits` row of 10 GB storage and the default 25 MB per file. That fits this corpus (1.2 GiB) and its growth, plus `andjan-art` if it lands under the same owner. The insert is Anton's.
2. **`public-flag`:** the name is Anton's. It is our own release state, separate from `xaxis-public-flag` (§1). Settled unless Anton prefers `published-flag` to keep it visibly apart from xaxis's flag.

Blocked on xaxis, owned by the xaxis lead and set as blockers of `alikro-art/migrate-to-xaxis-cms`:
- `xaxis/time-property` (urgent, needs design)
- `xaxis/tiff-images` (urgent, small)
