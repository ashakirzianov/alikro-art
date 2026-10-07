# Moving alikro.art from crow-cms to xaxis

Plan for `alikro-art/migrate-to-xaxis-cms`, 2026-10-07. For Anton's review; no site code changes until it is ruled on. xaxis side: production at `46b7c5e`; gap list in `xaxis/alikro-art-cms`.

## 0. First: the corpus is 2.4× the storage cap

Measured 2026-10-07 from crow's live metadata (`GET /api/projects/alikro/metadata`) and the S3 listing of `crow-cms/alikro/originals/` (sizes from `ListObjectsV2`, so no HEAD requests were needed). Every live work has its original in S3.

| | Live (today) | February backup (`assets.json`) | xaxis default |
|---|---|---|---|
| Works | 639 | 523 | — |
| Originals, total | **1,254 MB (1,196 MiB)** | 949 MB | **500 MiB per owner** |
| Largest file | 10.4 MB (`Flower_5.png`) | 10.4 MB | 25 MiB per file |

- **The per-file limit is fine. The per-owner limit is exceeded 2.4×.** The corpus grew about 300 MB in eight months. Skipping the tattoos (53 works, 189 MB, which the site hides) still leaves 1,065 MB. Only originals count: xaxis does not count variants.
- **`assets.json` is stale.** The import reads crow live, not the backup.
- This is Anton's and the xaxis track's call (Q1). `file-limits` already provides a per-user override row for "real portfolios". Nothing below works around the cap.

Other findings from the live data:

- **2 TIFFs** (`broken-vessel`, `a-cup`): xaxis does not detect TIFF as an image, so they would get no variants (Q4).
- **1 id breaks the name grammar**: `plate-with-the--dog` (xaxis allows only single hyphens) (Q5).
- **1 GIF** (`gay-love-1`): fine, because xaxis keeps animation in its variants.
- 494 of the 639 works are narrower than 1920 px. When the loader asks for a variant wider than the original, xaxis serves it at the original width without enlarging, so the loader's widths work as they are.

## 1. Target content model

Workspace `alikro` (Q2). There is one file object per work, at `works/<id>`, and its content is the file pointer.

| crow field | xaxis | Notes |
|---|---|---|
| `id` | name `works/<id>` | Unchanged, except `works/plate-with-the-dog` (Q5). |
| `fileName` | the pointer's `file-name` | Kept by the upload. The site stops using it and builds URLs from `src` (below). |
| `width`, `height` | the pointer's `width`, `height` | Read from the bytes. The import checks them against crow's values (EXIF rotation could swap them). |
| `uploaded` (ms) | `uploaded-number` (ms epoch) | Not `-date`: dates are day-precision, and every live work shares an upload day with another, so `sortAssets`' tie-break would change. |
| `order` | `order-number` | 638 of 639 works have it. Fractional values exist (2.5, 3.5), and number covers them. |
| `kind` | `kind` | Values stay as they are, including `tattoo` and `hidden`. |
| `title` | `xaxis-title` | All 639 works have one. |
| `year` | `year-number` | |
| `material` | `material` | |
| `tags` | `tags-list` | 440 works have tags. |
| `kind: "unpublished"` | absence of `xaxis-public-flag` | The flag is the publish state, and it also retracts the image. A new upload in xaxis starts unflagged, which matches crow's default. No live work is `unpublished` today. |

**The read:** `api/works` is a function with `xaxis-api-path: works` and `xaxis-api-key-ref: keys/site`, called with `GET`. It returns the flagged works as `{id, src, width, height, uploaded, order, kind, title, year, material, tags}`, where `src` is `(file-url name)`, the full-size `…@.webp` URL. Anton locks it, so agents cannot change the site's contract (it has a key, so locking does not make it public). A new work without `uploaded-number` comes back with `uploaded: null`, and the site sorts it as newest.

## 2. The import

- **Script:** `scripts/import-to-xaxis.mjs` in this repo, one-off, deleted at retirement. It reads crow's live metadata, gets each original from S3 with crow's read credentials, and follows the cookbook's "Bulk import": `upload-file`, then the PUT, then `finish-upload`, then `mutate` with about 50 `create!`s per commit.
- **Key:** `keys/import` in `alikro`, a text key with `xaxis-api-key-mcp-flag`, created by an agent. Anton locks it and mints a secret on its page, and the script reads the secret from `XAXIS_IMPORT_KEY`. The endpoint is `https://xaxis.app/ws/alikro/api/mcp`. The key is deleted after cutover, which revokes it.
- **Idempotency:** for each work, the script hashes the bytes locally and reads `works/<id>`.
  - Missing: upload and create.
  - Same `sha256`: `update!` only the properties that differ.
  - Different `sha256`: `set-content!` with the new file.
  - A second run is a no-op, and it doubles as the delta sync before cutover.
  - Works in xaxis but not in crow are reported, and deleted only with `--apply-deletes`.
  - A failed batch writes nothing, and the script resumes where it stopped (`duplicate` covers bytes that were already uploaded).
- **Rehearsal:** a throwaway workspace, `alikro-rehearsal`, with about 40 works chosen for edge cases: the largest files, both TIFFs, the GIF, `plate-with-the--dog`, the work without `order`, works without tags, and a few JPEGs with EXIF orientation. It is a subset because the rehearsal counts against the same owner's cap. The script runs there twice (the second run must change nothing), `npm run dev` runs against it, then the workspace is deleted.
- **Verification** after the full import:
  - 639 objects.
  - A property-by-property diff against crow comes out empty.
  - Every `src` answers 200 at `@w640.webp`.

## 3. Site changes

Five units, one commit each, each with `npm run build` passing. All of them land on one branch and are seen on a Vercel preview that has the xaxis env vars.

**U1. Read path.** In `shared/cms.ts`, `fetchAllAssetMetadata` calls `GET XAXIS_WORKS_URL` with `XAXIS_SITE_KEY` and converts `null` to `undefined` at the boundary. The unused `fetchAssetMetadata` goes. In `AssetMetadata`, `fileName` becomes `src`. The cache tag `crow-content` becomes `cms-content`.
- *Stays:* `metadataStore.ts` caching, queries, collections, the tattoo filter.
- *Verify:* a script compares, per collection and tag page, the ordered ids from crow and from xaxis; they must be identical.

**U2. Image loader and URL grammar.** In `shared/image.ts`, `imageSrc({src, width})` swaps `@.webp` for `@w<width>.webp`. `quality`, `format` and `NEXT_PUBLIC_IMG_BASE` go.
- *Stays:* `AssetImage`'s snap widths (all on xaxis's list).
- *Verify:* every image request on the preview is a 200 WebP from `files.xaxis.app`, and pages look the same as production side by side.

**U3. OG route.** In `app/api/og`, the computed width snaps up to the next listed width, the route fetches the WebP, converts it to JPEG with `sharp` and inlines it as a data URI (Satori cannot decode WebP). `sharp` becomes an explicit dependency; it is already installed through Next.
- *Stays:* layout, `maxDuration`, cache headers.
- *Verify:* `/api/og/all`, `/paintings` and `/tag/Self-portrait` render on the preview. Cold render times are compared against the 8–16 s baseline in `alikro-art/og-cold-render-latency`; pre-warming stays that issue's job.

**U4. Revalidation.** A new `app/api/revalidate/route.ts` accepts a POST, checks `X-Xaxis-Signature` (an HMAC-SHA256 of the body, compared in constant time) against `XAXIS_WEBHOOK_SECRET`, and calls `revalidateTag('cms-content', 'max')`. The webhook `hooks/site` posts to **`https://www.alikro.art/api/revalidate`**: the apex 307-redirects there, and webhooks do not follow redirects. Anton locks it and mints its secret.
- *Stays:* the old `[tag]` route, until retirement.
- *Verify:* "Send now" returns 200; a bad signature returns 401; a title edited in xaxis shows on the site after a reload.

**U5. Edit links.** `hrefForConsole` points to the object page, `https://xaxis.app/o/alikro:works/<id>`. The console's "Open Editor" opens the `works/` folder (`/ws/alikro/p/works`), or a masonry preview page once one exists. crow's `filter` parameter has no equivalent and is dropped. A new env var, `NEXT_PUBLIC_XAXIS_URL`, replaces `NEXT_PUBLIC_CROW_CMS` here.
- *Verify:* edit links on the preview open the right object.

**U6. Docs.** Update `CLAUDE.md` (architecture, env, related projects). Start `DECISIONS.md` with entries for:
- xaxis as the content source
- `uploaded-number` over `-date`
- the OG WebP-to-JPEG conversion
- the `www` webhook host

## 4. Cutover

1. **Rulings:** Anton and the xaxis track rule on the questions in §5; the cap is raised (Q1).
2. **Setup:**
   - An agent creates `keys/import`, `keys/site`, `api/works` and `hooks/site`.
   - In the browser: the keys and the endpoint are locked, the import key and the site key are minted, and the webhook is locked and its secret minted (who does what: Q2).
3. **Import:** rehearsal, then the full import into `alikro`, then verification (§2).
4. **Parallel run:** U1–U6 go on a branch with a Vercel preview reading xaxis, while production stays on crow. Alina keeps editing in crow, and re-running the importer keeps xaxis in step.
5. **Freeze:** Alina stops editing in crow. A final importer run follows, and the diff must be empty.
6. **Switch:** production env vars are set, then Anton merges and pushes. Then "Send now" on the webhook, pre-warm the OG URLs, and Alina edits in xaxis from then on.

**Rollback:** Vercel's instant rollback to the last crow deployment. crow is untouched and its hook still fires. Edits Alina made in xaxis after the switch would have to be re-entered in crow, so the rollback window is kept short (about a week).

**Retires after about two weeks of stable running:**
- this repo:
  - the `NEXT_PUBLIC_CROW_CMS`, `CROW_CMS_SECRET_KEY` and `NEXT_PUBLIC_IMG_BASE` env vars
  - `app/api/revalidate/[tag]`
  - `assets.json`, the import script, the `unpublished` filters
  - the unused `@aws-sdk/client-s3` and `@upstash/redis` dependencies
- xaxis: `keys/import`
- crow: `revalidateTagHook` and `ALIKRO_SECRET_KEY`, through `axis/retire-crow-cms-track`
- later, with crow itself: `img.alikro.art` and the S3 bucket (Q6)

## 5. Open questions

1. **The storage cap.** Recommend a `user_limits` row of 3 GiB for the workspace owner: 2.5× today's corpus, room for growth and for `andjan-art` if it shares an owner. The alternatives were importing a subset (still over) and re-encoding originals (lossy, and it changes the artist's files). This needs the xaxis track.
2. **Workspace name and owner.** Recommend `alikro`, owned by Alina:
   - the cap and the art sit with the artist;
   - she mints `keys/site`, so the site key carries only her reach, not Anton's (see `api-key-permissions`);
   - Anton, as a writer, mints the temporary `keys/import`.
3. **Tattoos (53 works, 189 MB).** Recommend importing them **unflagged**: kept in the CMS, absent from the endpoint, and the site's tattoo filter retires. The alternative is to flag them and keep the code filter, which matches today's behaviour but publishes their images by URL.
4. **The 2 TIFFs.** Recommend converting them to PNG at import (lossless). The alternative is to have Alina re-export them.
5. **`plate-with-the--dog`.** Recommend renaming it to `plate-with-the-dog`, plus a one-line redirect in `next.config.js` so that old links keep working.
6. **Old image URLs (`img.alikro.art`).** These are linked from outside (Pinterest, search). Recommend keeping CloudFront and S3 for about three months after cutover, then retiring them with crow.
7. **Adding new works.** In xaxis, Alina uploads a file and sets `kind`, `year-number`, `material` and the rest by hand on the object page. Recommend accepting that for cutover and filing a follow-up for an `add-work` tool or agent flow that fills in the defaults and `uploaded-number`. Is that acceptable to Alina?
