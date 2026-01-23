import sharp from 'sharp'
import { put } from '@vercel/blob'
import potrace from 'potrace'
import fs from 'node:fs'
import path from 'node:path'
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

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
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

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? readTokenFromEnvLocal()
  if (!token) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN')
  }

  const engineersManual = collections.find(c => c.id === 'engineers-manual')
  if (!engineersManual) {
    throw new Error('Engineers Manual collection not found')
  }

  // Only process assets 5-41 (new assets)
  const newAssets = engineersManual.assets?.filter(a => {
    const match = a.id.match(/engineers-manual-(\d+)/)
    if (!match) return false
    const num = parseInt(match[1])
    return num >= 5 && num <= 41
  }) || []

  console.log(`Regenerating SVGs for ${newAssets.length} assets...\n`)

  const results: Record<string, string> = {}

  for (const asset of newAssets) {
    try {
      console.log(`Processing ${asset.id}...`)
      const pngBuf = await fetchBuffer(asset.imageUrl)
      const bw = await toInkMaskPng(pngBuf)

      const filled = await potraceTrace(bw, {
        turdSize: 1,
        alphaMax: 0.15,
        optCurve: true,
        optTolerance: 0.08,
        threshold: 128,
        blackOnWhite: true,
        background: 'transparent',
      })

      const filledThemeable = makeThemeable(filled, '#2d5bff')
      const pathname = `assets/svg/${asset.id}.svg`

      const blob = await put(pathname, filledThemeable, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        token,
        contentType: 'image/svg+xml',
      })

      results[asset.id] = blob.url
      console.log(`${asset.id} -> ${blob.url}`)
    } catch (error) {
      console.error(`Failed to process ${asset.id}:`, error)
    }
  }

  console.log('\n=== RESULTS ===\n')
  console.log(JSON.stringify(results, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
