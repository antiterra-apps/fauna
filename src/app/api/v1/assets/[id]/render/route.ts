import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, generateRequestId, addStandardHeaders, validateApiKey } from '@/lib/apiAuth'
import { RenderResponse, ApiError } from '@/lib/apiTypes'
import { getAssetById, getCollectionById } from '@/lib/catalog'
import { renderAsset, generateRenderId } from '@/lib/renderPipeline'
import { getPalette } from '@/lib/paletteStorage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId()

  const auth = validateApiKey(request)
  if (!auth.valid) {
    return addStandardHeaders(NextResponse.json(auth.error, { status: 401 }), requestId)
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

  const collection = getCollectionById(asset.collectionId)
  if (!collection) {
    const error: ApiError = {
      error: {
        code: 'COLLECTION_NOT_FOUND',
        message: `Collection '${asset.collectionId}' not found`,
        meta: { id: asset.collectionId },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 404 }), requestId)
  }

  // Get color parameters
  const paletteId = request.nextUrl.searchParams.get('paletteId')
  const fg = request.nextUrl.searchParams.get('fg')
  const bg = request.nextUrl.searchParams.get('bg')

  // Validate color source (mutually exclusive)
  if (paletteId && (fg || bg)) {
    const error: ApiError = {
      error: {
        code: 'COLOR_CONFLICT',
        message: 'Cannot use both paletteId and inline colors (fg/bg). Choose one.',
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
  }

  if (!paletteId && !fg) {
    const error: ApiError = {
      error: {
        code: 'MISSING_COLOR',
        message: 'Render requires paletteId or fg color',
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
  }

  // Get colors
  let finalFg: string
  let finalBg: string | undefined

  if (paletteId) {
    const userId = auth.userId!
    const palette = getPalette(userId, paletteId)

    if (!palette) {
      const error: ApiError = {
        error: {
          code: 'PALETTE_NOT_FOUND',
          message: `Palette '${paletteId}' not found`,
          meta: { id: paletteId },
        },
      }
      return addStandardHeaders(NextResponse.json(error, { status: 404 }), requestId)
    }

    // Validate palette compatibility
    const requiredSlots = collection.styleContract.slots
    const providedSlots: string[] = []
    if (palette.colors.fg) providedSlots.push('fg')
    if (palette.colors.bg) providedSlots.push('bg')

    const missingSlots = requiredSlots.filter(slot => !providedSlots.includes(slot))
    if (missingSlots.length > 0) {
      const error: ApiError = {
        error: {
          code: 'PALETTE_INCOMPATIBLE',
          message: `Palette '${paletteId}' is missing required color slots for this collection`,
          meta: {
            paletteId,
            collectionId: collection.id,
            requiredSlots,
            providedSlots,
          },
        },
      }
      return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
    }

    finalFg = palette.colors.fg
    finalBg = palette.colors.bg
  } else {
    // Validate inline colors
    if (!/^[0-9a-fA-F]{6}$/.test(fg!)) {
      const error: ApiError = {
        error: {
          code: 'INVALID_COLOR',
          message: 'Color must be 6-digit hex (e.g., 1a1a1a)',
          meta: { field: 'fg', value: fg },
        },
      }
      return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
    }

    if (bg && !/^[0-9a-fA-F]{6}$/.test(bg)) {
      const error: ApiError = {
        error: {
          code: 'INVALID_COLOR',
          message: 'Color must be 6-digit hex (e.g., 1a1a1a)',
          meta: { field: 'bg', value: bg },
        },
      }
      return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
    }

    finalFg = `#${fg}`
    finalBg = bg ? `#${bg}` : undefined
  }

  // Get format and size
  const formatParam = request.nextUrl.searchParams.get('format')
  const sizeParam = request.nextUrl.searchParams.get('size')

  const format = (formatParam || collection.styleContract.defaultFormat) as 'webp' | 'png' | 'svg'
  const size = sizeParam ? parseInt(sizeParam, 10) : collection.styleContract.defaultSize

  // Validate format
  if (!collection.styleContract.allowedFormats.includes(format)) {
    const error: ApiError = {
      error: {
        code: 'INVALID_FORMAT',
        message: `Format '${format}' not allowed for this collection`,
        meta: { value: format, allowed: collection.styleContract.allowedFormats },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
  }

  // Validate size
  if (!collection.styleContract.allowedSizes.includes(size)) {
    const error: ApiError = {
      error: {
        code: 'INVALID_SIZE',
        message: `Size ${size} not allowed for this collection`,
        meta: { value: size, allowed: collection.styleContract.allowedSizes },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 400 }), requestId)
  }

  // Get SVG URL (use potrace SVG)
  const svgUrl = asset.metadata?.svgPotraceUrl
  if (!svgUrl) {
    const error: ApiError = {
      error: {
        code: 'ASSET_NOT_FOUND',
        message: `Asset '${params.id}' does not have a renderable source`,
        meta: { id: params.id },
      },
    }
    return addStandardHeaders(NextResponse.json(error, { status: 404 }), requestId)
  }

  // Render the asset
  const cdnUrl = await renderAsset(svgUrl, {
    assetId: params.id,
    fg: finalFg,
    bg: finalBg,
    format,
    size,
  })

  // Generate renderId
  const renderId = generateRenderId(
    params.id,
    paletteId || undefined,
    paletteId ? undefined : fg || undefined,
    paletteId ? undefined : bg || undefined,
    format,
    size
  )

  const response: RenderResponse = {
    renderId,
    url: cdnUrl,
    params: {
      assetId: params.id,
      ...(paletteId ? { paletteId } : { fg: fg!, bg: bg || 'transparent' }),
      format,
      size,
    },
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
