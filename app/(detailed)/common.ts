import { assetDescription } from "@/shared/asset"
import { imageSrc } from "@/shared/image"
import { getAssetMetadata } from "@/shared/metadataStore"

export async function generateMetadataForAssetId(assetId: string) {
    const asset = await getAssetMetadata(assetId)
    if (!asset) {
        const title = 'Not found'
        const description = 'Not found'
        return {
            title, description,
            openGraph: {
                title, description,
            },
            twitter: {
                title, description,
            },
        }
    }
    const title = asset?.title ?? 'Picture'
    const description = asset ? assetDescription(asset) : 'My work'
    const images = [{
        url: imageSrc({
            fileName: asset.src,
            width: 1200,
        }),
        alt: asset.title,
    }]
    return {
        title, description,
        openGraph: {
            title, description, images,
        },
        twitter: {
            title, description, images,
        },
    }
}

export function metadataForCollection({
    title, description, pathname,
}: {
    title: string,
    description: string,
    pathname: string,
}) {
    const images = [{
        url: `/api/og${pathname}`,
        alt: title,
    }]
    return {
        title, description,
        openGraph: {
            title, description, images,
        },
        twitter: {
            title, description, images,
        },
    }
}