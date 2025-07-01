import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const includeAI = searchParams.get('includeAI') !== 'false';
    const userType = searchParams.get('userType') || 'general';
    
    // Call API Gateway to get drug by slug with enhanced content
    const response = await fetch(
      `${API_GATEWAY_URL}/drugs/slug/${slug}/enhanced?userType=${userType}&includeAI=${includeAI}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Ensure fresh data
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Drug not found' },
          { status: 404 }
        );
      }
      
      // Try fallback to basic endpoint without enhancement
      const fallbackResponse = await fetch(
        `${API_GATEWAY_URL}/drugs/slug/${slug}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return NextResponse.json({
          success: true,
          data: fallbackData,
          enhanced: false
        });
      }
      
      throw new Error('Failed to fetch drug data');
    }

    const data = await response.json();
    
    // Get SEO metadata if available
    let seoData = null;
    try {
      const seoResponse = await fetch(
        `${API_GATEWAY_URL}/seo/drug/${slug}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (seoResponse.ok) {
        seoData = await seoResponse.json();
      }
    } catch (seoError) {
      console.error('Failed to fetch SEO data:', seoError);
    }
    
    // Transform the response to include SEO data
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        seo: seoData || generateDefaultSEO(data)
      },
      enhanced: true
    });
  } catch (error) {
    console.error('Error in /api/drugs/[slug] route:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch drug information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Generate default SEO metadata if none exists
function generateDefaultSEO(drug: any) {
  const genericName = drug.label?.genericName || drug.genericName || '';
  const manufacturer = drug.labeler || drug.manufacturer || '';
  const indications = drug.label?.indicationsAndUsage || '';
  
  // Extract first sentence from indications for description
  const firstSentence = indications
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split(/[.!?]/)[0];
    
  return {
    title: `${drug.drugName}${genericName ? ` (${genericName})` : ''} - Drug Information | PharmaIQ`,
    description: firstSentence ? 
      `${firstSentence}. Learn about ${drug.drugName} uses, dosage, side effects, and warnings.`.substring(0, 160) :
      `Comprehensive information about ${drug.drugName}${genericName ? ` (${genericName})` : ''} including uses, dosage, side effects, warnings, and prescribing information.`.substring(0, 160),
    keywords: [
      drug.drugName,
      genericName,
      manufacturer,
      'drug information',
      'medication guide',
      'prescribing information',
      'FDA approved'
    ].filter(Boolean).join(', '),
    canonicalUrl: `/drugs/${drug.slug}`,
    ogTitle: `${drug.drugName} - Comprehensive Drug Information`,
    ogDescription: `Professional drug information for ${drug.drugName}${genericName ? ` (${genericName})` : ''}. FDA-approved prescribing information, dosage, warnings, and clinical use.`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Drug",
      "name": drug.drugName,
      "genericName": genericName,
      "manufacturer": {
        "@type": "Organization",
        "name": manufacturer
      },
      "prescriptionStatus": "PrescriptionOnly",
      "clinicalPharmacology": drug.label?.clinicalPharmacology || null,
      "mechanismOfAction": drug.label?.mechanismOfAction || null,
      "administrationRoute": drug.label?.routeOfAdministration || null,
      "dosageForm": drug.label?.dosageFormsAndStrengths || null,
      "warning": drug.label?.warningsAndPrecautions || null,
      "indication": indications || null
    }
  };
}