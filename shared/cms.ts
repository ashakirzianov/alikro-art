import { AssetMetadata } from "./asset"

// Get all released works from xaxis
export async function fetchAllAssetMetadata(): Promise<AssetMetadata[]> {
    const url = process.env.XAXIS_WORKS_URL
    const key = process.env.XAXIS_SITE_KEY
    if (!url) {
        console.warn('XAXIS_WORKS_URL is not set, so there are no works to show')
        return []
    }
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}` },
    })
    if (!res.ok) {
        console.error(`Fetching works failed: ${res.status} ${res.statusText}`)
        return []
    }
    const works: Work[] = await res.json()
    return works.flatMap(work => {
        const asset = assetFromWork(work)
        return asset ? [asset] : []
    })
}

// The shape `api/works` answers with: absent values are `null`
type Work = {
    id: string,
    src: string | null,
    width: number | null,
    height: number | null,
    uploaded: string | null,
    order: number | null,
    kind: string | null,
    title: string | null,
    year: number | null,
    material: string | null,
    tags: string[] | null,
}

// A work without `src` has no public image, so the site cannot show it
function assetFromWork(work: Work): AssetMetadata | undefined {
    if (work.src === null) {
        return undefined
    }
    return {
        id: work.id,
        src: work.src,
        width: work.width ?? undefined,
        height: work.height ?? undefined,
        uploaded: timestampFromIso(work.uploaded),
        order: work.order ?? undefined,
        kind: work.kind ?? undefined,
        title: work.title ?? undefined,
        year: work.year ?? undefined,
        material: work.material ?? undefined,
        tags: work.tags ?? undefined,
    }
}

// A work without an upload time sorts as the newest
function timestampFromIso(iso: string | null): number {
    const timestamp = iso === null ? NaN : Date.parse(iso)
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}
