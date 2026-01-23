import { NextRequest, NextResponse } from 'next/server'
import { generateRequestId, addStandardHeaders } from '@/lib/apiAuth'
import { MetaResponse } from '@/lib/apiTypes'

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()

  const response: MetaResponse = {
    auth: {
      type: 'apiKey',
      header: 'X-Fauna-API-Key',
      getKeyUrl: 'https://fauna.dev/account',
    },
    openapi: 'https://fauna.dev/openapi.json',
    version: 'v1',
  }

  return addStandardHeaders(NextResponse.json(response), requestId)
}
