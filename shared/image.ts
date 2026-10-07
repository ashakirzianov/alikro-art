// xaxis serves a work's full-size image at `…@.webp` and a resized variant at `…@w<width>.webp`
export function imageSrc({ src, width }: {
    src: string,
    width: number,
}) {
    return src.replace(/@\.webp$/, `@w${width}.webp`)
}
