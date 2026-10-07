import { AssetQuery, tag } from "./query"

export type Collection = {
    id: string,
    title: string,
    description: string,
    query: AssetQuery,
}

export type CollectionGroup = Collection[]

export function allCollections(): Collection[] {
    return allCollectionsArray
}

export function getKindCollections(): CollectionGroup {
    return kindCollections
}

export function getSelectedCollections(): CollectionGroup {
    return selectedCollections
}

export function collectionForId(path: string): Collection | undefined {
    return allCollections().find(collection => collection.id === path)
}

const all: Collection = {
    id: 'all',
    title: 'Alikro, an artist.',
    description: 'All works by Alikro.',
    query: null,
}

const kindCollections: CollectionGroup = [{
    id: 'paintings',
    title: 'paintings',
    description: "Alikro's paintings.",
    query: 'painting',
}, {
    id: 'drawings',
    title: 'drawings',
    description: "Alikro's drawings.",
    query: 'drawing',
}, {
    id: 'ceramics',
    title: 'ceramics',
    description: "Alikro's ceramics.",
    query: 'ceramic',
}, {
    id: 'illustrations',
    title: 'illustrations',
    description: "Alikro's illustrations.",
    query: 'illustration',
}, {
    id: 'posters',
    title: 'posters',
    description: "Alikro's posters.",
    query: 'poster',
}, {
    id: 'collages',
    title: 'collages',
    description: "Alikro's collages.",
    query: 'collage',
}]

const selectedCollections: CollectionGroup = [{
    id: 'self-portraits',
    title: 'self portraits',
    description: "Alikro's self portraits.",
    query: tag('Self-portrait'),
}, {
    id: 'friends',
    title: 'friends',
    description: "Alikro's friend portraits.",
    query: tag('Friend Portrait'),
}, {
    id: 'black-list',
    title: 'black list',
    description: "Alikro's Black List series.",
    query: tag('The Black List'),
}, {
    id: 'nai',
    title: 'nai',
    description: "Alikro's NAI works.",
    query: tag('NAI'),
}, {
    id: 'sketches-from-museums',
    title: 'sketches from museums',
    description: "Alikro's sketches from museums.",
    query: tag('Sketch from Museum'),
}]

const allCollectionsArray = [
    all,
    ...kindCollections,
    ...selectedCollections,
]
