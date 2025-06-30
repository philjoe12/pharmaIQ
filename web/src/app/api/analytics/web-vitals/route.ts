import { NextRequest, NextResponse } from 'next/server';

interface WebVitalData {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
  url: string;
  userAgent: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const data: WebVitalData = await request.json();

    // Validate the incoming data
    if (!data.name || typeof data.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid web vital data' },
        { status: 400 }
      );
    }

    // Log web vitals in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital Recorded:', {
        metric: data.name,
        value: data.value,
        rating: data.rating,
        url: data.url,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    }

    // In production, you would typically:
    // 1. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 2. Store in database for analysis
    // 3. Alert on poor performance metrics

    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics 4
      if (process.env.GA_MEASUREMENT_ID && process.env.GA_API_SECRET) {
        try {
          await fetch(
            `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`,
            {
              method: 'POST',
              body: JSON.stringify({
                client_id: data.id,
                events: [
                  {
                    name: 'web_vitals',
                    params: {
                      metric_name: data.name,
                      metric_value: Math.round(data.value),
                      metric_rating: data.rating,
                      page_location: data.url,
                      metric_delta: data.delta,
                      navigation_type: data.navigationType,
                    },
                  },
                ],
              }),
            }
          );
        } catch (error) {
          console.error('Failed to send to Google Analytics:', error);
        }
      }

      // Example: Store in database (you would implement this)
      // await storeWebVital(data);

      // Example: Alert on poor performance
      if (data.rating === 'poor') {
        console.warn(`Poor ${data.name} detected:`, {
          value: data.value,
          url: data.url,
          threshold: getThreshold(data.name),
        });
        
        // You could send alerts to Slack, email, etc.
        // await sendPerformanceAlert(data);
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Web vital recorded successfully',
        metric: data.name,
        value: data.value,
        rating: data.rating
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing web vital:', error);
    return NextResponse.json(
      { error: 'Failed to process web vital data' },
      { status: 500 }
    );
  }
}

// Helper function to get performance thresholds
function getThreshold(metric: string): number | null {
  const thresholds = {
    CLS: 0.1,      // Cumulative Layout Shift
    FID: 100,      // First Input Delay (ms)
    FCP: 1800,     // First Contentful Paint (ms)
    LCP: 2500,     // Largest Contentful Paint (ms)
    TTFB: 800,     // Time to First Byte (ms)
  };
  
  return thresholds[metric as keyof typeof thresholds] || null;
}

// GET endpoint for retrieving web vitals analytics (optional)
export async function GET(request: NextRequest) {
  try {
    // In a real application, you would query your database
    // and return aggregated web vitals data
    
    const mockData = {
      period: '7d',
      metrics: {
        CLS: { average: 0.05, rating: 'good', samples: 1250 },
        FID: { average: 45, rating: 'good', samples: 1180 },
        FCP: { average: 1200, rating: 'good', samples: 1300 },
        LCP: { average: 1800, rating: 'good', samples: 1290 },
        TTFB: { average: 400, rating: 'good', samples: 1310 },
      },
      trends: {
        improving: ['LCP', 'FCP'],
        stable: ['CLS', 'FID'],
        declining: ['TTFB'],
      },
      topPages: [
        { url: '/drugs/emgality', lcp: 1600, cls: 0.03, fid: 35 },
        { url: '/search', lcp: 1400, cls: 0.02, fid: 25 },
        { url: '/drugs/discovery', lcp: 1900, cls: 0.08, fid: 55 },
      ],
    };

    return NextResponse.json(mockData, { status: 200 });

  } catch (error) {
    console.error('Error retrieving web vitals analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    );
  }
}