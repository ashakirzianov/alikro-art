export function imageSrc({
    fileName, width, quality, format = 'webp',
}: {
    fileName: string,
    width?: number,
    quality?: number,
    // Satori (next/og) cannot decode webp, so the OG route asks for jpeg instead
    format?: 'webp' | 'png' | 'jpeg',
}) {
    return `${process.env.NEXT_PUBLIC_IMG_BASE}/${variantFileName({
        originalName: fileName,
        width,
        quality,
        format,
    })}`
}

export function variantFileName({
    originalName, width, quality, format,
}: {
    originalName: string, format: string,
    width?: number, quality?: number,
}): string {
    return `${originalName}@${width !== undefined ? `w${width}` : ''}${quality !== undefined ? `q${quality}` : ''}.${format}`
}