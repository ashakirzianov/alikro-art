import { AssetQuery, and, not, tag } from "./query"

export type Slide = {
    title: string,
    href: string,
    query: AssetQuery,
    includeLinks?: boolean,
}

export function allSlides(): Slide[] {
    return slides
}

const slides: Slide[] = [{
    title: 'Alikro, an artist.',
    href: '/all',
    query: tag('Self-portrait'),
    includeLinks: true,
}, {
    title: 'Paintings.',
    href: '/paintings',
    query: and('painting', not(tag('Self-portrait'))),
}, {
    title: 'Drawings.',
    href: '/drawings',
    query: and('drawing', not(tag('Self-portrait'))),
}, {
    title: 'Ceramics.',
    href: '/ceramics',
    query: 'ceramic',
}, {
    title: 'Illustrations.',
    href: '/illustrations',
    query: and('illustration', not(tag('Self-portrait'))),
}, {
    title: 'Posters.',
    href: '/posters',
    query: and('poster', not(tag('Self-portrait'))),
}, {
    title: 'Collages.',
    href: '/collages',
    query: and('collage', not(tag('Self-portrait'))),
}]
