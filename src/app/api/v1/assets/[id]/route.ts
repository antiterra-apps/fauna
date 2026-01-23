import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, generateRequestId, addStandardHeaders } from '@/lib/apiAuth'
import { AssetResponse, ApiError } from '@/lib/apiTypes'
import { getAssetById } from '@/lib/catalog'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId()

  const authError = requireAuth(request)
  if (authError) {
    return addStandardHeaders(authError, requestId)
  }

  const asset = getAssetById(params.id)
  if (!asset) {
    const error: ApiError = {
      error: {
        code: 'ASSET_NOT_FOUND',
        message: `Asset '${params.id}' not found`,
        meta: { id: params.id },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 404 }), requestId)
  }

  const response: AssetResponse = {
    id: asset.id,
    title: asset.title,
    collectionId: asset.collectionId,
    description: asset.description,
    tags: asset.tags,
    relatedAssets: asset.relatedAssets,
    ...(asset.metadata?.normalizedSvgUrl && { svgUrl: asset.metadata.normalizedSvgUrl }),
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
