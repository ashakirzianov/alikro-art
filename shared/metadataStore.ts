import {
    AssetMetadata, sortAssets,
} from './asset'
import {
    AssetQuery, assetsForQuery,
    year as yearQuery, material as materialQuery, tag as tagQuery,
} from './query'
import { fetchAllAssetMetadata } from './cms'
import { collectionForId } from './collection'
import { cacheLife, cacheTag } from 'next/cache'
import { preproccessAssets } from './preprocess'

export async function getAssetsForSlideshow() {
    return getSortedAssetsForQuery(null)
}

export async function getAssetsForYear(year: number) {
    const query = yearQuery(year)
    return getSortedAssetsForQuery(query)
}

export async function getAssetsForTag(tag: string) {
    const query = tagQuery(tag)
    return getSortedAssetsForQuery(query)
}

export async function getAssetsForMaterial(material: string) {
    const query = materialQuery(material)
    return getSortedAssetsForQuery(query)
}

export async function getAssetsForCollection(collectionId: string) {
    const collectionObject = collectionForId(collectionId)
    if (collectionObject === undefined) {
        return []
    }
    const query = collectionObject.query
    return getSortedAssetsForQuery(query)
}

export async function getUniqueYears() {
    return getUniquePropertyValues('year')
}

export async function getUniqueMaterials() {
    return getUniquePropertyValues('material')
}

export async function getUniqueTags() {
    const assets = await getAllAssetsMetadata()
    const tagSet = new Set<string>()
    assets.forEach(asset => {
        asset.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet)
}

export async function getAssetMetadata(id: string) {
    const assets = await getAllAssetsMetadata()
    return assets.find(asset => asset.id === id)
}

async function getUniquePropertyValues<P extends keyof AssetMetadata>(property: P): Promise<AssetMetadata[P][]> {
    const assets = await getAllAssetsMetadata()
    const values = assets
        .map(asset => asset[property])
        .filter((value): value is NonNullable<AssetMetadata[P]> => value !== undefined)
    return Array.from(new Set(values))
}

async function getSortedAssetsForQuery(query: AssetQuery) {
    const unsorted = await getAllAssetsMetadata()
    const assets = sortAssets(unsorted)
    return assetsForQuery(assets, query)
}

async function getAllAssetsMetadata() {
    'use cache'
    cacheLife('max')
    cacheTag('cms-content')
    const assets = await fetchAllAssetMetadata()
    return preproccessAssets(assets)
}