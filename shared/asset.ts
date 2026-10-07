export type Timestamp = number
export type AssetMetadata = {
    id: string,
    src: string,
    width?: number,
    height?: number,
    uploaded: Timestamp,
    order?: number,
    kind?: string,
    title?: string,
    year?: number,
    material?: string,
    tags?: string[],
}
export type AssetMetadataUpdate = Omit<
    AssetMetadata,
    'src' | 'width' | 'height' | 'uploaded'
>

export type AssetKind = string
export type AssetTag = string

export type AssetSize = `${number}x${number}`

export function assetMetadataUpdate(asset: AssetMetadata): AssetMetadataUpdate {
    const { width, height, uploaded, src, ...update } = asset
    return update
}

export function assetSrc(asset: AssetMetadata) {
    return asset.src
}

export function assetAlt(asset: AssetMetadata) {
    return `${asset.title} (${asset.year})`
}

export function assetWidth(asset: AssetMetadata) {
    return asset.width ?? 300
}

export function assetHeight(asset: AssetMetadata) {
    return asset.height ?? 300
}

export function assetDescription(asset: AssetMetadata) {
    return `${asset.title ?? 'Untitled'} (${asset.year ?? 'year unknown'}), ${asset.material ?? 'unspecified material'}`
}

export function sortAssets(assets: AssetMetadata[]) {
    return [...assets].sort((a, b) => {
        // Compare the defaulted orders: comparing the raw ones made a missing order tie
        // with 0 without the upload-time tie-break, an inconsistent comparator whose
        // result depended on the order the CMS returned works in
        const aOrder = a.order ?? 0
        const bOrder = b.order ?? 0
        if (aOrder !== bOrder) {
            return aOrder - bOrder
        } else if (a.uploaded !== b.uploaded) {
            return b.uploaded - a.uploaded
        } else {
            return 0
        }
    })
}