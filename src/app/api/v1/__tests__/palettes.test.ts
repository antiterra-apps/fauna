import { describe, it, expect, beforeEach } from 'vitest'
import { GET, POST } from '../palettes/route'
import { PUT, DELETE } from '../palettes/[id]/route'
import { NextRequest } from 'next/server'
import { getUserPalettes, deletePalette } from '@/lib/paletteStorage'

const VALID_API_KEY = 'valid-api-key-1234567890'
const USER_ID = 'valid-ap'

describe('GET /api/v1/palettes', () => {
  beforeEach(() => {
    // Clear palettes for test user
    const palettes = getUserPalettes(USER_ID)
    palettes.clear()
  })

  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost/api/v1/palettes')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should return empty list initially', async () => {
    const request = new NextRequest('http://localhost/api/v1/palettes', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.palettes).toEqual([])
  })
})

describe('POST /api/v1/palettes', () => {
  beforeEach(() => {
    const palettes = getUserPalettes(USER_ID)
    palettes.clear()
  })

  it('should create a palette', async () => {
    const request = new NextRequest('http://localhost/api/v1/palettes', {
      method: 'POST',
      headers: {
        'X-Fauna-API-Key': VALID_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test-palette',
        name: 'Test Palette',
        colors: {
          fg: '#1a1a1a',
          bg: '#ffffff',
        },
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe('test-palette')
    expect(data.name).toBe('Test Palette')
    expect(data.colors.fg).toBe('#1a1a1a')
    expect(data.colors.bg).toBe('#ffffff')
    expect(data.createdAt).toBeDefined()
  })

  it('should reject invalid palette ID format', async () => {
    const request = new NextRequest('http://localhost/api/v1/palettes', {
      method: 'POST',
      headers: {
        'X-Fauna-API-Key': VALID_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'Invalid ID!',
        name: 'Test',
        colors: { fg: '#1a1a1a' },
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('INVALID_PALETTE_ID')
  })

  it('should reject invalid color format', async () => {
    const request = new NextRequest('http://localhost/api/v1/palettes', {
      method: 'POST',
      headers: {
        'X-Fauna-API-Key': VALID_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test-palette',
        name: 'Test',
        colors: { fg: '#fff' }, // Invalid: shorthand hex
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('INVALID_COLOR')
  })

  it('should reject duplicate palette ID', async () => {
    // Create first palette
    const request1 = new NextRequest('http://localhost/api/v1/palettes', {
      method: 'POST',
      headers: {
        'X-Fauna-API-Key': VALID_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'duplicate-test',
        name: 'First',
        colors: { fg: '#1a1a1a' },
      }),
    })
    await POST(request1)

    // Try to create duplicate
    const request2 = new NextRequest('http://localhost/api/v1/palettes', {
      method: 'POST',
      headers: {
        'X-Fauna-API-Key': VALID_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'duplicate-test',
        name: 'Second',
        colors: { fg: '#2a2a2a' },
      }),
    })
    const response = await POST(request2)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error.code).toBe('PALETTE_EXISTS')
  })

  it('should allow palette without bg (transparent)', async () => {
    const request = new NextRequest('http://localhost/api/v1/palettes', {
      method: 'POST',
      headers: {
        'X-Fauna-API-Key': VALID_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'transparent-test',
        name: 'Transparent',
        colors: { fg: '#1a1a1a' },
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.colors.bg).toBeUndefined()
  })
})

describe('PUT /api/v1/palettes/:id', () => {
  beforeEach(() => {
    const palettes = getUserPalettes(USER_ID)
    palettes.clear()
    // Create a palette to update
    palettes.set('update-test', {
      id: 'update-test',
      name: 'Original',
      colors: { fg: '#1a1a1a', bg: '#ffffff' },
      createdAt: new Date().toISOString(),
    })
  })

  it('should update existing palette', async () => {
    const request = new NextRequest('http://localhost/api/v1/palettes/update-test', {
      method: 'PUT',
      headers: {
        'X-Fauna-API-Key': VALID_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Updated',
        colors: { fg: '#2a2a2a', bg: '#f5f5f5' },
      }),
    })
    const response = await PUT(request, { params: { id: 'update-test' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe('Updated')
    expect(data.colors.fg).toBe('#2a2a2a')
    expect(data.colors.bg).toBe('#f5f5f5')
    expect(data.id).toBe('update-test') // ID should not change
  })

  it('should return 404 for non-existent palette', async () => {
    const request = new NextRequest('http://localhost/api/v1/palettes/non-existent', {
      method: 'PUT',
      headers: {
        'X-Fauna-API-Key': VALID_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test',
        colors: { fg: '#1a1a1a' },
      }),
    })
    const response = await PUT(request, { params: { id: 'non-existent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('PALETTE_NOT_FOUND')
  })
})

describe('DELETE /api/v1/palettes/:id', () => {
  beforeEach(() => {
    const palettes = getUserPalettes(USER_ID)
    palettes.clear()
    palettes.set('delete-test', {
      id: 'delete-test',
      name: 'To Delete',
      colors: { fg: '#1a1a1a' },
      createdAt: new Date().toISOString(),
    })
  })

  it('should delete existing palette', async () => {
    const request = new NextRequest('http://localhost/api/v1/palettes/delete-test', {
      method: 'DELETE',
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await DELETE(request, { params: { id: 'delete-test' } })

    expect(response.status).toBe(204)
  })

  it('should return 404 for non-existent palette', async () => {
    const request = new NextRequest('http://localhost/api/v1/palettes/non-existent', {
      method: 'DELETE',
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await DELETE(request, { params: { id: 'non-existent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('PALETTE_NOT_FOUND')
  })
})
