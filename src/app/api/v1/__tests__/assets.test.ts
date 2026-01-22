import { describe, it, expect } from 'vitest'
import { GET } from '../assets/[id]/route'
import { NextRequest } from 'next/server'

const VALID_API_KEY = 'valid-api-key-1234567890'

describe('GET /api/v1/assets/:id', () => {
  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1')
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })

    expect(response.status).toBe(401)
  })

  it('should return asset metadata', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/engineers-manual-1', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'engineers-manual-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('engineers-manual-1')
    expect(data).toHaveProperty('title')
    expect(data).toHaveProperty('collectionId')
    expect(data).toHaveProperty('description')
    expect(data).toHaveProperty('tags')
    expect(data).toHaveProperty('relatedAssets')
    expect(Array.isArray(data.tags)).toBe(true)
    expect(Array.isArray(data.relatedAssets)).toBe(true)
  })

  it('should return 404 for non-existent asset', async () => {
    const request = new NextRequest('http://localhost/api/v1/assets/non-existent', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request, { params: { id: 'non-existent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('ASSET_NOT_FOUND')
  })
})
