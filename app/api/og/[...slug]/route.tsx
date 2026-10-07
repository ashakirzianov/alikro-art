import { ImageResponse } from "next/og"
import sharp from "sharp"
import { assetAlt, AssetMetadata } from "@/shared/asset"
import { assetHeight, assetWidth } from "@/shared/asset"
import { imageSrc } from "@/shared/image"
import { getTiles } from "@/app/(detailed)/tiles"

const WIDTH = 1200
const HEIGHT = 600
// The widths xaxis serves variants at; a placed image fetches the smallest one that covers it
const VARIANT_WIDTHS = [96, 160, 320, 480, 640, 768, 960, 1200, 1600, 1920, 2560]
// Rendering ~15 images through satori exceeds Vercel's 10s default
export const maxDuration = 60

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params
  const assets = await assetsForSlug(slug)
  const lines = computeLines({
    assets,
    fractions: [40, 45, 15],
    width: WIDTH,
    height: HEIGHT,
  })
  // Fetch and convert every placed image up front, all at once, so the render itself does no I/O
  const images = await Promise.all(lines.map(line => Promise.all(
    line.assets.map(asset => imageForAsset({ asset, height: line.height })),
  )))
  return new ImageResponse(
    <Preview lines={lines.map((line, index) => ({
      height: line.height,
      images: images[index],
    }))} />,
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        // The render is expensive, so let the CDN serve it rather than recompute per crawl
        'Cache-Control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400',
      },
    },
  )
}

type PlacedImage = {
  asset: AssetMetadata,
  width: number,
  // A JPEG data URI, or undefined when the image could not be fetched or converted
  dataUri: string | undefined,
}

async function assetsForSlug(slug: string[]): Promise<AssetMetadata[]> {
  const [filter, value] = slug
  if (filter === undefined) {
    return []
  }
  const tiles = await getTiles(filter, value)
  return tiles
    .map(tile => tile.kind === 'asset' ? tile.asset : null)
    .filter(a => a !== null) as AssetMetadata[]
}

function Preview({ lines }: {
  lines: Array<{ height: number, images: PlacedImage[] }>,
}) {
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 0 0',
    margin: '0 0 0 0',
    gap: '0 0 0 0',
  }}>
    {
      lines.map(({ height, images }, index) => {
        return <AssetLine
          key={index}
          images={images}
          height={height}
        />
      })
    }
  </div>
}

function AssetLine({ images, height, }: {
  images: PlacedImage[],
  height: number,
}) {
  return <div style={{
    display: 'flex',
    overflow: 'hidden',
    width: '100%',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'flex-start',
      height,
      padding: '0 0 0 0',
      margin: '0 0 0 0',
      gap: '0 0 0 0',
    }}>
      {images.map(({ asset, width, dataUri }) => {
        if (dataUri === undefined) {
          // Keep the slot, so one missing image doesn't shift the rest of the line
          return <div key={asset.id} style={{ display: 'flex', height, width }} />
        }
        // eslint-disable-next-line @next/next/no-img-element
        return <img
          key={asset.id}
          src={dataUri}
          alt={assetAlt(asset)}
          style={{
            height,
            aspectRatio: `${assetWidth(asset)} / ${assetHeight(asset)}`,
            width,
            objectFit: 'fill',
          }}
        />
      })}
    </div>
  </div >
}

// Satori cannot decode WebP, and xaxis serves WebP only, so convert to JPEG here
async function imageForAsset({ asset, height }: {
  asset: AssetMetadata,
  height: number,
}): Promise<PlacedImage> {
  const width = Math.ceil(assetWidth(asset) * (height / assetHeight(asset)))
  const variantWidth = VARIANT_WIDTHS.find(w => w >= width) ?? VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1]
  const url = imageSrc({ src: asset.src, width: variantWidth })
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`OG image fetch failed: ${res.status} ${url}`)
      return { asset, width, dataUri: undefined }
    }
    const webp = Buffer.from(await res.arrayBuffer())
    const jpeg = await sharp(webp).jpeg({ quality: 80 }).toBuffer()
    return { asset, width, dataUri: `data:image/jpeg;base64,${jpeg.toString('base64')}` }
  } catch (error) {
    console.error(`OG image conversion failed: ${url}`, error)
    return { asset, width, dataUri: undefined }
  }
}

function computeLines({
  assets, fractions, width, height,
}: {
  assets: AssetMetadata[],
  fractions: number[],
  width: number,
  height: number
}) {
  const lines: Array<{
    height: number,
    assets: AssetMetadata[],
  }> = fractions.map(fraction => ({
    height: Math.floor(height * fraction / 100),
    assets: [],
  }))
  let totalWidth = 0
  let currentLineIdx = 0
  for (const asset of assets) {
    if (currentLineIdx >= lines.length) {
      break
    }
    const line = lines[currentLineIdx]
    line.assets.push(asset)
    totalWidth += assetWidth(asset) * (line.height / assetHeight(asset))
    if (totalWidth > width) {
      currentLineIdx += 1
      totalWidth = 0
    }
  }
  return lines
}