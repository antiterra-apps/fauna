import fs from 'node:fs'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { getAllAssets } from '../src/lib/catalog'

type EnrichedAsset = {
  title: string
  description: string
  tags: string[]
}

type EnrichedCatalog = Record<string, EnrichedAsset>

const USE_CASE_TAGS = [
  'hero-section',
  'about-page',
  'pull-quote',
  'section-divider',
  'sidebar',
  'footer',
  'testimonial',
  'feature-block',
] as const

function readAnthropicKeyFromEnvLocal(): string | null {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return null
  const text = fs.readFileSync(envPath, 'utf8')
  const match = text.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+)\s*$/m)
  if (!match) return null
  const raw = match[1].trim()
  return raw.replace(/^['"]|['"]$/g, '')
}

function loadExistingEnriched(filePath: string): EnrichedCatalog {
  if (!fs.existsSync(filePath)) {
    return {}
  }
  const text = fs.readFileSync(filePath, 'utf8').trim()
  if (!text) return {}
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object') {
      return parsed as EnrichedCatalog
    }
  } catch (err) {
    console.error(`Failed to parse existing catalog-enriched.json:`, err)
  }
  return {}
}

function saveEnriched(filePath: string, data: EnrichedCatalog) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function needsEnrichment(
  asset: ReturnType<typeof getAllAssets>[number],
  enriched: EnrichedCatalog,
): boolean {
  if (enriched[asset.id]) {
    return false
  }
  const hasUseCaseTag = asset.tags.some((tag) =>
    USE_CASE_TAGS.includes(tag as (typeof USE_CASE_TAGS)[number]),
  )
  if (hasUseCaseTag) {
    return false
  }
  return true
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch image ${url} (${res.status})`)
  }
  const ab = await res.arrayBuffer()
  const buf = Buffer.from(ab)
  return buf.toString('base64')
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const enrichedPath = path.join(process.cwd(), 'scripts', 'catalog-enriched.json')

  const apiKey = process.env.ANTHROPIC_API_KEY ?? readAnthropicKeyFromEnvLocal()
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY (set in env or .env.local)')
  }

  const client = new Anthropic({ apiKey })

  const allAssets = getAllAssets()
  const existingEnriched = loadExistingEnriched(enrichedPath)

  const worklist = allAssets.filter((asset) => needsEnrichment(asset, existingEnriched))

  if (worklist.length === 0) {
    console.log('No assets need enrichment.')
    return
  }

  console.log(`Enriching metadata for ${worklist.length} asset(s)...`)

  const systemPrompt = `
You are labeling illustrations for Fauna, a premium illustration library.
Fauna's style is vintage engraving — detailed crosshatching, single-color
on cream/neutral background, European in sensibility, quiet and literary
in mood. Think 19th century scientific manuals meets Parisian editorial.

Analyze this illustration and return a JSON object with exactly these fields:

{
  "title": "A short evocative title, 3-6 words. Think editorial caption, 
            not file name. Example: 'Café Terrace, Late Afternoon'",
  "description": "1-2 sentences. What is depicted and the mood it evokes. 
                  Written for a designer deciding if this fits their page.",
  "tags": [
    // 8-12 tags, mixing all four categories:
    // SUBJECT: what is literally depicted
    //   e.g. "couple", "cafe", "tree", "architecture", "column"
    // MOOD: emotional tone
    //   e.g. "intimate", "leisurely", "nostalgic", "quiet", "romantic"
    // COMPOSITION: how it sits on a page
    //   e.g. "corner-anchored", "bottom-right", "large-negative-space",
    //        "centered", "edge-bleeding"
    // USE CASE: where an agent or designer would place this
    //   e.g. "hero-section", "about-page", "pull-quote", 
    //        "section-divider", "sidebar", "footer", 
    //        "testimonial", "feature-block"
  ]
}

Return only valid JSON. No explanation, no markdown fences.
`.trim()

  const enriched: EnrichedCatalog = { ...existingEnriched }

  for (const asset of worklist) {
    const sourceUrl = asset.metadata?.normalizedWebpUrl
    if (!sourceUrl) {
      console.warn(`Skipping ${asset.id}: missing metadata.normalizedWebpUrl`)
      continue
    }

    try {
      const base64 = await fetchImageAsBase64(sourceUrl)

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/webp',
                  data: base64,
                },
              },
            ],
          },
        ],
      })

      const textPart = response.content.find((c: any) => c.type === 'text')
      if (!textPart || textPart.type !== 'text') {
        throw new Error('No text content in Claude response')
      }

      const raw = textPart.text.trim()
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch (err) {
        throw new Error(`Failed to parse JSON for ${asset.id}: ${(err as Error).message}`)
      }

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        typeof (parsed as any).title !== 'string' ||
        !(parsed as any).title.trim() ||
        typeof (parsed as any).description !== 'string' ||
        !(parsed as any).description.trim() ||
        !Array.isArray((parsed as any).tags)
      ) {
        throw new Error(`Invalid JSON shape for ${asset.id}`)
      }

      const title = (parsed as any).title.trim()
      const description = (parsed as any).description.trim()
      const tags = (parsed as any).tags
        .map((t: unknown) => (typeof t === 'string' ? t.trim() : ''))
        .filter((t: string) => t.length > 0)

      if (tags.length === 0) {
        throw new Error(`No valid tags returned for ${asset.id}`)
      }

      enriched[asset.id] = { title, description, tags }
      saveEnriched(enrichedPath, enriched)

      console.log(`✓ ${asset.id}: ${title}`)
    } catch (err) {
      console.error(`✗ Failed to enrich ${asset.id}:`, err)
    }

    await delay(500)
  }

  console.log('Enrichment complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

