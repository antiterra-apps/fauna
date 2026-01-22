import sharp from 'sharp'
import { put } from '@vercel/blob'
import potrace from 'potrace'
import fs from 'node:fs'
import path from 'node:path'
import { getDefaultColorForCollection } from '../src/lib/catalog'
import { collections } from '../src/lib/catalog'

function readTokenFromEnvLocal(): string | null {
  const p = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) return null
  const text = fs.readFileSync(p, 'utf8')
  const m = text.match(/^\s*BLOB_READ_WRITE_TOKEN\s*=\s*(.+)\s*$/m)
  if (!m) return null
  const raw = m[1].trim()
  return raw.replace(/^['"]|['"]$/g, '')
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

function potraceTrace(input: Buffer, opts: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    ;(potrace as any).trace(input, opts, (err: any, svg: string) => {
      if (err) reject(err)
      else resolve(svg)
    })
  })
}

function makeThemeable(svg: string, fallbackFill: string): string {
  const withoutScripts = svg.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  // Strip explicit fill and stroke attributes from paths/shapes so CSS can control them
  const cleaned = withoutScripts
    .replace(/\sfill=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\sstroke=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
    .replace(/\sstroke-width=(".*?"|'.*?'|[^"'\s>]+)/gi, '')
  const styleTag =
    `<style><![CDATA[*{fill:var(--svg-primary, ${fallbackFill}) !important;stroke:none !important;}]]></style>`
  return cleaned.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
    const hasStyle = /<style/i.test(cleaned)
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
  svgBuffer: Buffer,
  assetId: string,
  size: number,
  token: string,
  collectionId?: string
): Promise<{ pngUrl: string; webpUrl: string }> {
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

  const folderPath = process.argv[2]
  if (!folderPath) {
    throw new Error('Usage: tsx scripts/process-local-images.ts <folder-path>')
  }

  const resolvedPath = path.resolve(folderPath)
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Folder does not exist: ${resolvedPath}`)
  }

  const files = fs.readdirSync(resolvedPath)
  const imageFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase()
    return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)
  })

  if (imageFiles.length === 0) {
    throw new Error(`No image files found in ${resolvedPath}`)
  }

  console.log(`Found ${imageFiles.length} image(s) to process\n`)

  const results: Array<{
    id: string
    title: string
    imageUrl: string
    blobUrl: string
    svgUrl: string
    normalizedPngUrl: string
    normalizedWebpUrl: string
  }> = []

  for (let i = 0; i < imageFiles.length; i++) {
    const filename = imageFiles[i]
    const filePath = path.join(resolvedPath, filename)
    const baseName = path.parse(filename).name
    const assetId = `engineers-manual-${i + 5}`

    console.log(`Processing ${filename} (${i + 1}/${imageFiles.length})...`)

    try {
      const imageBuffer = fs.readFileSync(filePath)
      const ext = path.extname(filename).toLowerCase()
      const standardizedFilename = `${assetId}${ext}`
      
      const originalPath = `Engineer's Manual/${standardizedFilename}`
      const originalBlob = await put(originalPath, imageBuffer, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        token,
        contentType: `image/${ext.slice(1).toLowerCase() === 'jpg' ? 'jpeg' : ext.slice(1).toLowerCase()}`,
      })
      console.log(`  Uploaded original: ${originalBlob.url}`)

      const bw = await toInkMaskPng(imageBuffer)

      const filled = await potraceTrace(bw, {
        turdSize: 1,
        alphaMax: 0.15,
        optCurve: true,
        optTolerance: 0.08,
        threshold: 128,
        blackOnWhite: true,
        background: 'transparent',
      })

      const collectionId = 'engineers-manual'
      const defaultColor = getDefaultColorForCollection(collectionId)
      const themeable = makeThemeable(filled, defaultColor)
      const svgPath = `assets/svg/${assetId}.svg`
      const svgBlob = await put(svgPath, themeable, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        token,
        contentType: 'image/svg+xml',
      })
      console.log(`  Generated SVG: ${svgBlob.url}`)

      const normalized = await generateNormalizedImages(
        Buffer.from(themeable, 'utf-8'),
        assetId,
        1024,
        token,
        collectionId
      )
      console.log(`  Generated normalized PNG: ${normalized.pngUrl}`)
      console.log(`  Generated normalized WebP: ${normalized.webpUrl}`)

      results.push({
        id: assetId,
        title: baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        imageUrl: originalBlob.url,
        blobUrl: originalBlob.url,
        svgUrl: svgBlob.url,
        normalizedPngUrl: normalized.pngUrl,
        normalizedWebpUrl: normalized.webpUrl,
      })

      console.log(`✓ Completed ${filename}\n`)
    } catch (error) {
      console.error(`✗ Failed to process ${filename}:`, error)
    }
  }

  console.log('\n=== METADATA FOR CATALOG ===\n')
  console.log(JSON.stringify(results, null, 2))
  
  const outputPath = path.join(process.cwd(), 'processed-assets-metadata.json')
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`\n✓ Metadata saved to: ${outputPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
