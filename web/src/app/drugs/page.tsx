import { Metadata } from 'next';
import Link from 'next/link';
import { Search, ChevronRight, Pill, Building2, Tag, ArrowUpDown, Filter } from 'lucide-react';

export const metadata: Metadata = {
  title: 'All Drugs - Browse FDA Approved Medications | PharmaIQ',
  description: 'Browse our comprehensive database of FDA-approved drugs. Find detailed information about prescription medications, including indications, dosing, and safety information.',
  keywords: 'FDA drugs, prescription drugs, medication list, drug database, pharmaceutical directory',
};

async function getDrugs() {
  try {
    const apiUrl = process.env.API_GATEWAY_URL || 'http://api:3001';
    const response = await fetch(`${apiUrl}/drugs?limit=100`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch drugs:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error('Error fetching drugs:', error);
    return [];
  }
}

// Group drugs by first letter
function groupDrugsByLetter(drugs: any[]) {
  const grouped = drugs.reduce((acc, drug) => {
    const letter = drug.drugName[0].toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(drug);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Sort each group
  Object.keys(grouped).forEach(letter => {
    grouped[letter].sort((a, b) => a.drugName.localeCompare(b.drugName));
  });
  
  return grouped;
}

export default async function DrugsPage() {
  const drugs = await getDrugs();
  const groupedDrugs = groupDrugsByLetter(drugs);
  const letters = Object.keys(groupedDrugs).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Browse All Drugs
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Explore our comprehensive database of {drugs.length} FDA-approved medications
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <form action="/search" method="GET" className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search for a drug by name..."
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Pill className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{drugs.length}</p>
                <p className="text-gray-600">Total Drugs</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {new Set(drugs.map(d => d.labeler)).size}
                </p>
                <p className="text-gray-600">Manufacturers</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Tag className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{letters.length}</p>
                <p className="text-gray-600">Drug Categories</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alphabet Navigation */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-40 mt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto py-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {letters.map(letter => (
                <a
                  key={letter}
                  href={`#${letter}`}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg font-semibold text-gray-700 transition-colors"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drug Listings */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {letters.map(letter => (
            <div key={letter} id={letter} className="mb-12 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                {letter}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedDrugs[letter].map((drug) => (
                  <Link
                    key={drug.setId}
                    href={`/drugs/${drug.slug}`}
                    className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-100 hover:border-blue-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {drug.drugName}
                        </h3>
                        {drug.label?.genericName && (
                          <p className="text-sm text-gray-600 mt-1">
                            {drug.label.genericName}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span className="truncate">{drug.labeler}</span>
                      </div>
                      
                      {drug.label?.indicationsAndUsage && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {drug.label.indicationsAndUsage.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {drug.label?.productType && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {drug.label.productType}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Need Help Finding the Right Drug Information?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Use our advanced search tools or AI-powered drug comparison features to find exactly what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
            >
              <Search className="w-5 h-5 mr-2" />
              Advanced Search
            </Link>
            <Link
              href="/drugs/compare"
              className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
            >
              <ArrowUpDown className="w-5 h-5 mr-2" />
              Compare Drugs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}