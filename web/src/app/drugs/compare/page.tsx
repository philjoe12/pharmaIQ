import { Metadata } from 'next';
import { AdvancedDrugComparison } from '@/components/comparison/AdvancedDrugComparison';
import { ComparisonResults } from '@/components/comparison/ComparisonResults';

interface Drug {
  setId: string;
  drugName: string;
  genericName?: string;
  manufacturer?: string;
  labeler?: string;
  slug: string;
  label?: any;
}

async function fetchDrugsBySlug(slugs: string[]): Promise<Drug[]> {
  if (!slugs.length) return [];
  
  try {
    const apiUrl = process.env.API_GATEWAY_URL || 'http://api:3001';
    const drugPromises = slugs.map(slug => 
      fetch(`${apiUrl}/drugs/${slug}`, { cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
    );
    
    const drugs = await Promise.all(drugPromises);
    return drugs.filter((drug): drug is Drug => drug !== null);
  } catch (error) {
    console.error('Error fetching drugs:', error);
    return [];
  }
}

export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: { drugs?: string } 
}): Promise<Metadata> {
  const drugSlugs = searchParams.drugs?.split(',').filter(Boolean) || [];
  
  if (drugSlugs.length < 2) {
    return {
      title: 'Compare Drugs - Advanced Medication Comparison | PharmaIQ',
      description: 'Compare medications side-by-side with AI-powered insights. Analyze efficacy, safety, dosing, and interactions for informed healthcare decisions.',
      keywords: 'drug comparison, medication comparison, compare drugs, pharmaceutical comparison, drug interactions, side effects comparison',
    };
  }
  
  // Sort slugs for canonical URL
  const sortedSlugs = [...drugSlugs].sort();
  const drugs = await fetchDrugsBySlug(sortedSlugs);
  
  if (drugs.length < 2) {
    return {
      title: 'Compare Drugs - PharmaIQ',
      description: 'Compare medications side-by-side',
    };
  }
  
  const drugNames = drugs.map(d => d.drugName);
  const genericNames = drugs.map(d => d.genericName).filter(Boolean);
  
  const title = drugNames.length <= 3 
    ? `${drugNames.join(' vs ')} - Drug Comparison | PharmaIQ`
    : `Compare ${drugs.length} Drugs: ${drugNames.slice(0, 2).join(', ')} & More | PharmaIQ`;
    
  const description = `Compare ${drugNames.join(', ')} side-by-side. Comprehensive analysis of ${
    genericNames.length > 0 ? `(${genericNames.slice(0, 3).join(', ')})` : 'these medications'
  } including efficacy, safety, dosing, and drug interactions for healthcare professionals.`;
  
  const keywords = [
    ...drugNames.map(name => name.toLowerCase()),
    ...genericNames.map(name => name!.toLowerCase()),
    'drug comparison',
    'medication comparison',
    `${drugNames[0]} vs ${drugNames[1]}`,
    'side effects comparison',
    'drug interactions',
    'efficacy comparison',
    'pharmaceutical analysis'
  ];
  
  const canonical = `/drugs/compare?drugs=${sortedSlugs.join(',')}`;
  
  return {
    title: title.length > 60 ? title.substring(0, 57) + '...' : title,
    description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    keywords: keywords.join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'PharmaIQ',
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical,
    },
  };
}

export default async function CompareDrugsPage({
  searchParams
}: {
  searchParams: { drugs?: string }
}) {
  const drugSlugs = searchParams.drugs?.split(',').filter(Boolean) || [];
  const sortedSlugs = [...drugSlugs].sort();
  
  let preselectedDrugs: Drug[] = [];
  let initialComparisonData = null;
  
  if (sortedSlugs.length >= 2) {
    preselectedDrugs = await fetchDrugsBySlug(sortedSlugs);
    
    // Fetch cached comparison if available
    if (preselectedDrugs.length >= 2) {
      try {
        const apiUrl = process.env.API_GATEWAY_URL || 'http://api:3001';
        const cacheKey = sortedSlugs.join(',');
        const response = await fetch(`${apiUrl}/drugs/compare/cached?key=${cacheKey}`, {
          cache: 'no-store'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            initialComparisonData = result.data;
          }
        }
      } catch (error) {
        console.error('Error fetching cached comparison:', error);
      }
    }
  }
  
  // Generate structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: preselectedDrugs.length >= 2 
      ? `${preselectedDrugs.map(d => d.drugName).join(' vs ')} - Drug Comparison`
      : 'Drug Comparison Tool',
    description: preselectedDrugs.length >= 2
      ? `Comprehensive comparison of ${preselectedDrugs.map(d => d.drugName).join(', ')}`
      : 'Compare medications side-by-side with AI-powered insights',
    url: `https://pharmaiq.com/drugs/compare${sortedSlugs.length ? `?drugs=${sortedSlugs.join(',')}` : ''}`,
    mainEntity: preselectedDrugs.length >= 2 ? {
      '@type': 'ItemList',
      itemListElement: preselectedDrugs.map((drug, index) => ({
        '@type': 'Drug',
        position: index + 1,
        name: drug.drugName,
        alternateName: drug.genericName,
        manufacturer: {
          '@type': 'Organization',
          name: drug.manufacturer || drug.labeler || 'Unknown'
        },
        url: `https://pharmaiq.com/drugs/${drug.slug}`
      }))
    } : undefined,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://pharmaiq.com'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Drugs',
          item: 'https://pharmaiq.com/drugs'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Compare',
          item: 'https://pharmaiq.com/drugs/compare'
        }
      ]
    }
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {preselectedDrugs.length >= 2 
                ? `${preselectedDrugs.map(d => d.drugName).join(' vs ')} Comparison`
                : 'Advanced Drug Comparison'
              }
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {preselectedDrugs.length >= 2
                ? `Comprehensive analysis of ${preselectedDrugs.map(d => 
                    d.genericName && d.genericName !== d.drugName 
                      ? `${d.drugName} (${d.genericName})` 
                      : d.drugName
                  ).join(', ')}`
                : 'Compare medications side-by-side with AI-generated insights, effectiveness analysis, and personalized recommendations.'
              }
            </p>
          </div>
          
          {/* Show SEO-optimized results if we have comparison data from URL */}
          {initialComparisonData && preselectedDrugs.length >= 2 ? (
            <>
              {/* SEO-friendly static content */}
              <ComparisonResults data={initialComparisonData} />
              
              {/* Interactive controls for modifying comparison */}
              <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Modify Comparison</h3>
                <p className="text-gray-600 mb-4">Add or remove drugs to update the comparison.</p>
                <AdvancedDrugComparison 
                  preselectedDrugs={preselectedDrugs}
                  initialComparisonData={initialComparisonData}
                  compactMode={true}
                />
              </div>
            </>
          ) : (
            /* Show full interactive component when no comparison data */
            <AdvancedDrugComparison 
              preselectedDrugs={preselectedDrugs}
              initialComparisonData={initialComparisonData}
            />
          )}
        </div>
      </div>
    </>
  );
}