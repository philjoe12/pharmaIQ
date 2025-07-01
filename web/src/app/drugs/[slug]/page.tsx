import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  Pill, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  FileText, 
  Users, 
  Shield,
  Activity,
  Clock,
  Package,
  ChevronRight,
  AlertCircle,
  Beaker,
  Heart
} from 'lucide-react';

interface PageProps {
  params: {
    slug: string;
  };
}

async function getDrug(slug: string): Promise<any> {
  try {
    // For server components, use the API Gateway directly
    const apiUrl = process.env.API_GATEWAY_URL || 'http://api:3001';
    const response = await fetch(`${apiUrl}/drugs/${slug}`, {
      cache: 'no-store' // Disable caching for large responses
    });
    
    if (!response.ok) {
      console.error('Failed to fetch drug:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching drug:', error);
    return null;
  }
}

async function getAIEnhancedMetadata(drug: any) {
  // Check if drug already has AI-enhanced content
  if (drug.aiContent?.seoMetadata) {
    return {
      seoTitle: drug.aiContent.seoMetadata.title,
      metaDescription: drug.aiContent.seoMetadata.metaDescription,
    };
  }
  
  // Fallback to manual metadata
  return {
    seoTitle: `${drug.drugName} (${drug.genericName || drug.label?.genericName || 'Generic'}) - FDA Drug Information | PharmaIQ`,
    metaDescription: drug.label?.description?.substring(0, 155) || `Comprehensive FDA-approved information about ${drug.drugName} for healthcare professionals. Indications, dosing, warnings, and clinical data.`,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const drug = await getDrug(params.slug);
  
  if (!drug) {
    return {
      title: 'Drug Not Found',
      description: 'The requested drug information could not be found.',
    };
  }

  const enhanced = await getAIEnhancedMetadata(drug);

  return {
    title: enhanced.seoTitle,
    description: enhanced.metaDescription,
    keywords: [
      drug.drugName,
      drug.label?.genericName,
      drug.labeler,
      'drug information',
      'prescription medication',
      'FDA approved',
      'healthcare professionals',
      'dosage',
      'side effects',
      'contraindications'
    ].filter(Boolean).join(', '),
    openGraph: {
      title: enhanced.seoTitle,
      description: enhanced.metaDescription,
      type: 'article',
      siteName: 'PharmaIQ',
    },
    twitter: {
      card: 'summary',
      title: enhanced.seoTitle,
      description: enhanced.metaDescription,
    },
  };
}

// Helper function to clean HTML content
function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<a[^>]*>/g, '')
    .replace(/<\/a>/g, '')
    .replace(/<p[^>]*>/g, '<p class="mb-4 text-gray-700 leading-relaxed">')
    .replace(/<ul[^>]*>/g, '<ul class="list-disc list-inside space-y-2 mb-4 ml-4">')
    .replace(/<li[^>]*>/g, '<li class="text-gray-700">')
    .replace(/<h1[^>]*>/g, '<h3 class="text-xl font-semibold mb-3 text-gray-900">')
    .replace(/<h2[^>]*>/g, '<h4 class="text-lg font-medium mb-2 text-gray-800">')
    .replace(/<table[^>]*>/g, '<table class="min-w-full divide-y divide-gray-200 mb-6">')
    .replace(/<td[^>]*>/g, '<td class="px-3 py-2 text-sm text-gray-700 border-b">')
    .replace(/<th[^>]*>/g, '<th class="px-3 py-2 text-sm font-medium text-gray-900 border-b bg-gray-50">');
}

// Extract first meaningful sentence
function extractFirstSentence(html: string): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, '').trim();
  const sentences = text.split(/[.!?]/);
  return sentences[0]?.trim() || '';
}

export default async function DrugPage({ params }: PageProps) {
  const { slug } = params;
  const drug = await getDrug(slug);

  if (!drug) {
    notFound();
  }

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Drug",
    "name": drug.drugName,
    "alternateName": drug.label?.genericName,
    "manufacturer": {
      "@type": "Organization",
      "name": drug.labeler
    },
    "description": extractFirstSentence(drug.label?.description),
    "activeIngredient": drug.label?.genericName,
    "dosageForm": "See dosage information",
    "indication": drug.label?.indicationsAndUsage,
    "contraindication": drug.label?.contraindications,
    "warning": drug.label?.warningsAndPrecautions,
    "adverseReaction": drug.label?.adverseReactions,
    "url": `https://pharmaiq.com/drugs/${drug.slug}`,
    "identifier": drug.setId
  };

  // Extract key information for quick facts
  const genericName = drug.label?.genericName || drug.genericName || 'N/A';
  const dosageStrength = drug.label?.howSupplied ? extractFirstSentence(drug.label.howSupplied) : 'See prescribing information';

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center space-x-2 text-blue-200 mb-4">
                <a href="/drugs" className="hover:text-white transition-colors">Drugs</a>
                <ChevronRight className="w-4 h-4" />
                <span>{drug.drugName}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {drug.drugName}
                {genericName !== 'N/A' && (
                  <span className="text-2xl md:text-3xl font-normal text-blue-200 ml-3">
                    ({genericName})
                  </span>
                )}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Manufactured by {drug.labeler}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>FDA Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <nav className="flex space-x-8 overflow-x-auto">
                <a href="#overview" className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium whitespace-nowrap">
                  Overview
                </a>
                <a href="#indications" className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap">
                  Indications
                </a>
                <a href="#dosage" className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap">
                  Dosage
                </a>
                <a href="#warnings" className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap">
                  Warnings
                </a>
                <a href="#adverse-reactions" className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap">
                  Side Effects
                </a>
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Overview Section */}
                <section id="overview" className="bg-white rounded-xl shadow-sm p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Info className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                  </div>
                  
                  {drug.label?.description ? (
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanHtml(drug.label.description) }} 
                    />
                  ) : (
                    <p className="text-gray-600">
                      {drug.drugName} is a prescription medication. Please refer to the full prescribing information for complete details.
                    </p>
                  )}
                </section>

                {/* Indications & Usage */}
                {drug.label?.indicationsAndUsage && (
                  <section id="indications" className="bg-white rounded-xl shadow-sm p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Indications & Usage</h2>
                    </div>
                    
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                      <p className="text-sm text-green-800">
                        This section describes the approved uses of {drug.drugName} based on FDA labeling.
                      </p>
                    </div>
                    
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanHtml(drug.label.indicationsAndUsage) }} 
                    />
                  </section>
                )}

                {/* Dosage & Administration */}
                {drug.label?.dosageAndAdministration && (
                  <section id="dosage" className="bg-white rounded-xl shadow-sm p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Dosage & Administration</h2>
                    </div>
                    
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanHtml(drug.label.dosageAndAdministration) }} 
                    />
                  </section>
                )}

                {/* Warnings & Precautions */}
                {drug.label?.warningsAndPrecautions && (
                  <section id="warnings" className="bg-white rounded-xl shadow-sm p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Warnings & Precautions</h2>
                    </div>
                    
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                      <p className="text-sm text-red-800 font-medium">
                        Important safety information - Read carefully before prescribing
                      </p>
                    </div>
                    
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanHtml(drug.label.warningsAndPrecautions) }} 
                    />
                  </section>
                )}

                {/* Adverse Reactions */}
                {drug.label?.adverseReactions && (
                  <section id="adverse-reactions" className="bg-white rounded-xl shadow-sm p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Adverse Reactions</h2>
                    </div>
                    
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanHtml(drug.label.adverseReactions) }} 
                    />
                  </section>
                )}

                {/* Contraindications */}
                {drug.label?.contraindications && (
                  <section className="bg-white rounded-xl shadow-sm p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Shield className="w-6 h-6 text-red-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Contraindications</h2>
                    </div>
                    
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanHtml(drug.label.contraindications) }} 
                    />
                  </section>
                )}

                {/* Clinical Pharmacology */}
                {drug.label?.clinicalPharmacology && (
                  <section className="bg-white rounded-xl shadow-sm p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <Beaker className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Clinical Pharmacology</h2>
                    </div>
                    
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanHtml(drug.label.clinicalPharmacology) }} 
                    />
                  </section>
                )}
              </div>
              
              {/* Sidebar */}
              <aside className="lg:col-span-1 space-y-6">
                {/* Quick Facts Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-blue-600" />
                    Quick Facts
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="pb-4 border-b">
                      <p className="text-sm text-gray-500 mb-1">Generic Name</p>
                      <p className="font-semibold text-gray-900">{genericName}</p>
                    </div>
                    
                    <div className="pb-4 border-b">
                      <p className="text-sm text-gray-500 mb-1">Brand Name</p>
                      <p className="font-semibold text-gray-900">{drug.drugName}</p>
                    </div>
                    
                    <div className="pb-4 border-b">
                      <p className="text-sm text-gray-500 mb-1">Manufacturer</p>
                      <p className="font-semibold text-gray-900">{drug.labeler}</p>
                    </div>
                    
                    <div className="pb-4 border-b">
                      <p className="text-sm text-gray-500 mb-1">Drug Type</p>
                      <p className="font-semibold text-gray-900">
                        {drug.label?.productType || 'Prescription Drug'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Drug ID</p>
                      <p className="font-mono text-xs text-gray-600">{drug.setId}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Download Full Label
                    </button>
                    
                    <a 
                      href={`/drugs/compare?drugs=${slug}`}
                      className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
                    >
                      <Activity className="w-5 h-5 mr-2" />
                      Compare Drugs
                    </a>
                  </div>
                </div>

                {/* Professional Resources */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    For Healthcare Professionals
                  </h3>
                  
                  <ul className="space-y-3">
                    <li>
                      <a href="#" className="text-blue-700 hover:text-blue-800 flex items-center">
                        <ChevronRight className="w-4 h-4 mr-1" />
                        Clinical Studies
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-blue-700 hover:text-blue-800 flex items-center">
                        <ChevronRight className="w-4 h-4 mr-1" />
                        Prescribing Guidelines
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-blue-700 hover:text-blue-800 flex items-center">
                        <ChevronRight className="w-4 h-4 mr-1" />
                        Patient Resources
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Safety Alert */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">Important Note</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This information is for healthcare professionals only. Always consult the full prescribing information.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}