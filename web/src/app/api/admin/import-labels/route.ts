import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api:3001';

export async function POST(request: NextRequest) {
  try {
    // This endpoint triggers the import of Labels.json data
    const response = await fetch(`${API_GATEWAY_URL}/drugs/import-labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Import failed: ${error}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Labels import initiated',
      ...result
    });
  } catch (error) {
    console.error('Error importing labels:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to import labels',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to trigger label import',
    endpoint: '/api/admin/import-labels',
    method: 'POST'
  });
}