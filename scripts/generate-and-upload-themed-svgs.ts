import ImageTracer from 'imagetracerjs'
import { PNG } from 'pngjs'
import sharp from 'sharp'
import { put } from '@vercel/blob'
import fs from 'node:fs'
import path from 'node:path'
import { collections } from '../src/lib/catalog'

type ImageDataLike = { width: number; height: number; data: Uint8Array }

const MAX_DIM_PX = 768

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

async function downscaleToPng(buf: Buffer): Promise<Buffer> {
  return await sharp(buf)
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer()
}

async function toInkMaskPng(buf: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buf)
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const sampleSize = Math.min(12, width, height)
  let br = 0
  let bg = 0
  let bb = 0
  let n = 0
  for (let y = 0; y < sampleSize; y++) {
    for (let x = 0; x < sampleSize; x++) {
      const i = (y * width + x) * channels
      br += data[i] ?? 0
      bg += data[i + 1] ?? 0
      bb += data[i + 2] ?? 0
      n++
    }
  }
  const bgR = br / n
  const bgG = bg / n
  const bgB = bb / n

  const out = Buffer.alloc(width * height)
  const DIST_T = 52
  const BLUE_BIAS_T = 22

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const r = data[i] ?? 0
      const g = data[i + 1] ?? 0
      const b = data[i + 2] ?? 0

      const dr = r - bgR
      const dg = g - bgG
      const db = b - bgB
      const dist = Math.sqrt(dr * dr + dg * dg + db * db)
      const blueBias = b - Math.max(r, g)

      const isInk = dist > DIST_T && blueBias > BLUE_BIAS_T
      out[y * width + x] = isInk ? 0 : 255
    }
  }

  return await sharp(out, { raw: { width, height, channels: 1 } })
    .median(1)
    .png()
    .toBuffer()
}

function decodePngToImageData(buf: Buffer): ImageDataLike {
  const png = PNG.sync.read(buf)
  return { width: png.width, height: png.height, data: png.data }
}

function makeThemeable(svg: string, fallbackFill: string): string {
  const withoutScripts = svg.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  const styleTag =
    `<style><![CDATA[*{fill:var(--svg-primary, ${fallbackFill}) !important;stroke:none !important;}]]></style>`
  return withoutScripts.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
    const hasStyle = /<style/i.test(withoutScripts)
    const widthMatch = attrs.match(/\bwidth=(".*?"|'.*?')/i)
    const heightMatch = attrs.match(/\bheight=(".*?"|'.*?')/i)
    const rawWidth = widthMatch ? widthMatch[1].slice(1, -1) : ''
    const rawHeight = heightMatch ? heightMatch[1].slice(1, -1) : ''
    const widthNum = Number(rawWidth)
    const heightNum = Number(rawHeight)
    const hasViewBox = /\bviewBox=/i.test(attrs)

    const cleanedAttrs = hasViewBox
      ? attrs.replace(/\s(width|height|preserveAspectRatio)=(".*?"|'.*?')/gi, '')
      : attrs.replace(/\s(width|height|preserveAspectRatio|viewBox)=(".*?"|'.*?')/gi, '')

    const injectedViewBox =
      hasViewBox
        ? ''
        : Number.isFinite(widthNum) && widthNum > 0 && Number.isFinite(heightNum) && heightNum > 0
          ? ` viewBox="0 0 ${widthNum} ${heightNum}"`
          : ''

    const open = `<svg${cleanedAttrs}${injectedViewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">`
    return hasStyle ? open : `${open}${styleTag}`
  })
}

function readTokenFromEnvLocal(): string | null {
  const p = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) return null
  const text = fs.readFileSync(p, 'utf8')
  const m = text.match(/^\s*BLOB_READ_WRITE_TOKEN\s*=\s*(.+)\s*$/m)
  if (!m) return null
  const raw = m[1].trim()
  return raw.replace(/^['"]|['"]$/g, '')
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? readTokenFromEnvLocal()
  if (!token) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN')
  }

  const assets = collections.flatMap(c => c.assets)
  const results: Record<string, string> = {}

  for (const asset of assets) {
    const pngBuf = await fetchBuffer(asset.imageUrl)
    const maskPng = await toInkMaskPng(pngBuf)
    const imageData = decodePngToImageData(maskPng)

    const traced = ImageTracer.imagedataToSVG(imageData, {
      numberofcolors: 2,
      pathomit: 1,
      ltres: 0.6,
      qtres: 0.6,
      rightangleenhance: true,
    })

    const fallbackFill = asset.collectionId === 'engineers-manual' ? '#2d5bff' : '#000'
    const themeable = makeThemeable(traced, fallbackFill)
    const pathname = `assets/svg/${asset.id}.svg`

    const blob = await put(pathname, themeable, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      token,
      contentType: 'image/svg+xml',
    })

    results[asset.id] = blob.url
    console.log(`${asset.id} -> ${blob.url}`)
  }

  console.log(JSON.stringify(results, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

