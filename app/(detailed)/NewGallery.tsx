'use client'
import { AssetMetadata } from "@/shared/asset"
import { AssetImage } from "@/app/AssetImage"
import { AssetDescription } from "./AssetDescription"
import { ExpandedView } from "./ExpandedView"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { hrefForAssetModal } from "@/shared/href"

export function Gallery({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
}) {
    return (
        <Suspense fallback={<GalleryGrid assets={assets} pathname={pathname} onTileClick={null} />}>
            <GalleryImpl assets={assets} pathname={pathname} />
        </Suspense>
    )
}

function GalleryImpl({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
}) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [originRect, setOriginRect] = useState<DOMRect | null>(null)

    const show = searchParams.get('show')
    const assetIdx = show ? assets.findIndex(a => a.id === show) : -1

    function handleTileClick(idx: number, rect: DOMRect) {
        setOriginRect(rect)
        router.push(hrefForAssetModal({ pathname, assetId: assets[idx].id }), { scroll: false })
    }

    function handleDismiss() {
        router.push(pathname, { scroll: false })
    }

    function handleNavigate(newIdx: number) {
        router.push(hrefForAssetModal({ pathname, assetId: assets[newIdx].id }), { scroll: false })
    }

    return (
        <>
            {assetIdx !== -1 && (
                <ExpandedView
                    assets={assets}
                    assetIdx={assetIdx}
                    originRect={originRect}
                    onDismiss={handleDismiss}
                    onNavigate={handleNavigate}
                />
            )}
            <GalleryGrid assets={assets} pathname={pathname} onTileClick={handleTileClick} />
        </>
    )
}

function GalleryGrid({ assets, pathname, onTileClick }: {
    assets: AssetMetadata[],
    pathname: string,
    onTileClick: ((idx: number, rect: DOMRect) => void) | null,
}) {
    const columns: AssetMetadata[][] = Array(4).fill(null).map(() => [])
    assets.forEach((asset, index) => columns[index % 4].push(asset))

    return (
        <div className="flex flex-row gap-2">
            {columns.map((column, colIndex) => (
                <div key={colIndex} className="flex flex-col w-1/4 gap-0">
                    {column.map((asset) => (
                        <Tile
                            key={asset.src}
                            asset={asset}
                            pathname={pathname}
                            onExpand={onTileClick
                                ? (rect) => onTileClick(assets.findIndex(a => a.id === asset.id), rect)
                                : null
                            }
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

function Tile({ asset, pathname, onExpand }: {
    asset: AssetMetadata,
    pathname: string,
    onExpand: ((rect: DOMRect) => void) | null,
}) {
    function handleClick(e: React.MouseEvent<HTMLDivElement>) {
        const img = e.currentTarget.querySelector('img')
        if (img && onExpand) {
            onExpand(img.getBoundingClientRect())
        }
    }

    return (
        <div
            className="flex flex-col break-inside-avoid-column cursor-pointer"
            onClick={handleClick}
        >
            <AssetImage asset={asset} sizes="480" />
            <span className="text-xs text-accent">
                <AssetDescription asset={asset} pathname={pathname} />
            </span>
        </div>
    )
}
