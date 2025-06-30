import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { drugsApi, DrugLabel } from '@/lib/api/drugs.api';

interface PageProps {
  params: {
    slug: string;
  };
}

async function getDrug(slug: string): Promise<DrugLabel | null> {
  try {
    const response = await drugsApi.getDrugBySlug(slug);
    return response.success ? response.data : null;
  } catch (error) {
    console.error('Error fetching drug:', error);
    return null;
  }
}

async function getAIEnhancedMetadata(drug: DrugLabel) {
  try {
    // Call AI service for enhanced metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/enhance/${drug.slug}/seo`);
    
    if (response.ok) {
      const enhanced = await response.json();
      return enhanced;
    }
  } catch (error) {
    console.error('Failed to get AI-enhanced metadata:', error);
  }
  
  // Fallback to manual metadata
  return {
    seoTitle: `${drug.drugName} (${drug.label.genericName || 'Generic'}) - Drug Information`,
    metaDescription: drug.label.description?.substring(0, 160) || `Comprehensive information about ${drug.drugName}`,
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
      drug.label.genericName,
      drug.labeler,
      'drug information',
      'prescription medication',
      'FDA approved'
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
    "alternateName": drug.label.genericName,
    "manufacturer": {
      "@type": "Organization",
      "name": drug.labeler
    },
    "description": drug.label.description,
    "activeIngredient": drug.label.genericName,
    "dosageForm": "See dosage information",
    "indication": drug.label.indicationsAndUsage,
    "contraindication": drug.label.contraindications,
    "warning": drug.label.warningsAndPrecautions,
    "adverseReaction": drug.label.adverseReactions,
    "url": `https://pharmaiq.com/drugs/${drug.slug}`,
    "identifier": drug.setId
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{drug.drugName}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {drug.label.description && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Overview</h2>
              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: drug.label.description }} />
            </section>
          )}
          
          {drug.label.indicationsAndUsage && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Indications & Usage</h2>
              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: drug.label.indicationsAndUsage }} />
            </section>
          )}
          
          {drug.label.dosageAndAdministration && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Dosage & Administration</h2>
              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: drug.label.dosageAndAdministration }} />
            </section>
          )}
          
          {drug.label.warningsAndPrecautions && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Warnings & Precautions</h2>
              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: drug.label.warningsAndPrecautions }} />
            </section>
          )}

          {drug.label.adverseReactions && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Adverse Reactions</h2>
              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: drug.label.adverseReactions }} />
            </section>
          )}

          {drug.label.contraindications && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contraindications</h2>
              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: drug.label.contraindications }} />
            </section>
          )}

          {drug.label.clinicalPharmacology && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Clinical Pharmacology</h2>
              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: drug.label.clinicalPharmacology }} />
            </section>
          )}
        </div>
        
        <aside className="lg:col-span-1">
          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Quick Facts</h3>
            <ul className="space-y-2">
              <li><strong>Generic Name:</strong> {drug.label.genericName || 'N/A'}</li>
              <li><strong>Brand Name:</strong> {drug.drugName}</li>
              <li><strong>Manufacturer:</strong> {drug.labeler}</li>
              <li><strong>Drug ID:</strong> {drug.setId}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}