import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../collections/route'
import { GET as GET_COLLECTION } from '../collections/[id]/route'
import { NextRequest } from 'next/server'

const VALID_API_KEY = 'valid-api-key-1234567890'

describe('GET /api/v1/collections', () => {
  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost/api/v1/collections')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error.code).toBe('API_KEY_REQUIRED')
  })

  it('should return collections list', async () => {
    const request = new NextRequest('http://localhost/api/v1/collections', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.collections).toBeInstanceOf(Array)
    expect(data.collections.length).toBeGreaterThan(0)
    expect(data.collections[0]).toHaveProperty('id')
    expect(data.collections[0]).toHaveProperty('title')
    expect(data.collections[0]).toHaveProperty('styleContract')
    expect(data.collections[0]).toHaveProperty('availableTags')
  })
})

describe('GET /api/v1/collections/:id', () => {
  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost/api/v1/collections/engineers-manual')
    const response = await GET_COLLECTION(request, { params: { id: 'engineers-manual' } })

    expect(response.status).toBe(401)
  })

  it('should return collection without assets by default', async () => {
    const request = new NextRequest('http://localhost/api/v1/collections/engineers-manual', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET_COLLECTION(request, { params: { id: 'engineers-manual' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('engineers-manual')
    expect(data.assets).toBeUndefined()
  })

  it('should return collection with assets when includeAssets=true', async () => {
    const request = new NextRequest('http://localhost/api/v1/collections/engineers-manual?includeAssets=true', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET_COLLECTION(request, { params: { id: 'engineers-manual' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.assets).toBeInstanceOf(Array)
    expect(data.assets!.length).toBeGreaterThan(0)
  })

  it('should paginate assets with cursor', async () => {
    const request1 = new NextRequest('http://localhost/api/v1/collections/engineers-manual?includeAssets=true&limit=2', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response1 = await GET_COLLECTION(request1, { params: { id: 'engineers-manual' } })
    const data1 = await response1.json()

    expect(response1.status).toBe(200)
    expect(data1.assets).toHaveLength(2)
    expect(data1.nextCursor).toBeDefined()

    const request2 = new NextRequest(`http://localhost/api/v1/collections/engineers-manual?includeAssets=true&limit=2&cursor=${data1.nextCursor}`, {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response2 = await GET_COLLECTION(request2, { params: { id: 'engineers-manual' } })
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2.assets).toBeInstanceOf(Array)
    // Should have different assets
    expect(data2.assets![0].id).not.toBe(data1.assets![0].id)
  })

  it('should return 404 for non-existent collection', async () => {
    const request = new NextRequest('http://localhost/api/v1/collections/non-existent', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET_COLLECTION(request, { params: { id: 'non-existent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('COLLECTION_NOT_FOUND')
  })

  it('should return 400 for invalid cursor', async () => {
    const request = new NextRequest('http://localhost/api/v1/collections/engineers-manual?includeAssets=true&cursor=invalid', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET_COLLECTION(request, { params: { id: 'engineers-manual' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('INVALID_CURSOR')
  })
})
