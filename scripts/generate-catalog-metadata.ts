import { list } from '@vercel/blob'
import fs from 'node:fs'
import path from 'node:path'

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

  console.log('Fetching assets from blob storage...\n')

  const allBlobs: any[] = []
  let cursor: string | undefined = undefined
  let hasMore = true

  while (hasMore) {
    const result = await list({
      limit: 1000,
      cursor,
      token,
    })

    allBlobs.push(...result.blobs)
    cursor = result.cursor || undefined
    hasMore = result.hasMore || false
  }

  const originalImages = allBlobs.filter(b => 
    b.pathname.startsWith("Engineer's Manual/") &&
    b.pathname.match(/engineers-manual-\d+\.(png|jpg|jpeg|webp)$/i)
  )

  const svgFiles = allBlobs.filter(b => 
    b.pathname.startsWith('assets/svg/') && 
    !b.pathname.includes('/variants/') &&
    b.pathname.match(/engineers-manual-\d+\.svg$/)
  )

  const normalizedPng = allBlobs.filter(b => 
    b.pathname.startsWith('assets/normalized/') &&
    b.pathname.match(/engineers-manual-\d+-1024\.png$/)
  )

  const normalizedWebp = allBlobs.filter(b => 
    b.pathname.startsWith('assets/normalized/') &&
    b.pathname.match(/engineers-manual-\d+-1024\.webp$/)
  )

  const normalizedSvg = allBlobs.filter(b => 
    b.pathname.startsWith('assets/normalized/') &&
    b.pathname.match(/engineers-manual-\d+-1024\.svg$/)
  )

  const assets: any[] = []

  for (let id = 5; id <= 41; id++) {
    const assetId = `engineers-manual-${id}`
    const original = originalImages.find(b => b.pathname.includes(`${assetId}.`))
    const svg = svgFiles.find(b => b.pathname.includes(`${assetId}.svg`))
    const png = normalizedPng.find(b => b.pathname.includes(`${assetId}-1024.png`))
    const webp = normalizedWebp.find(b => b.pathname.includes(`${assetId}-1024.webp`))
    const normSvg = normalizedSvg.find(b => b.pathname.includes(`${assetId}-1024.svg`))

    if (original) {
      const title = `Asset ${id}`
      assets.push({
        id: assetId,
        title,
        imageUrl: original.url,
        isFree: true,
        collectionId: 'engineers-manual',
        description: '',
        tags: [],
        relatedAssets: [],
        metadata: {
          blobUrl: original.url,
          svgUrl: svg?.url,
          normalizedSvgUrl: normSvg?.url,
          normalizedPngUrl: png?.url,
          normalizedWebpUrl: webp?.url,
        },
      })
    }
  }

  console.log(`Generated metadata for ${assets.length} assets\n`)
  console.log('=== METADATA FOR CATALOG ===\n')
  console.log(JSON.stringify(assets, null, 2))

  const outputPath = path.join(process.cwd(), 'catalog-metadata.json')
  fs.writeFileSync(outputPath, JSON.stringify(assets, null, 2))
  console.log(`\n✓ Metadata saved to: ${outputPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
