import { describe, it, expect } from 'vitest'
import { GET } from '../search/route'
import { NextRequest } from 'next/server'

const VALID_API_KEY = 'valid-api-key-1234567890'

describe('GET /api/v1/search', () => {
  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost/api/v1/search')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should require collection parameter', async () => {
    const request = new NextRequest('http://localhost/api/v1/search', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('MISSING_COLLECTION')
  })

  it('should return 404 for non-existent collection', async () => {
    const request = new NextRequest('http://localhost/api/v1/search?collection=non-existent', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('COLLECTION_NOT_FOUND')
  })

  it('should search by query', async () => {
    const request = new NextRequest('http://localhost/api/v1/search?collection=engineers-manual&q=collaboration', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.collection).toBe('engineers-manual')
    expect(data.results).toBeInstanceOf(Array)
    expect(data.appliedFilters).toHaveProperty('q', 'collaboration')
    if (data.results.length > 0) {
      expect(data.results[0]).toHaveProperty('relevanceScore')
      expect(data.results[0]).toHaveProperty('match')
    }
  })

  it('should filter by tags with tagMode=all', async () => {
    const request = new NextRequest('http://localhost/api/v1/search?collection=engineers-manual&tags=teamwork,collaboration&tagMode=all', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.appliedFilters.tags).toEqual(['teamwork', 'collaboration'])
    expect(data.appliedFilters.tagMode).toBe('all')
  })

  it('should exclude tags', async () => {
    const request = new NextRequest('http://localhost/api/v1/search?collection=engineers-manual&excludeTags=people', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.appliedFilters.excludeTags).toEqual(['people'])
  })

  it('should paginate with cursor', async () => {
    const request1 = new NextRequest('http://localhost/api/v1/search?collection=engineers-manual&limit=2', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response1 = await GET(request1)
    const data1 = await response1.json()

    expect(response1.status).toBe(200)
    if (data1.results.length >= 2) {
      expect(data1.nextCursor).toBeDefined()

      const request2 = new NextRequest(`http://localhost/api/v1/search?collection=engineers-manual&limit=2&cursor=${data1.nextCursor}`, {
        headers: { 'X-Fauna-API-Key': VALID_API_KEY },
      })
      const response2 = await GET(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.results[0].id).not.toBe(data1.results[0].id)
    }
  })

  it('should return 400 for invalid cursor', async () => {
    const request = new NextRequest('http://localhost/api/v1/search?collection=engineers-manual&cursor=invalid', {
      headers: { 'X-Fauna-API-Key': VALID_API_KEY },
    })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('INVALID_CURSOR')
  })
})
