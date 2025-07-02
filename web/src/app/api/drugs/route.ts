import { NextRequest, NextResponse } from 'next/server';

// Since we're running API Gateway on port 3001, we'll proxy to it
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = searchParams.get('limit') || '10';
    const page = searchParams.get('page') || '1';
    const name = searchParams.get('name') || '';
    const manufacturer = searchParams.get('manufacturer') || '';

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // If there's a search term, use the search endpoint
    if (search) {
      // Call the search endpoint on API Gateway
      const searchUrl = `${API_GATEWAY_URL}/drugs/search?q=${encodeURIComponent(search)}&limit=${limit}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Search API error:', response.status, response.statusText);
        throw new Error('Failed to search drugs');
      }

      const data = await response.json();
      
      // Transform the data to match the expected format
      return NextResponse.json({
        success: true,
        data: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: data?.length || 0,
          totalPages: 1
        }
      });
    } else {
      // Use the regular listing endpoint with filters
      if (name) queryParams.append('name', name);
      if (manufacturer) queryParams.append('manufacturer', manufacturer);
      queryParams.append('limit', limit);
      queryParams.append('page', page);

      const url = `${API_GATEWAY_URL}/drugs?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('API Gateway error:', response.status, response.statusText);
        throw new Error('Failed to fetch drugs');
      }

      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error in /api/drugs route:', error);
    
    // Return mock data for development if API Gateway is not available
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        data: getMockDrugs(),
        pagination: {
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1
        }
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch drugs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drugSlugs, drugIds: requestDrugIds } = body;
    
    // Handle both slugs and IDs
    const identifiers = drugSlugs || requestDrugIds;
    if (!identifiers || !Array.isArray(identifiers) || identifiers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Drug identifiers are required' },
        { status: 400 }
      );
    }
    
    // If we have slugs, first fetch the drugs to get their IDs
    let drugData: any[] = [];
    if (drugSlugs) {
      const drugPromises = drugSlugs.map((slug: string) => 
        fetch(`${API_GATEWAY_URL}/drugs/${slug}`, {
          headers: { 'Content-Type': 'application/json' },
        }).then(res => res.ok ? res.json() : null)
      );
      
      const drugResults = await Promise.all(drugPromises);
      drugData = drugResults.filter(result => result !== null);
    } else {
      // If we have IDs, fetch drugs by IDs
      const response = await fetch(`${API_GATEWAY_URL}/drugs?ids=${requestDrugIds.join(',')}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const result = await response.json();
        drugData = result.data || [];
      }
    }
    
    if (drugData.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 valid drugs required for comparison' },
        { status: 404 }
      );
    }
    
    // Call the AI comparison endpoint
    const drugIdsForComparison = drugData.map((drug: any) => drug.id || drug.setId);
    const aiResponse = await fetch(`${API_GATEWAY_URL}/drugs/compare/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drugIds: drugIdsForComparison }),
    });
    
    if (aiResponse.ok) {
      const aiResult = await aiResponse.json();
      return NextResponse.json(aiResult);
    } else {
      // Fallback to basic comparison
      return NextResponse.json({
        success: true,
        data: {
          drugs: drugData,
          comparisonMatrix: generateComparisonMatrix(drugData),
          aiAnalysis: null
        }
      });
    }
  } catch (error) {
    console.error('Error in /api/drugs POST route:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process drug comparison',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateComparisonMatrix(drugs: any[]) {
  return [
    {
      category: 'Basic Information',
      metrics: [
        {
          metric: 'Generic Name',
          values: drugs.map(drug => ({
            drug: drug.drugName,
            value: drug.genericName || drug.label?.genericName || 'N/A'
          }))
        },
        {
          metric: 'Manufacturer',
          values: drugs.map(drug => ({
            drug: drug.drugName,
            value: drug.manufacturer || drug.labeler || 'N/A'
          }))
        }
      ]
    },
    {
      category: 'Clinical Use',
      metrics: [
        {
          metric: 'Primary Indications',
          values: drugs.map(drug => ({
            drug: drug.drugName,
            value: extractFirstSentence(drug.label?.indicationsAndUsage) || 'N/A'
          }))
        }
      ]
    }
  ];
}

function extractFirstSentence(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/[.!?]/)[0] || '';
}

// Mock data for development
function getMockDrugs() {
  return [
    {
      setId: "1",
      drugName: "Humira",
      genericName: "adalimumab",
      manufacturer: "AbbVie Inc.",
      slug: "humira-adalimumab",
      label: {
        indicationsAndUsage: "Treatment of rheumatoid arthritis, Crohn's disease, and other inflammatory conditions",
        dosageAndAdministration: "40mg subcutaneous injection every other week",
        warningsAndPrecautions: "Increased risk of serious infections"
      }
    },
    {
      setId: "2",
      drugName: "Keytruda",
      genericName: "pembrolizumab",
      manufacturer: "Merck & Co., Inc.",
      slug: "keytruda-pembrolizumab",
      label: {
        indicationsAndUsage: "Treatment of various cancers including melanoma and lung cancer",
        dosageAndAdministration: "200mg IV infusion every 3 weeks",
        warningsAndPrecautions: "Immune-mediated adverse reactions"
      }
    },
    {
      setId: "3",
      drugName: "Eliquis",
      genericName: "apixaban",
      manufacturer: "Bristol-Myers Squibb",
      slug: "eliquis-apixaban",
      label: {
        indicationsAndUsage: "Prevention of stroke and blood clots in patients with atrial fibrillation",
        dosageAndAdministration: "5mg orally twice daily",
        warningsAndPrecautions: "Increased risk of bleeding"
      }
    },
    {
      setId: "4",
      drugName: "Xarelto",
      genericName: "rivaroxaban",
      manufacturer: "Janssen Pharmaceuticals",
      slug: "xarelto-rivaroxaban",
      label: {
        indicationsAndUsage: "Prevention of blood clots and stroke",
        dosageAndAdministration: "20mg orally once daily with food",
        warningsAndPrecautions: "Risk of bleeding, spinal/epidural hematoma"
      }
    },
    {
      setId: "5",
      drugName: "Lipitor",
      genericName: "atorvastatin",
      manufacturer: "Pfizer Inc.",
      slug: "lipitor-atorvastatin",
      label: {
        indicationsAndUsage: "Treatment of high cholesterol and prevention of cardiovascular disease",
        dosageAndAdministration: "10-80mg orally once daily",
        warningsAndPrecautions: "Muscle pain, liver enzyme elevation"
      }
    }
  ];
}