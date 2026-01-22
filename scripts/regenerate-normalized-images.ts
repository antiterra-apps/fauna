import sharp from 'sharp'
import { put } from '@vercel/blob'
import fs from 'node:fs'
import path from 'node:path'
import { collections, getDefaultColorForCollection } from '../src/lib/catalog'

function readTokenFromEnvLocal(): string | null {
  const p = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) return null
  const text = fs.readFileSync(p, 'utf8')
  const m = text.match(/^\s*BLOB_READ_WRITE_TOKEN\s*=\s*(.+)\s*$/m)
  if (!m) return null
  const raw = m[1].trim()
  return raw.replace(/^['"]|['"]$/g, '')
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

function parseSvgViewBox(svg: string): { x: number; y: number; width: number; height: number } | null {
  const viewBoxMatch = svg.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)
  if (!viewBoxMatch) {
    const widthMatch = svg.match(/\bwidth=(".*?"|'.*?')/i)
    const heightMatch = svg.match(/\bheight=(".*?"|'.*?')/i)
    if (widthMatch && heightMatch) {
      const w = parseFloat(widthMatch[1].slice(1, -1))
      const h = parseFloat(heightMatch[1].slice(1, -1))
      if (!isNaN(w) && !isNaN(h)) {
        return { x: 0, y: 0, width: w, height: h }
      }
    }
    return null
  }

  const parts = viewBoxMatch[1].trim().split(/\s+/).map(parseFloat)
  if (parts.length === 4 && parts.every(p => !isNaN(p))) {
    return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] }
  }
  return null
}

async function calculateContentBounds(svgBuffer: Buffer): Promise<Bounds> {
  const svgText = svgBuffer.toString('utf-8')
  const viewBox = parseSvgViewBox(svgText)
  
  if (!viewBox) {
    throw new Error('Could not parse SVG viewBox')
  }

  const highRes = 4096
  const rendered = await sharp(svgBuffer)
    .resize(highRes, highRes, { fit: 'inside', withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { data, info } = rendered
  const { width, height, channels } = info

  const alphaThreshold = 10
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels
      const alpha = data[idx + 3] ?? 0
      if (alpha >= alphaThreshold) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  const scaleX = viewBox.width / width
  const scaleY = viewBox.height / height

  return {
    minX: viewBox.x + minX * scaleX,
    minY: viewBox.y + minY * scaleY,
    maxX: viewBox.x + maxX * scaleX,
    maxY: viewBox.y + maxY * scaleY,
    width: (maxX - minX) * scaleX,
    height: (maxY - minY) * scaleY,
  }
}

function createNormalizedSvg(originalSvg: string, bounds: Bounds, targetPixelSize: number, contentPercent: number = 0.9): string {
  const contentMaxDim = Math.max(bounds.width, bounds.height)
  const viewBoxSize = Math.round((contentMaxDim / contentPercent) * 100) / 100
  
  const contentCenterX = (bounds.minX + bounds.maxX) / 2
  const contentCenterY = (bounds.minY + bounds.maxY) / 2
  
  const newMinX = Math.round((contentCenterX - viewBoxSize / 2) * 100) / 100
  const newMinY = Math.round((contentCenterY - viewBoxSize / 2) * 100) / 100

  let cleanedSvg = originalSvg
    .replace(/\sstroke=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\sstroke-width=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\sstroke-linecap=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\sstroke-linejoin=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\sstroke-miterlimit=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\svector-effect=(".*?"|'.*?'|[^"'\s>]+)/gi, '')

  if (!/<style/i.test(cleanedSvg)) {
    cleanedSvg = cleanedSvg.replace(
      /<svg\b([^>]*)>/i,
      (match, attrs) => {
        return `<svg${attrs}><style><![CDATA[*{stroke:none !important;}]]></style>`
      }
    )
  } else {
    cleanedSvg = cleanedSvg.replace(
      /<style\b[^>]*>([\s\S]*?)<\/style>/i,
      (match, content) => {
        if (!content.includes('stroke:none')) {
          return `<style><![CDATA[${content}*{stroke:none !important;}]]></style>`
        }
        return match.replace(/stroke:\s*none([^!]|$)/gi, 'stroke:none !important')
      }
    )
  }

  const updatedSvg = cleanedSvg.replace(
    /<svg\b([^>]*)>/i,
    (match, attrs) => {
      const cleaned = attrs
        .replace(/\sviewBox=(".*?"|'.*?')/gi, '')
        .replace(/\swidth=(".*?"|'.*?')/gi, '')
        .replace(/\sheight=(".*?"|'.*?')/gi, '')
        .replace(/\spreserveAspectRatio=(".*?"|'.*?')/gi, '')
        .replace(/\sshape-rendering=(".*?"|'.*?')/gi, '')

      return `<svg${cleaned} viewBox="${newMinX} ${newMinY} ${viewBoxSize} ${viewBoxSize}" width="${targetPixelSize}" height="${targetPixelSize}" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision">`
    }
  )

  return updatedSvg
}


async function generateNormalizedImages(
  svgUrl: string,
  assetId: string,
  size: number,
  token: string,
  collectionId?: string
): Promise<{ pngUrl: string; webpUrl: string }> {
  const svgBuffer = await fetchBuffer(svgUrl)
  const originalSvg = svgBuffer.toString('utf-8')
  const bounds = await calculateContentBounds(svgBuffer)
  let normalizedSvg = createNormalizedSvg(originalSvg, bounds, size, 0.9)
  
  // Replace CSS variables with actual color values for rendering
  // Sharp doesn't understand CSS variables, so we need to replace them with actual colors
  const fallbackColor = collectionId ? getDefaultColorForCollection(collectionId) : '#2d5bff'
  // Replace var(--svg-primary, #2d5bff) with fallback color
  normalizedSvg = normalizedSvg.replace(/var\(--svg-primary,\s*([^)]+)\)/gi, (match, fallback) => fallback.trim())
  // Replace var(--svg-primary) with fallback color
  normalizedSvg = normalizedSvg.replace(/var\(--svg-primary\)/gi, fallbackColor)
  
  const normalizedSvgBuffer = Buffer.from(normalizedSvg, 'utf-8')

  const renderScale = 4
  const renderSize = size * renderScale

  const pngBuffer = await sharp(normalizedSvgBuffer)
    .resize(renderSize, renderSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .resize(size, size, {
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: true,
    })
    .png({
      quality: 100,
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: false,
      colors: 256,
    })
    .toBuffer()

  const webpBuffer = await sharp(normalizedSvgBuffer)
    .resize(renderSize, renderSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .resize(size, size, {
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: true,
    })
    .webp({
      quality: 100,
      effort: 6,
      lossless: false,
    })
    .toBuffer()

  const pngPath = `assets/normalized/${assetId}-${size}.png`
  const pngBlob = await put(pngPath, pngBuffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
    contentType: 'image/png',
  })

  const webpPath = `assets/normalized/${assetId}-${size}.webp`
  const webpBlob = await put(webpPath, webpBuffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
    contentType: 'image/webp',
  })

  return {
    pngUrl: pngBlob.url,
    webpUrl: webpBlob.url,
  }
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? readTokenFromEnvLocal()
  if (!token) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN')
  }

  const engineersManual = collections.find(c => c.id === 'engineers-manual')
  if (!engineersManual) {
    throw new Error('Engineers Manual collection not found')
  }

  const assets = engineersManual.assets || []
  const results: Record<string, { pngUrl: string; webpUrl: string }> = {}

  for (const asset of assets) {
    const svgUrl = asset.metadata?.svgUrl
    if (!svgUrl) {
      console.log(`Skipping ${asset.id}: no SVG URL`)
      continue
    }

    try {
      console.log(`Processing ${asset.id}...`)
      const normalized = await generateNormalizedImages(svgUrl, asset.id, 1024, token, asset.collectionId)
      results[asset.id] = normalized
      console.log(`${asset.id} -> PNG: ${normalized.pngUrl}`)
      console.log(`${asset.id} -> WebP: ${normalized.webpUrl}`)
    } catch (error) {
      console.error(`Failed to process ${asset.id}:`, error)
    }
  }

  console.log('\n=== METADATA UPDATE FOR CATALOG ===\n')
  console.log('Add these normalizedPngUrl and normalizedWebpUrl to metadata:')
  Object.entries(results).forEach(([id, urls]) => {
    console.log(`${id}:`)
    console.log(`  normalizedPngUrl: "${urls.pngUrl}"`)
    console.log(`  normalizedWebpUrl: "${urls.webpUrl}"`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
