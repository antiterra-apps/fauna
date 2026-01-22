import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, generateRequestId, addStandardHeaders, validateApiKey } from '@/lib/apiAuth'
import { PalettesResponse, PaletteResponse, ApiError } from '@/lib/apiTypes'
import { UserPalette } from '@/lib/types'
import { getUserPalettes, hasPalette, setPalette } from '@/lib/paletteStorage'

function validatePaletteId(id: string): { valid: boolean; reason?: string } {
  if (!/^[a-z][a-z0-9-]{2,47}$/.test(id)) {
    return { valid: false, reason: 'Must be lowercase letters, numbers, hyphens, start with letter, 3-48 chars' }
  }
  if (id.includes('--')) {
    return { valid: false, reason: 'No consecutive hyphens allowed' }
  }
  if (id.endsWith('-')) {
    return { valid: false, reason: 'No trailing hyphen allowed' }
  }
  return { valid: true }
}

function validateColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color)
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()

  const auth = validateApiKey(request)
  if (!auth.valid) {
    return addStandardHeaders(NextResponse.json(auth.error, { status: 401 }), requestId)
  }

  const userId = auth.userId!
  const palettes = Array.from(getUserPalettes(userId).values())

  const response: PalettesResponse = { palettes }

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

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()

  const auth = validateApiKey(request)
  if (!auth.valid) {
    return addStandardHeaders(NextResponse.json(auth.error, { status: 401 }), requestId)
  }

  const userId = auth.userId!
  const body = await request.json()

  // Validate palette ID
  const idValidation = validatePaletteId(body.id)
  if (!idValidation.valid) {
    const error: ApiError = {
      error: {
        code: 'INVALID_PALETTE_ID',
        message: `Palette ID must be lowercase letters, numbers, hyphens, start with letter, 3-48 chars`,
        meta: { id: body.id, reason: idValidation.reason },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
  }

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

  // Check if palette already exists
  if (hasPalette(userId, body.id)) {
    const error: ApiError = {
      error: {
        code: 'PALETTE_EXISTS',
        message: `Palette '${body.id}' already exists`,
        meta: { existingId: body.id },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 409 }), requestId)
  }

  // TODO: Check idempotency key
  const idempotencyKey = request.headers.get('Idempotency-Key')
  // For now, skip idempotency check - implement later with proper storage

  // Create palette
  const palette: UserPalette = {
    id: body.id,
    name: body.name,
    colors: {
      fg: body.colors.fg,
      bg: body.colors.bg,
    },
    createdAt: new Date().toISOString(),
  }

  setPalette(userId, palette)

  const rateLimit = {
    limit: 100,
    remaining: 99,
    reset: Math.floor(Date.now() / 1000) + 3600,
  }

  return addStandardHeaders(
    NextResponse.json(palette, { status: 201 }),
    requestId,
    rateLimit
  )
}
