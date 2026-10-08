# Decisions

## Content

### content-source

**The site reads its works from the `alikro-art` workspace in xaxis, not from crow-cms.** 2026-10-07. crow-cms is retiring, and xaxis now covers what the site needs from it: typed metadata, image variants on a CDN, a keyed read endpoint (`api/works`) and signed webhooks. *Rejected:* staying on crow-cms. *See:* docs/xaxis-migration.md.

### release-state

**A work is released when it carries our own `published-flag`, kept apart from xaxis's `xaxis-public-flag`, which only decides whether its image is served.** 2026-10-07. They are separate facts: a new upload stays unreleased while it awaits review, so the review list is "works without `published-flag`", and `api/works` returns released works only. Tattoos carry both flags, which keeps them out of the review list, and the site hides them by kind in `shared/preprocess.ts`. *Rejected:* crow's `kind: "unpublished"`; `xaxis-public-flag` as the release state. *See:* docs/xaxis-migration.md.

### upload-time

**A work's upload time is `uploaded-time`, a time with milliseconds.** 2026-10-07. Works sort by `order`, then newest upload first, and every live work shares an upload day with another, so a day-precision date would reorder them. `api/works` returns it as an ISO 8601 string, and `shared/cms.ts` converts it to ms. *Rejected:* `uploaded-date`; an ms `uploaded-number`. *See:* docs/xaxis-migration.md.

## Revalidation

### webhook-host

**xaxis's `hooks/site` webhook posts to `https://www.alikro.art/api/revalidate`.** 2026-10-07. The apex `alikro.art` 307-redirects to `www`, and xaxis webhooks don't follow redirects, so a POST to the apex never reaches the route. *Rejected:* `https://alikro.art/api/revalidate`. *See:* docs/xaxis-migration.md.
