'use client';
import { AdvancedDrugComparison } from '@/components/comparison/AdvancedDrugComparison';
export default function CompareDrugsPage() {
    return (<div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced Drug Comparison
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Compare medications side-by-side with AI-generated insights, 
            effectiveness analysis, and personalized recommendations.
          </p>
        </div>
        
        <AdvancedDrugComparison />
      </div>
    </div>);
}
