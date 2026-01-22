import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, generateRequestId, addStandardHeaders } from '@/lib/apiAuth'
import { SearchResponse, ApiError } from '@/lib/apiTypes'
import { getCollectionById, getAssetsForCollection } from '@/lib/catalog'

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()

  const authError = requireAuth(request)
  if (authError) {
    return addStandardHeaders(authError, requestId)
  }

  const collectionId = request.nextUrl.searchParams.get('collection')
  if (!collectionId) {
    const error: ApiError = {
      error: {
        code: 'MISSING_COLLECTION',
        message: 'Search requires a collection parameter',
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
  }

  const collection = getCollectionById(collectionId)
  if (!collection) {
    const error: ApiError = {
      error: {
        code: 'COLLECTION_NOT_FOUND',
        message: `Collection '${collectionId}' not found`,
        meta: { id: collectionId },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 404 }), requestId)
  }

  const q = request.nextUrl.searchParams.get('q')
  const tagsParam = request.nextUrl.searchParams.get('tags')
  const tagMode = (request.nextUrl.searchParams.get('tagMode') || 'all') as 'all' | 'any'
  const excludeTagsParam = request.nextUrl.searchParams.get('excludeTags')
  const minScore = parseFloat(request.nextUrl.searchParams.get('minScore') || '0')
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '10', 10),
    50
  )
  const cursor = request.nextUrl.searchParams.get('cursor')

  let assets = getAssetsForCollection(collectionId)

  // Apply filters
  const appliedFilters: SearchResponse['appliedFilters'] = {}

  if (q) {
    appliedFilters.q = q
    const queryLower = q.toLowerCase()
    assets = assets.filter(a => {
      return (
        a.title.toLowerCase().includes(queryLower) ||
        a.description.toLowerCase().includes(queryLower) ||
        a.tags.some(tag => tag.toLowerCase().includes(queryLower))
      )
    })
  }

  if (tagsParam) {
    const tags = tagsParam.split(',').map(t => t.trim())
    appliedFilters.tags = tags
    appliedFilters.tagMode = tagMode

    if (tagMode === 'all') {
      assets = assets.filter(a => tags.every(tag => a.tags.includes(tag)))
    } else {
      assets = assets.filter(a => tags.some(tag => a.tags.includes(tag)))
    }
  }

  if (excludeTagsParam) {
    const excludeTags = excludeTagsParam.split(',').map(t => t.trim())
    appliedFilters.excludeTags = excludeTags
    assets = assets.filter(a => !excludeTags.some(tag => a.tags.includes(tag)))
  }

  // Calculate relevance scores (simple keyword matching for now)
  const results = assets.map(asset => {
    let score = 0.5 // base score

    if (q) {
      const queryLower = q.toLowerCase()
      if (asset.title.toLowerCase().includes(queryLower)) score += 0.3
      if (asset.description.toLowerCase().includes(queryLower)) score += 0.1
      const matchingTags = asset.tags.filter(tag =>
        tag.toLowerCase().includes(queryLower)
      )
      score += matchingTags.length * 0.05
    }

    score = Math.min(score, 1.0)

    return {
      asset,
      score,
    }
  })

  // Filter by minScore
  if (minScore > 0) {
    appliedFilters.minScore = minScore
  }
  const filtered = results.filter(r => r.score >= minScore)

  // Sort by relevance desc, then id asc
  filtered.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.001) {
      return b.score - a.score
    }
    return a.asset.id.localeCompare(b.asset.id)
  })

  // Apply cursor if provided
  let paginated = filtered
  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString())
      const lastScore = decoded.s
      const lastId = decoded.id
      const lastIndex = filtered.findIndex(
        r => r.score === lastScore && r.asset.id === lastId
      )
      if (lastIndex >= 0) {
        paginated = filtered.slice(lastIndex + 1)
      }
    } catch (e) {
      const error: ApiError = {
        error: {
          code: 'INVALID_CURSOR',
          message: 'Cursor is malformed or expired',
          meta: { cursor },
        },
      }
      return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
    }
  }

  // Apply limit
  const limited = paginated.slice(0, limit)

  const response: SearchResponse = {
    collection: collectionId,
    appliedFilters,
    results: limited.map(({ asset, score }) => ({
      id: asset.id,
      title: asset.title,
      description: asset.description,
      relevanceScore: score,
      tags: asset.tags,
      match: {
        title: q ? asset.title.toLowerCase().includes(q.toLowerCase()) : false,
        description: q ? asset.description.toLowerCase().includes(q.toLowerCase()) : false,
        tags: q
          ? asset.tags.filter(tag =>
              tag.toLowerCase().includes(q.toLowerCase())
            )
          : asset.tags.filter(tag =>
              appliedFilters.tags?.includes(tag)
            ),
      },
    })),
  }

  // Generate next cursor if there are more items
  if (paginated.length > limit) {
    const last = limited[limited.length - 1]
    response.nextCursor = Buffer.from(
      JSON.stringify({ s: last.relevanceScore, id: last.id })
    ).toString('base64')
  } else {
    response.nextCursor = null
  }

  const rateLimit = {
    limit: 100,
    remaining: 99,
    reset: Math.floor(Date.now() / 1000) + 3600,
  }

  return addStandardHeaders(
    NextResponse.json(response),
    requestId,
    rateLimit
  )
}
