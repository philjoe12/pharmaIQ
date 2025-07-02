'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Plus, X, ArrowUpDown, Star, AlertTriangle, 
  CheckCircle, Info, TrendingUp, BarChart3,
  AlertCircle, Sparkles, Brain, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DrugForComparison {
  setId: string;
  drugName: string;
  genericName?: string;
  manufacturer: string;
  slug: string;
  label: any;
  aiContent?: any;
  dataCompleteness?: {
    score: number;
    missingFields: string[];
    enrichedFields: {
      field: string;
      confidence: number;
      source: 'original' | 'ai_generated' | 'inferred';
    }[];
  };
  userSpecificContent?: {
    patient?: {
      summary: string;
      keyPoints: string[];
      readabilityScore: number;
    };
    provider?: {
      clinicalSummary: string;
      prescribingHighlights: string[];
      contraindications: string[];
    };
  };
}

interface ComparisonMatrix {
  drugs: DrugForComparison[];
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
    costEffectiveness: {
      drug: string;
      costTier: 'low' | 'medium' | 'high';
      valueRating: number;
    }[];
    patientPreferences: {
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

const comparisonCategories = [
  {
    id: 'efficacy',
    name: 'Efficacy & Effectiveness',
    description: 'How well the drug works for its intended purpose',
    icon: Star
  },
  {
    id: 'safety',
    name: 'Safety Profile',
    description: 'Side effects, contraindications, and safety considerations',
    icon: AlertTriangle
  },
  {
    id: 'administration',
    name: 'Administration',
    description: 'Dosing, routes, and administration considerations',
    icon: CheckCircle
  },
  {
    id: 'interactions',
    name: 'Drug Interactions',
    description: 'Potential interactions with other medications',
    icon: Info
  }
];

const userScenarios = [
  {
    id: 'elderly',
    name: 'Elderly Patients (65+)',
    description: 'Considerations for older adults with potential comorbidities'
  },
  {
    id: 'pregnancy',
    name: 'Pregnancy/Breastfeeding',
    description: 'Safety considerations for pregnant or nursing mothers'
  },
  {
    id: 'pediatric',
    name: 'Pediatric Use',
    description: 'Safety and dosing for children and adolescents'
  },
  {
    id: 'renal',
    name: 'Renal Impairment',
    description: 'Dosing adjustments for kidney disease patients'
  },
  {
    id: 'hepatic',
    name: 'Hepatic Impairment',
    description: 'Considerations for patients with liver disease'
  }
];

interface AdvancedDrugComparisonProps {
  preselectedDrugs?: DrugForComparison[];
  initialComparisonData?: ComparisonMatrix | null;
  compactMode?: boolean;
  onDrugsChange?: (drugs: DrugForComparison[]) => void;
}

export function AdvancedDrugComparison({ 
  preselectedDrugs = [],
  initialComparisonData = null,
  compactMode = false,
  onDrugsChange
}: AdvancedDrugComparisonProps) {
  const [selectedDrugs, setSelectedDrugs] = useState<DrugForComparison[]>(preselectedDrugs);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DrugForComparison[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonMatrix | null>(initialComparisonData);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('general');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['efficacy', 'safety']);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'visual'>('grid');
  const [userType] = useState<'patient' | 'provider' | 'general'>('general');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [aiSearchEnabled, setAiSearchEnabled] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Internal function to handle URL updates
  const updateUrlWithDrugs = useCallback((drugs: DrugForComparison[]) => {
    if (!onDrugsChange) {
      // If no callback provided, handle URL update internally
      const sortedSlugs = drugs
        .map(d => d.slug)
        .sort()
        .filter(Boolean);
      
      const newParams = new URLSearchParams();
      if (sortedSlugs.length > 0) {
        newParams.set('drugs', sortedSlugs.join(','));
      }
      
      const newUrl = sortedSlugs.length > 0 
        ? `/drugs/compare?${newParams.toString()}`
        : '/drugs/compare';
      
      router.replace(newUrl, { scroll: false });
    }
  }, [router, onDrugsChange]);

  const searchDrugs = async (query: string) => {
    console.log('searchDrugs called with query:', query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    console.log('Starting drug search...');
    try {
      let endpoint = `/api/drugs/search?q=${encodeURIComponent(query)}&limit=10`;
      console.log('Fetching from endpoint:', endpoint);
      
      // Use AI-powered search if enabled and query looks like natural language
      if (aiSearchEnabled && query.split(' ').length > 2) {
        console.log('Attempting AI-powered search...');
        try {
          const response = await fetch('/api/drugs/discovery/smart-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: query,
              userType: userType,
              limit: 10
            })
          });
          
          console.log('AI search response:', response.status);
          if (response.ok) {
            const smartData = await response.json();
            console.log('AI search data:', smartData);
            if (smartData.drugs && smartData.drugs.length > 0) {
              setSearchResults(smartData.drugs);
              return;
            }
          }
        } catch (aiError) {
          console.log('AI search failed, falling back to regular search:', aiError);
        }
      }
      
      // Fallback to regular search
      console.log('Performing regular search...');
      const response = await fetch(endpoint);
      console.log('Search response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Search data received:', data);
        if (data.success && data.data) {
          setSearchResults(data.data);
          console.log('Set search results:', data.data.length, 'drugs');
        } else if (Array.isArray(data)) {
          setSearchResults(data);
          console.log('Set search results (array):', data.length, 'drugs');
        } else {
          console.warn('Unexpected data format:', data);
          setSearchResults([]);
        }
      } else {
        console.error('Search request failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed with error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addDrugToComparison = (drug: DrugForComparison) => {
    if (selectedDrugs.length >= 5) {
      alert('Maximum 5 drugs can be compared at once');
      return;
    }
    
    if (!selectedDrugs.find(d => d.setId === drug.setId)) {
      const newDrugs = [...selectedDrugs, drug];
      setSelectedDrugs(newDrugs);
      setSearchQuery('');
      setSearchResults([]);
      
      // Update URL
      if (onDrugsChange) {
        onDrugsChange(newDrugs);
      } else {
        updateUrlWithDrugs(newDrugs);
      }
    }
  };

  const removeDrugFromComparison = (drugId: string) => {
    const newDrugs = selectedDrugs.filter(d => d.setId !== drugId);
    setSelectedDrugs(newDrugs);
    setComparisonData(null);
    
    // Update URL
    if (onDrugsChange) {
      onDrugsChange(newDrugs);
    } else {
      updateUrlWithDrugs(newDrugs);
    }
  };

  const performComparison = async () => {
    console.log('=== COMPARE DRUGS CLICKED ===');
    console.log('Selected drugs:', selectedDrugs);
    console.log('User type:', userType);
    console.log('Scenario:', selectedScenario);
    console.log('Categories:', selectedCategories);
    
    if (selectedDrugs.length < 2) {
      alert('Please select at least 2 drugs to compare');
      return;
    }

    setIsComparing(true);
    const requestBody = {
      drugIds: selectedDrugs.map(d => d.setId),
      userType: userType,
      scenario: selectedScenario,
      categories: selectedCategories
    };
    console.log('Request body to send:', JSON.stringify(requestBody, null, 2));
    
    try {
      console.log('Fetching from: /api/drugs/compare/ai');
      const response = await fetch('/api/drugs/compare/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (response.ok) {
        try {
          const result = JSON.parse(responseText);
          console.log('Parsed response:', result);
          
          if (result.success && result.data) {
            console.log('Setting comparison data...');
            setComparisonData(result.data);
            console.log('Comparison data set successfully!');
          } else {
            console.error('Invalid response structure:', result);
            alert('Received invalid response from server');
          }
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          alert('Failed to parse server response');
        }
      } else {
        try {
          const error = JSON.parse(responseText);
          console.error('API Error:', error);
          alert(`Failed to compare drugs: ${error.message || 'Unknown error'}`);
        } catch {
          console.error('Non-JSON error response:', responseText);
          alert(`Server error: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Network/fetch error:', error);
      alert(`Network error: ${(error as Error).message || 'Failed to connect to server'}`);
    } finally {
      console.log('Comparison request completed');
      setIsComparing(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchDrugs(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Drug Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {compactMode ? 'Modify Drug Selection' : 'Select Drugs to Compare'}
        </h3>
        
        {/* Search Bar with AI Toggle */}
        <div className="relative space-y-2 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Search for drugs</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiSearchEnabled(!aiSearchEnabled)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  aiSearchEnabled 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                AI Search {aiSearchEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </div>
          <div className="relative">
            {aiSearchEnabled ? (
              <Brain className="absolute left-3 top-3 h-5 w-5 text-purple-500" />
            ) : (
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={aiSearchEnabled 
                ? "Try: 'drugs for diabetes with low side effects' or 'alternatives to metformin'"
                : "Search by drug name, generic name, or condition..."
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {isSearching && (
              <div className="absolute right-3 top-3">
                <LoadingSpinner size="sm" />
              </div>
            )}
            
            {/* Debug info */}
            {searchQuery && (
              <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                Results: {searchResults.length} | Query: "{searchQuery}"
              </div>
            )}
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto z-50 shadow-lg">
                {searchResults.map((drug) => {
                  console.log('Rendering drug in dropdown:', drug.drugName);
                  return (
                    <button
                      key={drug.setId}
                      onClick={() => addDrugToComparison(drug)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 block"
                    >
                      <div className="font-medium">{drug.drugName}</div>
                      {drug.genericName && (
                        <div className="text-sm text-gray-600">Generic: {drug.genericName}</div>
                      )}
                      <div className="text-xs text-gray-500">{drug.manufacturer || drug.labeler}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Drugs */}
        {selectedDrugs.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Selected Drugs ({selectedDrugs.length}/5)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDrugs.map((drug) => (
                <div key={drug.setId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-blue-900">{drug.drugName}</div>
                    {drug.genericName && (
                      <div className="text-sm text-blue-700">{drug.genericName}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeDrugFromComparison(drug.setId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Comparison Settings */}
      {selectedDrugs.length >= 2 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Comparison Settings</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Scenario */}
            <div>
              <label className="block font-medium mb-3">Patient Scenario</label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General Population</option>
                {userScenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Comparison Categories */}
            <div>
              <label className="block font-medium mb-3">Focus Areas</label>
              <div className="space-y-2">
                {comparisonCategories.map((category) => (
                  <label key={category.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category.id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              onClick={performComparison}
              disabled={isComparing || selectedDrugs.length < 2}
              className="px-8 py-3"
            >
              {isComparing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating AI Analysis...
                </>
              ) : (
                <>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Compare Drugs
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Comparison Results */}
      {comparisonData && (
        <div className="space-y-6">
          {/* View Mode Selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Comparison Results</h2>
            <div className="flex gap-2">
              {(['grid', 'table', 'visual'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'grid' && <BarChart3 className="h-4 w-4 inline mr-2" />}
                  {mode === 'table' && <ArrowUpDown className="h-4 w-4 inline mr-2" />}
                  {mode === 'visual' && <TrendingUp className="h-4 w-4 inline mr-2" />}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Data Quality Warning */}
          {selectedDrugs.some(d => d.dataCompleteness && d.dataCompleteness.score < 0.8) && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900">Data Quality Notice</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Some drugs have incomplete data. AI has enhanced missing information where possible.
                  </p>
                  <div className="mt-2 space-y-1">
                    {selectedDrugs
                      .filter(d => d.dataCompleteness && d.dataCompleteness.score < 0.8)
                      .map(drug => (
                        <div key={drug.setId} className="text-sm">
                          <span className="font-medium">{drug.drugName}:</span>{' '}
                          {Math.round((drug.dataCompleteness?.score || 0) * 100)}% complete
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* AI Summary */}
          <Card className="p-6">
            <button
              onClick={() => toggleSection('summary')}
              className="w-full flex items-center justify-between mb-4"
            >
              <h3 className="text-lg font-semibold">AI Analysis Summary</h3>
              {expandedSections.has('summary') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            
            {expandedSections.has('summary') && (
              <>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-blue-900">{comparisonData.aiAnalysis.overallRecommendation}</p>
                </div>
                
                {comparisonData.aiAnalysis.keyDifferences.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Key Differences:</h4>
                    <ul className="space-y-1">
                      {comparisonData.aiAnalysis.keyDifferences.map((diff, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-blue-500 rounded-full mt-2"></span>
                          <span className="text-sm text-gray-700">{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Effectiveness Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Effectiveness Analysis</h3>
            <div className="space-y-4">
              {comparisonData.aiAnalysis.effectivenessComparison.map((item) => (
                <div key={item.drug} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.drug}</div>
                    <div className="text-sm text-gray-600 mt-1">{item.reasoning}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                      {item.score}%
                    </div>
                    <div className="text-xs text-gray-500">Effectiveness</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Safety Profile */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Safety Profile Comparison</h3>
            <div className="space-y-4">
              {comparisonData.aiAnalysis.safetyProfile.map((item) => (
                <div key={item.drug} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{item.drug}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(item.riskLevel)}`}>
                      {item.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                  {item.keyRisks.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Key considerations: </span>
                      {item.keyRisks.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Patient Preferences */}
          {comparisonData.aiAnalysis.patientPreferences.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Patient-Specific Recommendations</h3>
              <div className="space-y-4">
                {comparisonData.aiAnalysis.patientPreferences.map((pref, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-4">
                    <div className="font-medium text-green-800">{pref.bestFor}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Recommended: </span>
                      {pref.drugs.join(', ')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{pref.reasoning}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Detailed Comparison Matrix */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Detailed Comparison Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-medium">Metric</th>
                    {selectedDrugs.map((drug) => (
                      <th key={drug.setId} className="text-left p-3 font-medium min-w-48">
                        {drug.drugName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.comparisonMatrix.map((category) =>
                    category.metrics.map((metric, idx) => (
                      <tr key={`${category.category}-${idx}`} className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">
                          {idx === 0 && (
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                              {category.category}
                            </div>
                          )}
                          {metric.metric}
                        </td>
                        {selectedDrugs.map((drug) => {
                          const value = metric.values.find(v => v.drug === drug.drugName);
                          return (
                            <td key={drug.setId} className="p-3">
                              <div className="text-sm">
                                {value?.value || 'N/A'}
                                {value?.score && (
                                  <div className={`text-xs font-medium ${getScoreColor(value.score)}`}>
                                    Score: {value.score}%
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {selectedDrugs.length === 0 && (
        <Card className="p-12 text-center">
          <Plus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Start Your Comparison</h3>
          <p className="text-gray-600 mb-6">
            Search and select drugs above to begin a comprehensive comparison with AI insights.
          </p>
          <div className="text-sm text-gray-500">
            You can compare up to 5 drugs at once across multiple therapeutic categories.
          </div>
        </Card>
      )}
    </div>
  );
}