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
    const drugPromises = slugs.map(slugWithId => {
      // Handle both formats: "slug" or "slug-id"
      const slug = slugWithId.includes('-') && slugWithId.match(/-[a-f0-9]{7}$/) 
        ? slugWithId.substring(0, slugWithId.lastIndexOf('-'))
        : slugWithId;
      
      return fetch(`${apiUrl}/drugs/${slug}`, { cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .catch(() => null);
    });
    
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
  searchParams: { drugs?: string; compare?: string } 
}): Promise<Metadata> {
  const drugSlugs = searchParams.drugs?.split(',').filter(Boolean) || [];
  const compareNames = searchParams.compare?.split('-vs-') || [];
  
  // If we have comparison names in URL, use them for SEO
  if (compareNames.length >= 2) {
    const formattedNames = compareNames.map(name => 
      name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    );
    
    return {
      title: `${formattedNames.join(' vs ')} - Drug Comparison | PharmaIQ`,
      description: `Compare ${formattedNames.join(' and ')} side-by-side. Comprehensive analysis including efficacy, safety, dosing, and drug interactions for healthcare professionals.`,
      keywords: [
        ...formattedNames.map(name => name.toLowerCase()),
        'drug comparison',
        'medication comparison',
        `${formattedNames[0]} vs ${formattedNames[1]}`,
        'side effects comparison',
        'drug interactions'
      ].join(', '),
    };
  }
  
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
    
    // Fetch comparison data (from Redis cache or generate new)
    if (preselectedDrugs.length >= 2) {
      try {
        const apiUrl = process.env.API_GATEWAY_URL || 'http://api:3001';
        const cacheKey = sortedSlugs.join(',');
        
        // Try to get cached comparison from Redis
        const cacheResponse = await fetch(`${apiUrl}/drugs/compare/cached?key=${cacheKey}`, {
          cache: 'no-store'
        });
        
        if (cacheResponse.ok) {
          const cacheResult = await cacheResponse.json();
          if (cacheResult.success && cacheResult.data) {
            initialComparisonData = cacheResult.data;
            console.log('Loaded comparison from Redis cache');
          }
        }
        
        // If no cached data, generate new AI-powered comparison
        if (!initialComparisonData) {
          console.log('No cached data, generating new AI comparison...');
          const comparisonResponse = await fetch(`${apiUrl}/drugs/compare/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              drugIds: preselectedDrugs.map(d => d.setId),
              userType: 'provider',
              scenario: 'general',
              categories: ['efficacy', 'safety', 'administration', 'interactions']
            }),
            cache: 'no-store'
          });
          
          if (comparisonResponse.ok) {
            const comparisonResult = await comparisonResponse.json();
            if (comparisonResult.success && comparisonResult.data) {
              initialComparisonData = comparisonResult.data;
              console.log('Generated new AI comparison');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching comparison:', error);
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
          
          {/* Show comparison results or loading state */}
          {preselectedDrugs.length >= 2 ? (
            initialComparisonData ? (
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
              /* Show loading state while comparison loads */
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 text-lg text-gray-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span>Generating AI-powered comparison...</span>
                </div>
                <AdvancedDrugComparison 
                  preselectedDrugs={preselectedDrugs}
                  initialComparisonData={null}
                  compactMode={true}
                />
              </div>
            )
          ) : (
            /* Show full interactive component when no drugs selected */
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