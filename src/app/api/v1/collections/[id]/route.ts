import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, generateRequestId, addStandardHeaders } from '@/lib/apiAuth'
import { CollectionResponse, ApiError } from '@/lib/apiTypes'
import { getCollectionById, getAssetsForCollection } from '@/lib/catalog'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId()

  const authError = requireAuth(request)
  if (authError) {
    return addStandardHeaders(authError, requestId)
  }

  const collection = getCollectionById(params.id)
  if (!collection) {
    const error: ApiError = {
      error: {
        code: 'COLLECTION_NOT_FOUND',
        message: `Collection '${params.id}' not found`,
        meta: { id: params.id },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 404 }), requestId)
  }

  const includeAssets = request.nextUrl.searchParams.get('includeAssets') === 'true'
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '20', 10),
    100
  )
  const cursor = request.nextUrl.searchParams.get('cursor')

  const response: CollectionResponse = {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    assetCount: collection.assets?.length || 0,
    styleContract: collection.styleContract,
    defaultPalette: collection.defaultPalette,
    styleDescriptors: collection.styleDescriptors,
    availableTags: collection.availableTags,
  }

  if (includeAssets) {
    let assets = getAssetsForCollection(params.id)
    
    // Sort by id asc for deterministic pagination
    assets = assets.sort((a, b) => a.id.localeCompare(b.id))

    // Apply cursor if provided
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString())
        const lastId = decoded.id
        const lastIndex = assets.findIndex(a => a.id === lastId)
        if (lastIndex >= 0) {
          assets = assets.slice(lastIndex + 1)
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
    const paginatedAssets = assets.slice(0, limit)
    response.assets = paginatedAssets.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      tags: a.tags,
    }))

    // Generate next cursor if there are more items
    if (assets.length > limit) {
      const lastAsset = paginatedAssets[paginatedAssets.length - 1]
      response.nextCursor = Buffer.from(
        JSON.stringify({ id: lastAsset.id })
      ).toString('base64')
    } else {
      response.nextCursor = null
    }
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
