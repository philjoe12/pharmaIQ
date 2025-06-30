import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
    message: string;
    metric: string;
    value: number;
    rating: "good" | "needs-improvement" | "poor";
}>>;
export declare function GET(request: NextRequest): Promise<NextResponse<{
    period: string;
    metrics: {
        CLS: {
            average: number;
            rating: string;
            samples: number;
        };
        FID: {
            average: number;
            rating: string;
            samples: number;
        };
        FCP: {
            average: number;
            rating: string;
            samples: number;
        };
        LCP: {
            average: number;
            rating: string;
            samples: number;
        };
        TTFB: {
            average: number;
            rating: string;
            samples: number;
        };
    };
    trends: {
        improving: string[];
        stable: string[];
        declining: string[];
    };
    topPages: {
        url: string;
        lcp: number;
        cls: number;
        fid: number;
    }[];
}> | NextResponse<{
    error: string;
}>>;
