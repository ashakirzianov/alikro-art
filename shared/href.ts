export function hrefForSlideshow() {
    return '/'
}

export function hrefForAbout() {
    return '/about'
}

export function hrefForAsset({ pathname, assetId }: {
    pathname?: string,
    assetId: string,
}) {
    return `${pathname ?? '/all'}/${assetId}`
}

export function hrefForAssetModal({ pathname, assetId, includeHash }: {
    pathname: string,
    assetId: string,
    includeHash?: boolean,
}) {
    return `${pathname}?show=${assetId}${includeHash ? '#' + assetId : ''}`
}

export function hrefForAll({ by }: {
    by?: 'collection' | 'tag' | 'year' | 'material',
}) {
    return by ? `/all?by=${by}` : '/all'
}

export function hrefForCollection({ collectionId }: {
    collectionId: string,
}) {
    return `/${collectionId}`
}

export function hrefForYear({ year }: {
    year: number | undefined,
}) {
    return `/year/${year ?? 'unknown'}`
}

export function hrefForTag({ tag }: {
    tag: string,
}) {
    return `/tag/${encodeURIComponent(tag)}`
}

export function hrefForMaterial({ material }: {
    material: string | undefined,
}) {
    return `/material/${encodeURIComponent(material ?? 'unspecified')}`
}

// The work's object in xaxis, or the works folder without one
export function hrefForConsole({ assetId }: {
    assetId?: string,
} = {}): string {
    const base = process.env.NEXT_PUBLIC_XAXIS_URL
    return assetId
        ? `${base}/o/alikro-art:works/${assetId}`
        : `${base}/ws/alikro-art/p/works`
}
