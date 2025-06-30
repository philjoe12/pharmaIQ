import { NextResponse } from 'next/server';
const API_BASE_URL = process.env.API_GATEWAY_URL || 'http://localhost:3001';
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const condition = searchParams.get('condition');
        const userType = searchParams.get('userType') || 'general';
        const limit = searchParams.get('limit') || '10';
        if (!condition) {
            return NextResponse.json({ error: 'Condition parameter is required' }, { status: 400 });
        }
        const apiUrl = `${API_BASE_URL}/drugs/discovery/conditions?condition=${encodeURIComponent(condition)}&userType=${userType}&limit=${limit}`;
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
    }
    catch (error) {
        console.error('Condition search API error:', error);
        return NextResponse.json({ error: 'Failed to search by condition' }, { status: 500 });
    }
}
