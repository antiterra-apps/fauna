import { Collection, Asset, UserPalette } from './types'

export type ApiError = {
  error: {
    code: string
    message: string
    meta?: Record<string, unknown>
  }
}

export type MetaResponse = {
  auth: {
    type: 'apiKey'
    header: 'X-Fauna-API-Key'
    getKeyUrl: string
  }
  openapi: string
  version: string
}

export type CollectionsResponse = {
  collections: Collection[]
}

export type CollectionResponse = Omit<Collection, 'assets'> & {
  assets?: Array<{
    id: string
    title: string
    description: string
    tags: string[]
  }>
  nextCursor?: string | null
}

export type AssetResponse = {
  id: string
  title: string
  collectionId: string
  description: string
  tags: string[]
  relatedAssets: string[]
  /** Normalized SVG URL (viewBox/sizing recalculated, themeable). Use this for API consumers. */
  svgUrl?: string
}

export type SearchResponse = {
  collection: string
  appliedFilters: {
    q?: string
    tags?: string[]
    tagMode?: 'all' | 'any'
    excludeTags?: string[]
    minScore?: number
  }
  results: Array<{
    id: string
    title: string
    description: string
    relevanceScore: number
    tags: string[]
    match: {
      title: boolean
      description: boolean
      tags: string[]
    }
  }>
  nextCursor?: string | null
}

export type PalettesResponse = {
  palettes: UserPalette[]
}

export type PaletteResponse = UserPalette

export type RenderResponse = {
  renderId: string
  url: string
  params: {
    assetId: string
    paletteId?: string
    fg?: string
    bg?: string
    format: 'webp' | 'png' | 'svg'
    size: number
  }
}
