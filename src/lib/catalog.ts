import { Asset, Collection, Palette } from './types'

const warmPalette: Palette = {
  bg: '#faf8f5',
  fg: '#2d2416',
}

const ukiyoePalette: Palette = {
  bg: '#f5f0e6',
  fg: '#1a1a2e',
}

const engineersManualAssets: Asset[] = [
  {
    id: 'engineers-manual-1',
    title: 'Collaboration',
    imageUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_collaboration_01.png",
    isFree: true,
    collectionId: 'engineers-manual',
    description: 'Two people working together at a shared desk, one pointing at a document',
    tags: ['teamwork', 'collaboration', 'people', 'meeting'],
    relatedAssets: [],
    metadata: {
      blobUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_collaboration_01.png",
      svgUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/engineers-manual-1.svg",
      svgPotraceUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-1-potrace.svg",
    },
  },
  {
    id: 'engineers-manual-2',
    title: 'Access',
    imageUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_access_01.png",
    isFree: true,
    collectionId: 'engineers-manual',
    description: 'Security and access control illustration showing authentication flow',
    tags: ['security', 'access', 'authentication', 'infrastructure'],
    relatedAssets: [],
    metadata: {
      blobUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_access_01.png",
      svgUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/engineers-manual-2.svg",
      svgPotraceUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-2-potrace.svg",
    },
  },
  {
    id: 'engineers-manual-3',
    title: 'Infrastructure',
    imageUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_infrastructure_02.png",
    isFree: true,
    collectionId: 'engineers-manual',
    description: 'Server infrastructure and network architecture diagram',
    tags: ['infrastructure', 'servers', 'network', 'data'],
    relatedAssets: [],
    metadata: {
      blobUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_infrastructure_02.png",
      svgUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/engineers-manual-3.svg",
      svgPotraceUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-3-potrace.svg",
    },
  },
  {
    id: 'engineers-manual-4',
    title: 'Infrastructure',
    imageUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_infrastructure_04.png",
    isFree: true,
    collectionId: 'engineers-manual',
    description: 'Cloud infrastructure and distributed systems architecture',
    tags: ['infrastructure', 'cloud', 'distributed', 'data'],
    relatedAssets: [],
    metadata: {
      blobUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_infrastructure_04.png",
      svgUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/engineers-manual-4.svg",
      svgPotraceUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-4-potrace.svg",
    },
  },
]

const ukiyoeAssets: Asset[] = []

function computeRelatedAssets(asset: Asset, allAssets: Asset[]): string[] {
  const sameCollection = allAssets.filter(a => 
    a.collectionId === asset.collectionId && a.id !== asset.id
  )
  
  // Find assets with similar tags
  const related = sameCollection
    .map(a => ({
      id: a.id,
      similarity: a.tags.filter(tag => asset.tags.includes(tag)).length,
    }))
    .filter(a => a.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .map(a => a.id)
  
  return related
}

function enrichAssets(assets: Asset[]): Asset[] {
  return assets.map(asset => ({
    ...asset,
    relatedAssets: computeRelatedAssets(asset, assets),
  }))
}

const enrichedEngineersManualAssets = enrichAssets(engineersManualAssets)
const enrichedUkiyoeAssets = enrichAssets(ukiyoeAssets)

function getAllTags(assets: Asset[]): string[] {
  const tagSet = new Set<string>()
  assets.forEach(asset => {
    asset.tags.forEach(tag => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
}

export const collections: Collection[] = [
  {
    id: 'engineers-manual',
    title: "Engineer's Manual",
    description: 'Technical illustrations for software documentation',
    assetCount: enrichedEngineersManualAssets.length,
    styleContract: {
      type: 'duotone',
      slots: ['fg', 'bg'],
      allowedFormats: ['webp', 'png', 'svg'],
      allowedSizes: [512, 1024, 2048],
      defaultFormat: 'webp',
      defaultSize: 1024,
    },
    defaultPalette: warmPalette,
    styleDescriptors: ['minimalist', 'line-art', 'technical', 'warm'],
    availableTags: getAllTags(enrichedEngineersManualAssets),
    assets: enrichedEngineersManualAssets,
  },
  {
    id: 'ukiyo-e',
    title: 'Ukiyo-e',
    description: 'Traditional Japanese woodblock print style illustrations',
    assetCount: enrichedUkiyoeAssets.length,
    styleContract: {
      type: 'duotone',
      slots: ['fg', 'bg'],
      allowedFormats: ['webp', 'png', 'svg'],
      allowedSizes: [512, 1024, 2048],
      defaultFormat: 'webp',
      defaultSize: 1024,
    },
    defaultPalette: ukiyoePalette,
    styleDescriptors: ['traditional', 'japanese', 'woodblock', 'artistic'],
    availableTags: getAllTags(enrichedUkiyoeAssets),
    assets: enrichedUkiyoeAssets,
  },
]

export function getAllAssets(): Asset[] {
  return collections.flatMap(c => c.assets || [])
}

export function getAssetById(id: string): Asset | undefined {
  return getAllAssets().find(a => a.id === id)
}

export function getCollectionById(id: string): Collection | undefined {
  return collections.find(c => c.id === id)
}

export function getAssetsForCollection(collectionId: string): Asset[] {
  return getAllAssets().filter(a => a.collectionId === collectionId)
}

