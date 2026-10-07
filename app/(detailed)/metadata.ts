import { assetDescription } from "@/shared/asset"
import { collectionForId } from "@/shared/collection"
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

export async function generateMetadataForTag(tag: string) {
    tag = decodeURIComponent(tag)
    const title = `Alikro | ${tag}`
    const description = `Alikro's works marked as '${tag}'`
    return metadataForCollection({
        title, description,
        pathname: `/tag/${tag}`,
    })
}

export async function generateMetadataForMaterial(material: string) {
    material = decodeURIComponent(material)
    const title = `Alikro | ${material}`
    const description = `Alikro's works made from '${material}'`
    return metadataForCollection({
        title, description,
        pathname: `/material/${material}`,
    })
}

export async function generateMetadataForYear(year: string) {
    const title = `Alikro | ${year}`
    const description = `Alikro's works made in '${year}'`
    return metadataForCollection({
        title, description,
        pathname: `/year/${year}`,
    })
}

export async function generateMetadataForCollectionId(collectionId: string) {
    let title = 'Not found'
    let description = 'Not found'
    const collectionMetadata = collectionForId(collectionId)
    if (collectionMetadata !== undefined) {
        title = collectionMetadata.title
        description = collectionMetadata.description
    }
    return metadataForCollection({
        title, description,
        pathname: `/${collectionId}`,
    })
}

function metadataForCollection({
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