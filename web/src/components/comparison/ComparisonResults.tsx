import React from 'react';
import { 
  Star, AlertTriangle, CheckCircle, Info, TrendingUp, 
  Building2, Pill, Clock, Shield, AlertCircle, DollarSign 
} from 'lucide-react';

interface Drug {
  setId: string;
  drugName: string;
  genericName?: string;
  manufacturer?: string;
  labeler?: string;
  slug: string;
  label?: any;
}

interface ComparisonData {
  drugs: Drug[];
  aiAnalysis: {
    overallRecommendation: string;
    keyDifferences: string[];
    effectivenessComparison: {
      drug: string;
      score: number;
      reasoning: string;
    }[];
    safetyProfile: {
      drug: string;
      riskLevel: 'low' | 'medium' | 'high';
      keyRisks: string[];
    }[];
    costEffectiveness?: {
      drug: string;
      costTier: 'low' | 'medium' | 'high';
      valueRating: number;
    }[];
    patientPreferences?: {
      bestFor: string;
      drugs: string[];
      reasoning: string;
    }[];
  };
  comparisonMatrix: {
    category: string;
    metrics: {
      metric: string;
      values: { drug: string; value: string; score?: number }[];
    }[];
  }[];
}

interface ComparisonResultsProps {
  data: ComparisonData;
  isInteractive?: boolean;
}

export function ComparisonResults({ data, isInteractive = false }: ComparisonResultsProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getCostIcon = (tier: string) => {
    switch (tier) {
      case 'low': return '$';
      case 'medium': return '$$';
      case 'high': return '$$$';
      default: return '$';
    }
  };

  return (
    <article className="prose prose-lg max-w-none">
      {/* Executive Summary Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Comparison Summary: {data.drugs.map(d => d.drugName).join(' vs ')}
        </h2>
        
        <div className="bg-blue-50 rounded-lg p-6 mb-8 not-prose">
          <p className="text-lg text-blue-900 leading-relaxed">
            {data.aiAnalysis.overallRecommendation}
          </p>
        </div>

        {/* Key Differences */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Key Differences</h3>
          <ul className="space-y-3">
            {data.aiAnalysis.keyDifferences.map((diff, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{diff}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Drug Overview Cards */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Drug Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 not-prose">
          {data.drugs.map((drug) => (
            <div key={drug.setId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <Pill className="h-8 w-8 text-blue-600" />
                <span className="text-sm text-gray-500">
                  {drug.label?.productType || 'Prescription Drug'}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {drug.drugName}
              </h3>
              
              {drug.genericName && drug.genericName !== drug.drugName && (
                <p className="text-gray-600 mb-3">
                  <span className="font-medium">Generic:</span> {drug.genericName}
                </p>
              )}
              
              <p className="text-gray-600 mb-3">
                <span className="font-medium">Manufacturer:</span> {drug.manufacturer || drug.labeler}
              </p>
              
              {drug.label?.indicationsAndUsage && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {drug.label.indicationsAndUsage.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Effectiveness Analysis */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Effectiveness Analysis</h2>
        <p className="text-gray-700 mb-6">
          Comparative effectiveness scores based on clinical data, FDA approvals, and real-world evidence.
        </p>
        
        <div className="space-y-4 not-prose">
          {data.aiAnalysis.effectivenessComparison.map((item, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">{item.drug}</h3>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(item.score)}`}>
                    {item.score}%
                  </div>
                  <div className="text-sm text-gray-500">Effectiveness Score</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      item.score >= 80 ? 'bg-green-500' : 
                      item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
              
              <p className="text-gray-700">{item.reasoning}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety Profile Comparison */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Safety Profile Comparison</h2>
        <p className="text-gray-700 mb-6">
          Risk assessment based on clinical trials, post-market surveillance, and FDA safety communications.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 not-prose">
          {data.aiAnalysis.safetyProfile.map((item, idx) => (
            <div key={idx} className={`rounded-lg border-2 p-6 ${getRiskColor(item.riskLevel)}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{item.drug}</h3>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium uppercase text-sm">
                    {item.riskLevel} RISK
                  </span>
                </div>
              </div>
              
              {item.keyRisks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Safety Considerations:</h4>
                  <ul className="space-y-1">
                    {item.keyRisks.map((risk, riskIdx) => (
                      <li key={riskIdx} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Cost Analysis (if available) */}
      {data.aiAnalysis.costEffectiveness && (
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Cost & Value Analysis</h2>
          <p className="text-gray-700 mb-6">
            Relative cost comparison and value assessment for typical treatment durations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose">
            {data.aiAnalysis.costEffectiveness.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.drug}</h3>
                <div className="text-4xl font-bold text-gray-700 mb-2">
                  {getCostIcon(item.costTier)}
                </div>
                <div className="mb-3">
                  <span className="text-sm text-gray-500">Cost Tier: </span>
                  <span className="font-medium capitalize">{item.costTier}</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm text-gray-500">Value Rating:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${
                          star <= item.valueRating 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Detailed Comparison Matrix */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Detailed Comparison Matrix</h2>
        <p className="text-gray-700 mb-6">
          Comprehensive side-by-side comparison of key medication attributes and characteristics.
        </p>
        
        <div className="overflow-x-auto not-prose">
          <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-900">Attribute</th>
                {data.drugs.map((drug) => (
                  <th key={drug.setId} className="text-left p-4 font-semibold text-gray-900 min-w-[200px]">
                    {drug.drugName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.comparisonMatrix.map((category, catIdx) => (
                <React.Fragment key={catIdx}>
                  <tr className="bg-gray-50">
                    <td colSpan={data.drugs.length + 1} className="p-3 font-medium text-gray-700 uppercase text-sm">
                      {category.category}
                    </td>
                  </tr>
                  {category.metrics.map((metric, metIdx) => (
                    <tr key={`${catIdx}-${metIdx}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-700">{metric.metric}</td>
                      {data.drugs.map((drug) => {
                        const value = metric.values.find(v => v.drug === drug.drugName);
                        return (
                          <td key={drug.setId} className="p-4 text-gray-600">
                            {value?.value || 'N/A'}
                            {value?.score !== undefined && (
                              <div className={`text-sm font-medium mt-1 ${getScoreColor(value.score)}`}>
                                Score: {value.score}%
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Patient-Specific Recommendations */}
      {data.aiAnalysis.patientPreferences && data.aiAnalysis.patientPreferences.length > 0 && (
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Patient-Specific Recommendations</h2>
          <p className="text-gray-700 mb-6">
            Tailored recommendations based on specific patient populations and clinical scenarios.
          </p>
          
          <div className="space-y-4 not-prose">
            {data.aiAnalysis.patientPreferences.map((pref, idx) => (
              <div key={idx} className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">{pref.bestFor}</h3>
                <p className="text-green-800 mb-3">
                  <span className="font-medium">Recommended medications:</span> {pref.drugs.join(', ')}
                </p>
                <p className="text-green-700">{pref.reasoning}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Important Considerations */}
      <section className="mb-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Considerations</h2>
        <div className="space-y-3 text-gray-700">
          <p className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>This comparison is for informational purposes only and should not replace professional medical advice.</span>
          </p>
          <p className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <span>Individual patient factors, medical history, and specific conditions may significantly impact drug selection.</span>
          </p>
          <p className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Always consult with a healthcare provider before making any medication decisions.</span>
          </p>
        </div>
      </section>
    </article>
  );
}