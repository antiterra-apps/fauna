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

  console.log('Listing assets in blob storage...\n')

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

  console.log(`Original images: ${originalImages.length}`)
  
  const svgFiles = allBlobs.filter(b => 
    b.pathname.startsWith('assets/svg/') && 
    !b.pathname.includes('/variants/') &&
    b.pathname.match(/engineers-manual-\d+\.svg$/)
  )
  console.log(`SVG files: ${svgFiles.length}`)
  
  const normalizedFiles = allBlobs.filter(b => 
    b.pathname.startsWith('assets/normalized/') &&
    b.pathname.match(/engineers-manual-\d+-1024\.(png|webp)$/)
  )
  console.log(`Normalized files: ${normalizedFiles.length}`)
  
  const assetIds = new Set<string>()
  originalImages.forEach(blob => {
    const match = blob.pathname.match(/engineers-manual-(\d+)/)
    if (match) {
      assetIds.add(match[1])
    }
  })

  console.log(`\nUnique asset IDs found: ${assetIds.size}`)
  const sortedIds = Array.from(assetIds).map(id => parseInt(id)).sort((a, b) => a - b)
  if (sortedIds.length > 0) {
    console.log(`Asset ID range: ${sortedIds[0]} to ${sortedIds[sortedIds.length - 1]}`)
  }

  const missingSvgs: number[] = []
  const missingNormalized: number[] = []
  
  sortedIds.forEach(id => {
    const svgExists = svgFiles.some(b => b.pathname.includes(`engineers-manual-${id}.svg`))
    if (!svgExists) missingSvgs.push(id)
    
    const normalizedExists = normalizedFiles.some(b => b.pathname.includes(`engineers-manual-${id}-1024`))
    if (!normalizedExists) missingNormalized.push(id)
  })

  if (missingSvgs.length > 0) {
    console.log(`\n⚠️  Missing SVGs for assets: ${missingSvgs.join(', ')}`)
  }
  if (missingNormalized.length > 0) {
    console.log(`⚠️  Missing normalized images for assets: ${missingNormalized.join(', ')}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
