import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { drugsApi, DrugLabel } from '@/lib/api/drugs.api';

export const metadata: Metadata = {
  title: 'Search Drugs - PharmaIQ',
  description: 'Search our comprehensive database of FDA-approved drugs',
};

interface SearchPageProps {
  searchParams: {
    q?: string;
    category?: string;
    page?: string;
  };
}

async function getSearchResults(query: string, page: number) {
  try {
    // Use internal API route that proxies to API Gateway
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const url = `${baseUrl}/api/drugs?search=${encodeURIComponent(query)}&page=${page}&limit=12`;
    
    const response = await fetch(url, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Search API error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.success ? data : null;
  } catch (error) {
    console.error('Error searching drugs:', error);
    return null;
  }
}

function DrugCard({ drug }: { drug: DrugLabel }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
          <span className="text-blue-600 font-bold text-lg">Rx</span>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">FDA Approved</span>
      </div>
      
      <h3 className="text-xl font-bold mb-2">
        <Link 
          href={`/drugs/${drug.slug}`}
          className="text-gray-900 hover:text-blue-600 transition-colors group-hover:text-blue-600"
        >
          {drug.drugName}
        </Link>
      </h3>
      
      {drug.label.genericName && (
        <p className="text-gray-600 mb-2">
          <span className="font-medium">Generic:</span> {drug.label.genericName}
        </p>
      )}
      
      <p className="text-gray-600 mb-4">
        <span className="font-medium">Manufacturer:</span> {drug.labeler}
      </p>
      
      <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
        View Details <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const category = searchParams.category || 'all';
  const page = parseInt(searchParams.page || '1', 10);

  const searchResults = query ? await getSearchResults(query, page) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Search Header */}
      <section className="bg-gradient-to-r from-blue-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">Drug Search</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Search through our comprehensive database of FDA-approved medications
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <form className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="q"
                  placeholder="Search by drug name, condition, or active ingredient..."
                  defaultValue={query}
                  className="w-full px-6 py-4 text-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-300/50 text-lg"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                Search Drugs
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Filters</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                    <select
                      name="category"
                      defaultValue={category}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      <option value="prescription">Prescription</option>
                      <option value="otc">Over-the-Counter</option>
                      <option value="generic">Generic</option>
                      <option value="brand">Brand Name</option>
                    </select>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Drug Class</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded text-blue-600 mr-3" />
                        <span className="text-gray-700">Cardiovascular</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded text-blue-600 mr-3" />
                        <span className="text-gray-700">Neurological</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded text-blue-600 mr-3" />
                        <span className="text-gray-700">Infectious Disease</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded text-blue-600 mr-3" />
                        <span className="text-gray-700">Immunology</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
            
            {/* Main Results */}
            <main className="lg:col-span-3">
              {query ? (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Search Results for "{query}"
                      </h2>
                      {searchResults && (
                        <p className="text-gray-600">
                          {searchResults.pagination.total} medications found
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">Sort by:</span>
                      <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Relevance</option>
                        <option>Name A-Z</option>
                        <option>Name Z-A</option>
                        <option>Recently Added</option>
                      </select>
                    </div>
                  </div>
                  
                  {searchResults && searchResults.data.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {searchResults.data.map((drug: DrugLabel) => (
                          <DrugCard key={drug.setId} drug={drug} />
                        ))}
                      </div>
                      
                      {searchResults.pagination.totalPages > 1 && (
                        <div className="flex justify-center mt-12">
                          <div className="flex space-x-2">
                            {Array.from({ length: searchResults.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <Link
                                key={pageNum}
                                href={`/search?q=${encodeURIComponent(query)}&page=${pageNum}`}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                  pageNum === page
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md'
                                }`}
                              >
                                {pageNum}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No medications found</h3>
                      <p className="text-gray-600 mb-6">Try adjusting your search terms or filters</p>
                      <Link href="/search" className="text-blue-600 hover:text-blue-700 font-medium">
                        Clear search and try again
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Your Drug Search</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Enter a drug name, condition, or active ingredient to search our comprehensive FDA database
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/drugs/discovery" className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-all">
                      Browse All Drugs
                    </Link>
                    <Link href="/drugs/compare" className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-all">
                      Compare Medications
                    </Link>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}