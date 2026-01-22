import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, generateRequestId, addStandardHeaders, validateApiKey } from '@/lib/apiAuth'
import { PaletteResponse, ApiError } from '@/lib/apiTypes'
import { UserPalette } from '@/lib/types'
import { getPalette, setPalette, hasPalette, deletePalette } from '@/lib/paletteStorage'

function validateColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId()

  const auth = validateApiKey(request)
  if (!auth.valid) {
    return addStandardHeaders(NextResponse.json(auth.error, { status: 401 }), requestId)
  }

  const userId = auth.userId!
  const body = await request.json()

  // Validate colors
  if (!body.colors?.fg || !validateColor(body.colors.fg)) {
    const error: ApiError = {
      error: {
        code: 'INVALID_COLOR',
        message: 'Color must be 6-digit hex (e.g., #1a1a1a)',
        meta: { field: 'colors.fg', value: body.colors?.fg },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
  }

  if (body.colors.bg && !validateColor(body.colors.bg)) {
    const error: ApiError = {
      error: {
        code: 'INVALID_COLOR',
        message: 'Color must be 6-digit hex (e.g., #1a1a1a)',
        meta: { field: 'colors.bg', value: body.colors.bg },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
  }

  const existing = getPalette(userId, params.id)

  if (!existing) {
    const error: ApiError = {
      error: {
        code: 'PALETTE_NOT_FOUND',
        message: `Palette '${params.id}' not found`,
        meta: { id: params.id },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 404 }), requestId)
  }

  // Full replace
  const updated: UserPalette = {
    id: params.id,
    name: body.name,
    colors: {
      fg: body.colors.fg,
      bg: body.colors.bg,
    },
    createdAt: existing.createdAt,
  }

  setPalette(userId, updated)

  const rateLimit = {
    limit: 100,
    remaining: 99,
    reset: Math.floor(Date.now() / 1000) + 3600,
  }

  return addStandardHeaders(
    NextResponse.json(updated),
    requestId,
    rateLimit
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId()

  const auth = validateApiKey(request)
  if (!auth.valid) {
    return addStandardHeaders(NextResponse.json(auth.error, { status: 401 }), requestId)
  }

  const userId = auth.userId!

  if (!hasPalette(userId, params.id)) {
    const error: ApiError = {
      error: {
        code: 'PALETTE_NOT_FOUND',
        message: `Palette '${params.id}' not found`,
        meta: { id: params.id },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 404 }), requestId)
  }

  deletePalette(userId, params.id)

  const rateLimit = {
    limit: 100,
    remaining: 99,
    reset: Math.floor(Date.now() / 1000) + 3600,
  }

  return addStandardHeaders(
    new NextResponse(null, { status: 204 }),
    requestId,
    rateLimit
  )
}
