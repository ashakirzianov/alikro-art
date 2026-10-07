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
        if (a.order !== b.order) {
            return (a.order ?? 0) - (b.order ?? 0)
        } else if (a.uploaded !== b.uploaded) {
            return b.uploaded - a.uploaded
        } else {
            return 0
        }
    })
}