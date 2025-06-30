'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, X, ArrowUpDown, Star, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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
export function AdvancedDrugComparison() {
    const [selectedDrugs, setSelectedDrugs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [comparisonData, setComparisonData] = useState(null);
    const [isComparing, setIsComparing] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState('general');
    const [selectedCategories, setSelectedCategories] = useState(['efficacy', 'safety']);
    const searchDrugs = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const response = await fetch(`/api/drugs?search=${encodeURIComponent(query)}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.data || []);
            }
        }
        catch (error) {
            console.error('Search failed:', error);
        }
        finally {
            setIsSearching(false);
        }
    };
    const addDrugToComparison = (drug) => {
        if (selectedDrugs.length >= 5) {
            alert('Maximum 5 drugs can be compared at once');
            return;
        }
        if (!selectedDrugs.find(d => d.setId === drug.setId)) {
            setSelectedDrugs([...selectedDrugs, drug]);
            setSearchQuery('');
            setSearchResults([]);
        }
    };
    const removeDrugFromComparison = (drugId) => {
        setSelectedDrugs(selectedDrugs.filter(d => d.setId !== drugId));
        setComparisonData(null);
    };
    const performComparison = async () => {
        if (selectedDrugs.length < 2) {
            alert('Please select at least 2 drugs to compare');
            return;
        }
        setIsComparing(true);
        try {
            const response = await fetch('/api/drugs/compare/advanced', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drugIds: selectedDrugs.map(d => d.setId),
                    scenario: selectedScenario,
                    categories: selectedCategories,
                    includeAI: true
                })
            });
            if (response.ok) {
                const data = await response.json();
                setComparisonData(data);
            }
        }
        catch (error) {
            console.error('Comparison failed:', error);
        }
        finally {
            setIsComparing(false);
        }
    };
    useEffect(() => {
        const debounce = setTimeout(() => {
            if (searchQuery) {
                searchDrugs(searchQuery);
            }
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);
    const getRiskColor = (risk) => {
        switch (risk) {
            case 'low': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'high': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    const getScoreColor = (score) => {
        if (score >= 80)
            return 'text-green-600';
        if (score >= 60)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    return (<div className="max-w-7xl mx-auto space-y-8">
      {/* Drug Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Select Drugs to Compare</h3>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400"/>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for drugs to compare..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          
          {/* Search Results */}
          {searchResults.length > 0 && (<div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto z-10 shadow-lg">
              {searchResults.map((drug) => (<button key={drug.setId} onClick={() => addDrugToComparison(drug)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                  <div className="font-medium">{drug.drugName}</div>
                  {drug.genericName && (<div className="text-sm text-gray-600">Generic: {drug.genericName}</div>)}
                  <div className="text-xs text-gray-500">{drug.manufacturer}</div>
                </button>))}
            </div>)}
          
          {isSearching && (<div className="absolute right-3 top-3">
              <LoadingSpinner size="sm"/>
            </div>)}
        </div>

        {/* Selected Drugs */}
        {selectedDrugs.length > 0 && (<div className="space-y-4">
            <h4 className="font-medium">Selected Drugs ({selectedDrugs.length}/5)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDrugs.map((drug) => (<div key={drug.setId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-blue-900">{drug.drugName}</div>
                    {drug.genericName && (<div className="text-sm text-blue-700">{drug.genericName}</div>)}
                  </div>
                  <button onClick={() => removeDrugFromComparison(drug.setId)} className="text-red-500 hover:text-red-700">
                    <X className="h-4 w-4"/>
                  </button>
                </div>))}
            </div>
          </div>)}
      </Card>

      {/* Comparison Settings */}
      {selectedDrugs.length >= 2 && (<Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Comparison Settings</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Scenario */}
            <div>
              <label className="block font-medium mb-3">Patient Scenario</label>
              <select value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="general">General Population</option>
                {userScenarios.map((scenario) => (<option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>))}
              </select>
            </div>

            {/* Comparison Categories */}
            <div>
              <label className="block font-medium mb-3">Focus Areas</label>
              <div className="space-y-2">
                {comparisonCategories.map((category) => (<label key={category.id} className="flex items-center space-x-2">
                    <input type="checkbox" checked={selectedCategories.includes(category.id)} onChange={(e) => {
                    if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                    }
                    else {
                        setSelectedCategories(selectedCategories.filter(c => c !== category.id));
                    }
                }} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                    <span className="text-sm">{category.name}</span>
                  </label>))}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button onClick={performComparison} disabled={isComparing || selectedDrugs.length < 2} className="px-8 py-3">
              {isComparing ? (<>
                  <LoadingSpinner size="sm" className="mr-2"/>
                  Generating AI Analysis...
                </>) : (<>
                  <ArrowUpDown className="mr-2 h-4 w-4"/>
                  Compare Drugs
                </>)}
            </Button>
          </div>
        </Card>)}

      {/* Comparison Results */}
      {comparisonData && (<div className="space-y-6">
          {/* AI Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Analysis Summary</h3>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-blue-900">{comparisonData.aiAnalysis.overallRecommendation}</p>
            </div>
            
            {comparisonData.aiAnalysis.keyDifferences.length > 0 && (<div>
                <h4 className="font-medium mb-2">Key Differences:</h4>
                <ul className="space-y-1">
                  {comparisonData.aiAnalysis.keyDifferences.map((diff, idx) => (<li key={idx} className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full mt-2"></span>
                      <span className="text-sm text-gray-700">{diff}</span>
                    </li>))}
                </ul>
              </div>)}
          </Card>

          {/* Effectiveness Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Effectiveness Analysis</h3>
            <div className="space-y-4">
              {comparisonData.aiAnalysis.effectivenessComparison.map((item) => (<div key={item.drug} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                </div>))}
            </div>
          </Card>

          {/* Safety Profile */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Safety Profile Comparison</h3>
            <div className="space-y-4">
              {comparisonData.aiAnalysis.safetyProfile.map((item) => (<div key={item.drug} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{item.drug}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(item.riskLevel)}`}>
                      {item.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                  {item.keyRisks.length > 0 && (<div className="text-sm text-gray-600">
                      <span className="font-medium">Key considerations: </span>
                      {item.keyRisks.join(', ')}
                    </div>)}
                </div>))}
            </div>
          </Card>

          {/* Patient Preferences */}
          {comparisonData.aiAnalysis.patientPreferences.length > 0 && (<Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Patient-Specific Recommendations</h3>
              <div className="space-y-4">
                {comparisonData.aiAnalysis.patientPreferences.map((pref, idx) => (<div key={idx} className="border-l-4 border-green-500 pl-4">
                    <div className="font-medium text-green-800">{pref.bestFor}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Recommended: </span>
                      {pref.drugs.join(', ')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{pref.reasoning}</div>
                  </div>))}
              </div>
            </Card>)}

          {/* Detailed Comparison Matrix */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Detailed Comparison Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-medium">Metric</th>
                    {selectedDrugs.map((drug) => (<th key={drug.setId} className="text-left p-3 font-medium min-w-48">
                        {drug.drugName}
                      </th>))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.comparisonMatrix.map((category) => category.metrics.map((metric, idx) => (<tr key={`${category.category}-${idx}`} className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">
                          {idx === 0 && (<div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                              {category.category}
                            </div>)}
                          {metric.metric}
                        </td>
                        {selectedDrugs.map((drug) => {
                    const value = metric.values.find(v => v.drug === drug.drugName);
                    return (<td key={drug.setId} className="p-3">
                              <div className="text-sm">
                                {value?.value || 'N/A'}
                                {value?.score && (<div className={`text-xs font-medium ${getScoreColor(value.score)}`}>
                                    Score: {value.score}%
                                  </div>)}
                              </div>
                            </td>);
                })}
                      </tr>)))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>)}

      {/* Empty State */}
      {selectedDrugs.length === 0 && (<Card className="p-12 text-center">
          <Plus className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Start Your Comparison</h3>
          <p className="text-gray-600 mb-6">
            Search and select drugs above to begin a comprehensive comparison with AI insights.
          </p>
          <div className="text-sm text-gray-500">
            You can compare up to 5 drugs at once across multiple therapeutic categories.
          </div>
        </Card>)}
    </div>);
}
