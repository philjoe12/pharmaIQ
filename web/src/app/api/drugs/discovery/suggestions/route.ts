import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_GATEWAY_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const basedOn = searchParams.get('basedOn');
    const condition = searchParams.get('condition');
    const userType = searchParams.get('userType') || 'general';

    const queryParams = new URLSearchParams();
    if (basedOn) queryParams.set('basedOn', basedOn);
    if (condition) queryParams.set('condition', condition);
    queryParams.set('userType', userType);

    const apiUrl = `${API_BASE_URL}/drugs/discovery/suggestions?${queryParams.toString()}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}