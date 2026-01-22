import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { validateApiKey, generateRequestId } from '../apiAuth'

describe('apiAuth', () => {
  describe('validateApiKey', () => {
    it('should return API_KEY_REQUIRED when no header is present', () => {
      const request = new NextRequest('http://localhost/api/test')
      const result = validateApiKey(request)

      expect(result.valid).toBe(false)
      expect(result.error?.error.code).toBe('API_KEY_REQUIRED')
    })

    it('should return API_KEY_INVALID for short keys', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'X-Fauna-API-Key': 'short' },
      })
      const result = validateApiKey(request)

      expect(result.valid).toBe(false)
      expect(result.error?.error.code).toBe('API_KEY_INVALID')
    })

    it('should return valid for keys >= 10 characters', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'X-Fauna-API-Key': 'valid-api-key-1234567890' },
      })
      const result = validateApiKey(request)

      expect(result.valid).toBe(true)
      expect(result.userId).toBeDefined()
    })
  })

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()

      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })
  })
})
