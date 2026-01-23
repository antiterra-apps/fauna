import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, generateRequestId, addStandardHeaders } from '@/lib/apiAuth'
import { CollectionsResponse } from '@/lib/apiTypes'
import { collections } from '@/lib/catalog'

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()

  const authError = requireAuth(request)
  if (authError) {
    return addStandardHeaders(authError, requestId)
  }

  // TODO: Get rate limit info from rate limiter
  const rateLimit = {
    limit: 100,
    remaining: 99,
    reset: Math.floor(Date.now() / 1000) + 3600,
  }

  const response: CollectionsResponse = {
    collections: collections.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      assetCount: c.assetCount,
      styleContract: c.styleContract,
      defaultPalette: c.defaultPalette,
      styleDescriptors: c.styleDescriptors,
      availableTags: c.availableTags,
    })),
  }

  return addStandardHeaders(
    NextResponse.json(response),
    requestId,
    rateLimit
  )
}
