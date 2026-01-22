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
    // Try to get width/height as fallback
    const widthMatch = svg.match(/\bwidth\s*=\s*["']([^"']+)["']/i)
    const heightMatch = svg.match(/\bheight\s*=\s*["']([^"']+)["']/i)
    if (widthMatch && heightMatch) {
      const w = parseFloat(widthMatch[1])
      const h = parseFloat(heightMatch[1])
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

  // Render SVG at high resolution to detect content bounds
  const highRes = 4096
  const rendered = await sharp(svgBuffer)
    .resize(highRes, highRes, { fit: 'inside', withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { data, info } = rendered
  const { width, height, channels } = info

  // Find bounding box of non-transparent pixels
  // Use a threshold to avoid picking up anti-aliasing artifacts
  const alphaThreshold = 10 // Only count pixels with significant opacity
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

  // Convert pixel coordinates back to SVG coordinate space
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

function createNormalizedSvg(originalSvg: string, bounds: Bounds, targetPixelSize: number, contentPercent: number = 0.8): string {
  // We want the content's larger dimension to fill contentPercent (80%) of target pixels
  // This leaves 5% margin on each side
  
  const contentMaxDim = Math.max(bounds.width, bounds.height)
  
  // Calculate viewBox size: when viewBox maps to targetPixelSize pixels,
  // content should occupy contentPercent of those pixels
  // viewBoxSize / contentMaxDim = targetPixelSize / (targetPixelSize * contentPercent)
  // viewBoxSize = contentMaxDim / contentPercent
  const viewBoxSize = Math.round((contentMaxDim / contentPercent) * 100) / 100
  
  // Center the viewBox on the content
  const contentCenterX = (bounds.minX + bounds.maxX) / 2
  const contentCenterY = (bounds.minY + bounds.maxY) / 2
  
  const newMinX = Math.round((contentCenterX - viewBoxSize / 2) * 100) / 100
  const newMinY = Math.round((contentCenterY - viewBoxSize / 2) * 100) / 100

  // Remove all stroke attributes from paths/shapes to prevent dark outlines
  // The SVG should only have fills, no strokes
  let cleanedSvg = originalSvg
    .replace(/\sstroke=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\sstroke-width=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\sstroke-linecap=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\sstroke-linejoin=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\sstroke-miterlimit=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\svector-effect=(".*?"|'.*?'|[^"'\s>]+)/gi, '')

  // Ensure style tag enforces stroke:none
  if (!/<style/i.test(cleanedSvg)) {
    // If no style tag exists, add one
    cleanedSvg = cleanedSvg.replace(
      /<svg\b([^>]*)>/i,
      (match, attrs) => {
        return `<svg${attrs}><style><![CDATA[*{stroke:none !important;}]]></style>`
      }
    )
  } else {
    // Ensure existing style tag includes stroke:none
    cleanedSvg = cleanedSvg.replace(
      /<style\b[^>]*>([\s\S]*?)<\/style>/i,
      (match, content) => {
        if (!content.includes('stroke:none')) {
          return `<style><![CDATA[${content}*{stroke:none !important;}]]></style>`
        }
        // If stroke:none already exists but might not have !important, ensure it does
        return match.replace(/stroke:\s*none([^!]|$)/gi, 'stroke:none !important')
      }
    )
  }

  // Update SVG viewBox and dimensions
  const updatedSvg = cleanedSvg.replace(
    /<svg\b([^>]*)>/i,
    (match, attrs) => {
      // Remove existing viewBox, width, height, shape-rendering
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
): Promise<{ normalizedSvgUrl: string; pngUrl: string; webpUrl: string }> {
  // Fetch original SVG
  const svgBuffer = await fetchBuffer(svgUrl)
  const originalSvg = svgBuffer.toString('utf-8')

  // Calculate content bounds
  const bounds = await calculateContentBounds(svgBuffer)

  // Create normalized SVG with content filling 80% of target size (10% margin each side)
  const normalizedSvgThemeable = createNormalizedSvg(originalSvg, bounds, size, 0.8)

  // Upload normalized SVG (themeable, with CSS vars) for API consumers
  const svgPath = `assets/normalized/${assetId}-${size}.svg`
  const svgBlob = await put(svgPath, Buffer.from(normalizedSvgThemeable, 'utf-8'), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
    contentType: 'image/svg+xml',
  })

  // Replace CSS variables with actual color values for rendering
  // Sharp doesn't understand CSS variables, so we need to replace them with actual colors
  let normalizedSvg = normalizedSvgThemeable
  const fallbackColor = collectionId ? getDefaultColorForCollection(collectionId) : '#2d5bff'
  normalizedSvg = normalizedSvg.replace(/var\(--svg-primary,\s*[^)]+\)/gi, fallbackColor)
  normalizedSvg = normalizedSvg.replace(/var\(--svg-primary\)/gi, fallbackColor)
  const normalizedSvgBuffer = Buffer.from(normalizedSvg, 'utf-8')

  // Render at much higher resolution for better quality, then downscale
  // This ensures smooth anti-aliasing and crisp edges
  // Sharp's density option works differently - we need to render large then downscale
  const renderScale = 4 // Render at 4x then downscale for maximum quality
  const renderSize = size * renderScale

  // Generate PNG - render at 4x then downscale with high quality
  // Using high density and proper resampling for crisp edges
  const pngBuffer = await sharp(normalizedSvgBuffer)
    .resize(renderSize, renderSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
      kernel: sharp.kernel.lanczos3, // High-quality resampling
    })
    .resize(size, size, {
      kernel: sharp.kernel.lanczos3, // High-quality downscaling
      withoutEnlargement: true,
    })
    .png({
      quality: 100,
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: false, // Ensure full color, not palette mode
      colors: 256, // Full color depth
    })
    .toBuffer()

  // Generate WebP - render at 4x then downscale with high quality
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
      lossless: false, // Use lossy for smaller files, but high quality
    })
    .toBuffer()

  // Upload PNG
  const pngPath = `assets/normalized/${assetId}-${size}.png`
  const pngBlob = await put(pngPath, pngBuffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
    contentType: 'image/png',
  })

  // Upload WebP
  const webpPath = `assets/normalized/${assetId}-${size}.webp`
  const webpBlob = await put(webpPath, webpBuffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
    contentType: 'image/webp',
  })

  return {
    normalizedSvgUrl: svgBlob.url,
    pngUrl: pngBlob.url,
    webpUrl: webpBlob.url,
  }
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? readTokenFromEnvLocal()
  if (!token) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN')
  }

  const assets = collections.flatMap(c => c.assets)
  const results: Record<string, { normalizedSvgUrl: string; pngUrl: string; webpUrl: string }> = {}

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
      console.log(`${asset.id} -> SVG: ${normalized.normalizedSvgUrl}`)
      console.log(`${asset.id} -> PNG: ${normalized.pngUrl}`)
      console.log(`${asset.id} -> WebP: ${normalized.webpUrl}`)
    } catch (error) {
      console.error(`Failed to process ${asset.id}:`, error)
    }
  }

  console.log('\nResults:')
  console.log(JSON.stringify(results, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
