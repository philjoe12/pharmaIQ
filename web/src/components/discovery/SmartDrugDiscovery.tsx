'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Sparkles, Heart, Brain, Stethoscope, Pill, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface SearchResult {
  setId: string;
  drugName: string;
  genericName?: string;
  manufacturer: string;
  slug: string;
  relevanceScore?: number;
  aiHighlights?: string[];
  aiInsights?: {
    relevanceExplanation: string;
    keyBenefits: string[];
    considerations: string[];
  };
}

interface SmartSearchResponse {
  query: string;
  searchIntent?: any;
  totalFound: number;
  drugs: SearchResult[];
  suggestions?: string[];
  suggestedQueries?: string[];
}

const therapeuticAreas = [
  { name: 'Cardiovascular', icon: Heart, color: 'bg-red-100 text-red-600', condition: 'heart disease' },
  { name: 'Neurological', icon: Brain, color: 'bg-purple-100 text-purple-600', condition: 'neurological disorders' },
  { name: 'Respiratory', icon: Stethoscope, color: 'bg-blue-100 text-blue-600', condition: 'respiratory conditions' },
  { name: 'Gastrointestinal', icon: Pill, color: 'bg-green-100 text-green-600', condition: 'digestive issues' },
  { name: 'Immunological', icon: Shield, color: 'bg-yellow-100 text-yellow-600', condition: 'immune disorders' },
  { name: 'Endocrine', icon: Activity, color: 'bg-indigo-100 text-indigo-600', condition: 'metabolic conditions' },
];

const commonConditions = [
  'diabetes', 'hypertension', 'depression', 'anxiety', 'arthritis', 
  'asthma', 'migraine', 'insomnia', 'allergies', 'chronic pain'
];

const userTypes = [
  { value: 'patient', label: 'Patient', description: 'General information and patient-friendly explanations' },
  { value: 'provider', label: 'Healthcare Provider', description: 'Clinical details and prescribing information' },
  { value: 'general', label: 'General', description: 'Balanced information for all audiences' },
];

export function SmartDrugDiscovery() {
  const [query, setQuery] = useState('');
  const [userType, setUserType] = useState<'patient' | 'provider' | 'general'>('general');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SmartSearchResponse | null>(null);
  const [conditionResults, setConditionResults] = useState<any>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSmartSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    try {
      const response = await fetch('/api/drugs/discovery/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          userType,
          limit: 20
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Ensure data has the expected structure
        const validatedData = {
          query: data.query || query,
          totalFound: data.totalFound || 0,
          drugs: data.drugs || [],
          suggestedQueries: data.suggestedQueries || []
        };
        setSearchResults(validatedData);
        setConditionResults(null);
        setSelectedCondition(null);
      } else {
        // Handle error response
        console.error('Search API returned error:', response.status);
        setError(`Search failed: ${response.statusText || 'Unknown error'}`);
        setSearchResults({
          query: query,
          totalFound: 0,
          drugs: [],
          suggestedQueries: []
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Failed to perform search. Please try again.');
      // Set empty results on error
      setSearchResults({
        query: query,
        totalFound: 0,
        drugs: [],
        suggestedQueries: []
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleConditionExplore = async (condition: string) => {
    setSelectedCondition(condition);
    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/drugs/discovery/conditions?condition=${encodeURIComponent(condition)}&userType=${userType}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        setConditionResults(data);
        setSearchResults(null);
      }
    } catch (error) {
      console.error('Condition search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetSuggestions = async () => {
    try {
      const response = await fetch(`/api/drugs/discovery/suggestions?userType=${userType}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  };

  useEffect(() => {
    handleGetSuggestions();
  }, [userType]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSmartSearch();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* User Type Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">I am a:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setUserType(type.value as any)}
              className={`p-4 text-left rounded-lg border-2 transition-all ${
                userType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{type.label}</div>
              <div className="text-sm text-gray-600 mt-1">{type.description}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Smart Search */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">AI-Powered Search</h3>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask in natural language: 'What medications treat high blood pressure?' or 'Show me diabetes drugs'"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <Button 
            onClick={handleSmartSearch}
            disabled={isSearching || !query.trim()}
            className="px-6"
          >
            {isSearching ? <LoadingSpinner size="sm" /> : 'Search'}
          </Button>
        </div>

        {/* Quick Search Suggestions */}
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">Try asking:</div>
          <div className="flex flex-wrap gap-2">
            {[
              'What treats migraines effectively?',
              'Show me heart medications',
              'Find antibiotics for infections',
              'Depression treatment options'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Therapeutic Areas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Explore by Therapeutic Area</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {therapeuticAreas.map((area) => {
            const IconComponent = area.icon;
            return (
              <button
                key={area.name}
                onClick={() => handleConditionExplore(area.condition)}
                className={`p-4 rounded-lg ${area.color} hover:opacity-80 transition-opacity text-center`}
              >
                <IconComponent className="h-8 w-8 mx-auto mb-2" />
                <div className="font-medium text-sm">{area.name}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Common Conditions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Popular Conditions</h3>
        <div className="flex flex-wrap gap-2">
          {commonConditions.map((condition) => (
            <button
              key={condition}
              onClick={() => handleConditionExplore(condition)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 capitalize"
            >
              {condition}
            </button>
          ))}
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Search Results */}
      {isSearching && (
        <Card className="p-8 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Finding the best medications for you...</p>
        </Card>
      )}

      {/* Smart Search Results */}
      {searchResults && !isSearching && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Search Results</h3>
              <p className="text-gray-600">
                Found {searchResults.totalFound} medications for "{searchResults.query}"
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {searchResults?.drugs && searchResults.drugs.length > 0 ? searchResults.drugs.map((drug) => (
              <div key={drug.setId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-blue-600">
                      <Link href={`/drugs/${drug.slug}`} className="hover:underline">
                        {drug.drugName}
                      </Link>
                    </h4>
                    {drug.genericName && (
                      <p className="text-gray-600">Generic: {drug.genericName}</p>
                    )}
                    <p className="text-sm text-gray-500 mb-2">by {drug.manufacturer}</p>
                    
                    {drug.aiHighlights && drug.aiHighlights.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-gray-700 mb-1">Why this matches:</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {drug.aiHighlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {drug.relevanceScore && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Relevance</div>
                      <div className="text-lg font-semibold text-green-600">
                        {Math.round(drug.relevanceScore)}%
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Link 
                    href={`/drugs/${drug.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Drug Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-8">No drugs found. Try a different search query.</p>
            )}
          </div>

          {searchResults.suggestions && searchResults.suggestions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium mb-3">Related searches:</h4>
              <div className="flex flex-wrap gap-2">
                {searchResults.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(suggestion)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Condition Results */}
      {conditionResults && (
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Medications for {selectedCondition}</h3>
            <p className="text-gray-600">{conditionResults.aiSummary}</p>
          </div>

          <div className="space-y-4">
            {conditionResults.drugs.map((drug: any) => (
              <div key={drug.setId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-blue-600">
                      <Link href={`/drugs/${drug.slug}`} className="hover:underline">
                        {drug.drugName}
                      </Link>
                    </h4>
                    {drug.genericName && (
                      <p className="text-gray-600">Generic: {drug.genericName}</p>
                    )}
                    <p className="text-sm text-gray-500 mb-3">by {drug.labeler}</p>
                    
                    {drug.aiInsights && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-800 mb-2">{drug.aiInsights.relevanceExplanation}</p>
                        
                        {drug.aiInsights.keyBenefits?.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium text-blue-700">Key benefits: </span>
                            <span className="text-blue-600">{drug.aiInsights.keyBenefits.join(', ')}</span>
                          </div>
                        )}
                        
                        {drug.aiInsights.considerations?.length > 0 && (
                          <div className="text-sm mt-1">
                            <span className="font-medium text-blue-700">Considerations: </span>
                            <span className="text-blue-600">{drug.aiInsights.considerations.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {drug.relevanceScore && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Match</div>
                      <div className="text-lg font-semibold text-green-600">
                        {Math.round(drug.relevanceScore)}%
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Link 
                    href={`/drugs/${drug.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Drug Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Suggestions */}
      {suggestions && !searchResults && !conditionResults && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
          <p className="text-gray-600 mb-4">{suggestions.aiReasoning}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.suggestions?.slice(0, 6).map((drug: any) => (
              <div key={drug.setId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-blue-600">
                  <a href={`/drugs/${drug.slug}`} className="hover:underline">
                    {drug.drugName}
                  </a>
                </h4>
                {drug.genericName && (
                  <p className="text-sm text-gray-600">Generic: {drug.genericName}</p>
                )}
                <p className="text-xs text-gray-500">by {drug.labeler}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}