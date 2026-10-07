import { AssetImage } from "@/app/AssetImage"
import { AssetMetadata } from "@/shared/asset"
import { hrefForTag } from "@/shared/href"
import Link from "next/link"
import { AssetDescription } from "./AssetDescription"
import { EditLink } from "./EditLink"

export function AssetView({
    asset, pathname,
}: {
    asset: AssetMetadata,
    pathname: string,
}) {
    return <div className="flex flex-col items-center text-m text-accent">
        <AssetImage
            asset={asset}
            sizes="100vw"
            style={{
                objectFit: 'contain',
                maxWidth: '100svw',
                maxHeight: '100svh',
                cursor: 'default'
            }}
        />
        <div className="flex flex-row">
            <AssetDescription asset={asset} pathname={pathname} />
        </div>
        {(asset.tags && asset.tags.length > 0) && <div className="flex flex-row gap-1">
            {asset.tags?.map((tag, index) => {
                return <span key={index}>
                    <Link href={hrefForTag({ tag })} className="hover:underline">
                        {tag}
                    </Link>
                    {index < asset.tags!.length - 1 && ', '}
                </span>
            }
            )}
        </div>}
        <EditLink asset={asset} />
        <Link href={pathname} className="text-accent hover:underline">
            back to gallery
        </Link>
    </div >
}