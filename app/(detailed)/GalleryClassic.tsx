import {
    assetHeight,
    AssetMetadata,
    assetWidth,
} from "@/shared/asset"
import Link from "next/link"
import { AssetImage } from "@/app/AssetImage"
import { hrefForAssetModal } from "@/shared/href"
import { AssetDescription } from "./AssetDescription"

export function GalleryClassic({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
}) {
    function buildColumns(assets: AssetMetadata[], num: number) {
        const columns: AssetMetadata[][] = Array(num).fill(null).map(() => [])
        const reversed = [...assets].reverse()
        const lengths = columns.map(() => 0)
        let asset = reversed.pop()
        while (asset) {
            const shortestIdx = lengths.reduce((shortestIndex, length, index) => {
                return length < lengths[shortestIndex] ? index : shortestIndex
            }, 0)
            columns[shortestIdx].push(asset)
            lengths[shortestIdx] += (assetHeight(asset) / assetWidth(asset))
            asset = reversed.pop()
        }
        return columns
    }
    const columns = buildColumns(assets, 4)
    return (
        <div className="flex flex-row gap-2">
            {columns.map((column, index) => (
                <div key={index} className="flex flex-col w-1/4 gap-0">
                    {column.map((asset) => (
                        <Tile
                            key={asset.src}
                            asset={asset}
                            pathname={pathname}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

function Tile({ asset, pathname }: {
    asset: AssetMetadata,
    pathname: string,
}) {
    const href = hrefForAssetModal({
        pathname,
        assetId: asset.id,
    })
    return (
        <div className="flex flex-col break-inside-avoid-column">
            <Link href={href} className="block">
                <AssetImage asset={asset} sizes="25vw" />
            </Link>
            <span className="text-xs text-accent">
                <AssetDescription asset={asset} pathname={pathname} />
            </span>
        </div>
    )
}