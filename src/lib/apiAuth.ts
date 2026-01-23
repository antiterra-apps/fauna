import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from './apiTypes'

export function validateApiKey(request: NextRequest): { valid: boolean; userId?: string; error?: ApiError } {
  const apiKey = request.headers.get('X-Fauna-API-Key')

  if (!apiKey) {
    return {
      valid: false,
      error: {
        error: {
          code: 'API_KEY_REQUIRED',
          message: 'API key required. Get yours at https://fauna.dev/account',
        },
      },
    }
  }

  // TODO: Validate API key against database
  // For now, we'll do a basic check and extract user ID from key
  // In production, hash the key and look it up in the database
  const userId = extractUserIdFromKey(apiKey)

  if (!userId) {
    return {
      valid: false,
      error: {
        error: {
          code: 'API_KEY_INVALID',
          message: 'API key is invalid or has been revoked',
        },
      },
    }
  }

  return { valid: true, userId }
}

function extractUserIdFromKey(apiKey: string): string | null {
  // TODO: Implement proper API key validation
  // For now, accept any non-empty string as valid
  // In production, validate against database
  if (apiKey.length < 10) {
    return null
  }
  // Mock: use first 8 chars as user ID for now
  // In production, look up the key in the database
  return apiKey.substring(0, 8)
}

export function requireAuth(request: NextRequest): NextResponse | null {
  const auth = validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json(auth.error, { status: 401 })
  }
  return null
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export function addStandardHeaders(response: NextResponse, requestId: string, rateLimit?: {
  limit: number
  remaining: number
  reset: number
}): NextResponse {
  response.headers.set('X-Request-Id', requestId)
  if (rateLimit) {
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.reset.toString())
  }
  return response
}
