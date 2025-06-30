import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    status: string;
    service: string;
    timestamp: string;
}>>;
