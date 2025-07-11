import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.API_GATEWAY_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '10'

    const apiUrl = `${API_BASE_URL}/search/popular?limit=${limit}`
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Popular searches API error:', error)
    return NextResponse.json(
      { error: 'Failed to get popular searches' },
      { status: 500 }
    )
  }
}
