import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../assets/[id]/render/route'
import { NextRequest } from 'next/server'
import { getUserPalettes, setPalette } from '@/lib/paletteStorage'

const VALID_API_KEY = 'valid-api-key-1234567890'
const USER_ID = 'valid-ap'

describe('GET /api/v1/assets/:id/render', () => {
  beforeEach(() => {
    const palettes = getUserPalettes(USER_ID)
    palettes.clear()
    setPalette(USER_ID, {
      id: 'test-palette',
      name: 'Test',
      colors: { fg: '#1a1a1a', bg: '#ffffff' },
      createdAt: new Date().toISOString(),
    })
  })

  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1/render')
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })

    expect(response.status).toBe(401)
  })

  it('should require color source (paletteId or fg)', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1/render', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('MISSING_COLOR')
  })

  it('should reject both paletteId and inline colors', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1/render?paletteId=test-palette&fg=1a1a1a', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('COLOR_CONFLICT')
  })

  it('should render with paletteId', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1/render?paletteId=test-palette', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('renderId')
    expect(data).toHaveProperty('url')
    expect(data).toHaveProperty('params')
    expect(data.params.paletteId).toBe('test-palette')
    expect(data.params.format).toBeDefined()
    expect(data.params.size).toBeDefined()
  })

  it('should render with inline colors', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1/render?fg=1a1a1a&bg=ffffff', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.params.fg).toBe('1a1a1a')
    expect(data.params.bg).toBe('ffffff')
  })

  it('should reject invalid color format', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1/render?fg=fff', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('INVALID_COLOR')
  })

  it('should reject invalid format', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1/render?fg=1a1a1a&format=gif', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('INVALID_FORMAT')
  })

  it('should reject invalid size', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1/render?fg=1a1a1a&size=256', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('INVALID_SIZE')
  })

  it('should return 404 for non-existent palette', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1/render?paletteId=non-existent', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('PALETTE_NOT_FOUND')
  })

  it('should return 400 for incompatible palette', async () => {
    // Create a palette missing required slots
    setPalette(USER_ID, {
      id: 'incomplete-palette',
      name: 'Incomplete',
      colors: {}, // Missing fg
      createdAt: new Date().toISOString(),
    })

    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1/render?paletteId=incomplete-palette', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('PALETTE_INCOMPATIBLE')
  })
})
