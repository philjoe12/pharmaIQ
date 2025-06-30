'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, Info, Stethoscope, User, Heart, Clock, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserTypeSelector } from '@/components/user-type/UserTypeSelector';
import { useEffectiveUserType, useUserType } from '@/lib/context/UserTypeContext';
export function AdaptiveDrugContent({ drug }) {
    const effectiveUserType = useEffectiveUserType();
    const { setUserType } = useUserType();
    const [enhancedData, setEnhancedData] = useState(null);
    const [loading, setLoading] = useState(false);
    // Fetch AI-enhanced content based on user type
    useEffect(() => {
        async function fetchEnhancedContent() {
            if (!drug.slug)
                return;
            setLoading(true);
            try {
                const response = await fetch(`/api/drugs/enhanced/${drug.slug}?userType=${effectiveUserType}&includeAI=true`);
                if (response.ok) {
                    const data = await response.json();
                    setEnhancedData(data);
                }
            }
            catch (error) {
                console.error('Failed to fetch enhanced content:', error);
            }
            finally {
                setLoading(false);
            }
        }
        fetchEnhancedContent();
    }, [drug.slug, effectiveUserType]);
    const renderPatientContent = () => (<div className="space-y-8">
      {/* Patient-friendly header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <User className="h-6 w-6 text-blue-600 mt-1"/>
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Information for Patients
            </h2>
            <p className="text-blue-800">
              This information is designed to help you understand your medication. 
              Always follow your doctor's instructions and ask questions if anything is unclear.
            </p>
          </div>
        </div>
      </div>

      {/* Simplified description */}
      {enhancedData?.enhancedContent?.simplifiedDescription && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500"/>
            What is {drug.drugName}?
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {enhancedData.enhancedContent.simplifiedDescription}
          </p>
        </Card>)}

      {/* Key points for patients */}
      {enhancedData?.enhancedContent?.keyPoints && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500"/>
            Important Things to Know
          </h3>
          <ul className="space-y-3">
            {enhancedData.enhancedContent.keyPoints.map((point, idx) => (<li key={idx} className="flex items-start gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                <span className="text-gray-700">{point}</span>
              </li>))}
          </ul>
        </Card>)}

      {/* What this medication treats */}
      {drug.label.indicationsAndUsage && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">What does this medication treat?</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                __html: simplifyMedicalText(drug.label.indicationsAndUsage)
            }}/>
        </Card>)}

      {/* How to take it */}
      {drug.label.dosageAndAdministration && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500"/>
            How to take this medication
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-medium">
              ⚠️ Always follow your doctor's specific instructions for dosing and timing.
            </p>
          </div>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                __html: simplifyMedicalText(drug.label.dosageAndAdministration)
            }}/>
        </Card>)}

      {/* Side effects */}
      {drug.label.adverseReactions && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500"/>
            Possible side effects
          </h3>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-orange-800">
              Contact your doctor if you experience any side effects that concern you.
            </p>
          </div>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                __html: simplifyMedicalText(drug.label.adverseReactions)
            }}/>
        </Card>)}

      {/* When not to take */}
      {drug.label.contraindications && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500"/>
            When NOT to take this medication
          </h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                __html: simplifyMedicalText(drug.label.contraindications)
            }}/>
        </Card>)}

      {/* FAQ Section */}
      {enhancedData?.enhancedContent?.faq && enhancedData.enhancedContent.faq.length > 0 && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {enhancedData.enhancedContent.faq.map((faq, idx) => (<div key={idx} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                <p className="text-gray-700">{faq.answer}</p>
              </div>))}
          </div>
        </Card>)}
    </div>);
    const renderProviderContent = () => (<div className="space-y-8">
      {/* Provider header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Stethoscope className="h-6 w-6 text-green-600 mt-1"/>
          <div>
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              Clinical Information for Healthcare Providers
            </h2>
            <p className="text-green-800">
              Comprehensive prescribing information and clinical data for healthcare professionals.
            </p>
          </div>
        </div>
      </div>

      {/* Clinical overview */}
      {drug.label.description && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Clinical Overview</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.description }}/>
        </Card>)}

      {/* Indications and usage */}
      {drug.label.indicationsAndUsage && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Indications and Usage</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.indicationsAndUsage }}/>
        </Card>)}

      {/* Dosage and administration */}
      {drug.label.dosageAndAdministration && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Dosage and Administration</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.dosageAndAdministration }}/>
        </Card>)}

      {/* Contraindications */}
      {drug.label.contraindications && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Contraindications</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.contraindications }}/>
        </Card>)}

      {/* Warnings and precautions */}
      {drug.label.warningsAndPrecautions && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Warnings and Precautions</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.warningsAndPrecautions }}/>
        </Card>)}

      {/* Adverse reactions */}
      {drug.label.adverseReactions && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Adverse Reactions</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.adverseReactions }}/>
        </Card>)}

      {/* Clinical pharmacology */}
      {drug.label.clinicalPharmacology && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Clinical Pharmacology</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.clinicalPharmacology }}/>
        </Card>)}
    </div>);
    const renderGeneralContent = () => (<div className="space-y-8">
      {/* General overview */}
      {drug.label.description && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Overview</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.description }}/>
        </Card>)}

      {/* Uses */}
      {drug.label.indicationsAndUsage && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Uses</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.indicationsAndUsage }}/>
        </Card>)}

      {/* Important information */}
      {drug.label.warningsAndPrecautions && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Important Information</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.warningsAndPrecautions }}/>
        </Card>)}

      {/* Side effects */}
      {drug.label.adverseReactions && (<Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Side Effects</h3>
          <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: drug.label.adverseReactions }}/>
        </Card>)}
    </div>);
    const getUserTypeBadge = () => {
        const badges = {
            patient: { label: 'Patient View', color: 'bg-blue-100 text-blue-800', icon: User },
            provider: { label: 'Provider View', color: 'bg-green-100 text-green-800', icon: Stethoscope },
            general: { label: 'General View', color: 'bg-gray-100 text-gray-800', icon: Info }
        };
        const badge = badges[effectiveUserType];
        const IconComponent = badge.icon;
        return (<div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <IconComponent className="h-4 w-4"/>
        {badge.label}
      </div>);
    };
    // Helper function to simplify medical text for patients
    const simplifyMedicalText = (text) => {
        if (effectiveUserType !== 'patient')
            return text;
        // Basic text simplification for patient view
        return text
            .replace(/\b(administered|administration)\b/gi, 'given')
            .replace(/\b(contraindicated|contraindication)\b/gi, 'should not be used')
            .replace(/\b(efficacy|efficacious)\b/gi, 'effectiveness')
            .replace(/\b(adverse)\b/gi, 'unwanted')
            .replace(/\b(pharmacokinetics)\b/gi, 'how the body processes the drug')
            .replace(/\b(concomitant)\b/gi, 'at the same time');
    };
    return (<div className="container mx-auto px-4 py-8">
      {/* Header with drug name and user type */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{drug.drugName}</h1>
          {getUserTypeBadge()}
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="text-gray-600">
            {drug.label.genericName && (<span>Generic: <strong>{drug.label.genericName}</strong></span>)}
            {drug.label.genericName && drug.labeler && <span> • </span>}
            {drug.labeler && (<span>Manufacturer: <strong>{drug.labeler}</strong></span>)}
          </div>
        </div>

        {/* User type selector (compact) */}
        <div className="mb-6">
          <UserTypeSelector currentUserType={effectiveUserType} onUserTypeChange={setUserType} compact={true}/>
        </div>
      </div>

      {/* Loading state */}
      {loading && (<div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading personalized content...</span>
        </div>)}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main content */}
        <div className="lg:col-span-3">
          {effectiveUserType === 'patient' && renderPatientContent()}
          {effectiveUserType === 'provider' && renderProviderContent()}
          {effectiveUserType === 'general' && renderGeneralContent()}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Quick Facts</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Brand Name:</span>
                <div className="text-gray-600">{drug.drugName}</div>
              </div>
              
              {drug.label.genericName && (<div>
                  <span className="font-medium text-gray-700">Generic Name:</span>
                  <div className="text-gray-600">{drug.label.genericName}</div>
                </div>)}
              
              <div>
                <span className="font-medium text-gray-700">Manufacturer:</span>
                <div className="text-gray-600">{drug.labeler}</div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Drug ID:</span>
                <div className="text-gray-600 font-mono text-xs">{drug.setId}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 space-y-2">
              <Button variant="outline" className="w-full text-sm" onClick={() => window.print()}>
                Print Information
              </Button>
              
              <Button variant="outline" className="w-full text-sm" onClick={() => {
            const url = `${window.location.origin}${window.location.pathname}?userType=${effectiveUserType}`;
            navigator.clipboard.writeText(url);
        }}>
                Share This View
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
                "indication": drug.label.indicationsAndUsage,
                "contraindication": drug.label.contraindications,
                "warning": drug.label.warningsAndPrecautions,
                "adverseReaction": drug.label.adverseReactions,
                "url": `https://pharmaiq.com/drugs/${drug.slug}`,
                "identifier": drug.setId
            })
        }}/>
    </div>);
}
