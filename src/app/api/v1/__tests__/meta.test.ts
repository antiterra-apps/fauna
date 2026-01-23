import { describe, it, expect } from 'vitest'
import { GET } from '../meta/route'
import { NextRequest } from 'next/server'

describe('GET /api/v1/meta', () => {
  it('should return API metadata without authentication', async () => {
    const request = new NextRequest('http://localhost/api/v1/meta')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      auth: {
        type: 'apiKey',
        header: 'X-Fauna-API-Key',
        getKeyUrl: 'https://fauna.dev/account',
      },
      openapi: 'https://fauna.dev/openapi.json',
      version: 'v1',
    })
    expect(response.headers.get('X-Request-Id')).toBeDefined()
  })
})
