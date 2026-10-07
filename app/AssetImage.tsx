'use client'
import Image from "next/image"
import { AssetMetadata, assetAlt, assetHeight, assetWidth } from "../shared/asset"
import { imageSrc } from "../shared/image"

interface AssetImageProps {
    asset: AssetMetadata
    sizes?: string
    style?: React.CSSProperties
    loading?: 'lazy' | 'eager'
    priority?: boolean
}

const snapWidths = [320, 480, 640, 768, 960, 1200, 1600, 1920]
function loader({ src, width }: { src: string, width: number }) {
    let closestWidth = snapWidths[0]
    for (const snapWidth of snapWidths) {
        closestWidth = snapWidth
        if (snapWidth >= width) {
            break
        }
    }
    return imageSrc({
        src,
        width: closestWidth,
    })
}

export function AssetImage({ asset, sizes, style, loading, priority }: AssetImageProps) {
    const width = assetWidth(asset)
    const height = assetHeight(asset)
    return (
        <Image
            src={asset.src}
            loader={loader}
            alt={assetAlt(asset)}
            width={width}
            height={height}
            sizes={sizes}
            loading={loading}
            priority={priority}
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                ...style,
            }}
        />
    )
}
