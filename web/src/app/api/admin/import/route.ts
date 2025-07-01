import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api:3001';

export async function POST(request: NextRequest) {
  try {
    // Trigger import of all drugs from Labels.json
    const response = await fetch(`${API_GATEWAY_URL}/admin/drugs/import`, {
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
      message: 'Drug import initiated successfully',
      ...result
    });
  } catch (error) {
    console.error('Error importing drugs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to import drugs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check import status
    const response = await fetch(`${API_GATEWAY_URL}/drugs/stats`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get import status');
    }

    const stats = await response.json();
    
    return NextResponse.json({
      success: true,
      stats,
      labelsJsonPath: '/app/data/Labels.json',
      totalDrugsInFile: 8,
      importEndpoint: '/api/admin/import (POST)'
    });
  } catch (error) {
    console.error('Error getting import status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get import status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}