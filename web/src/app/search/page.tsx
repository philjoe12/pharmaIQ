import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Search Drugs - PharmaIQ',
  description: 'Search our comprehensive database of FDA-approved drugs',
};

async function searchDrugs(query: string) {
  if (!query) return null;
  
  try {
    const apiUrl = process.env.API_GATEWAY_URL || 'http://api:3001';
    const response = await fetch(`${apiUrl}/drugs/search?q=${encodeURIComponent(query)}&limit=20`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Search failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search error:', error);
    return null;
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || '';
  const results = query ? await searchDrugs(query) : null;

  async function handleSearch(formData: FormData) {
    'use server';
    const searchQuery = formData.get('q') as string;
    if (searchQuery?.trim()) {
      redirect(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

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
          
          <form action={handleSearch} className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search by drug name..."
                className="flex-1 px-6 py-4 text-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-300/50 text-lg"
                autoFocus
              />
              <button
                type="submit"
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Search Examples */}
          <div className="mt-6 text-center">
            <p className="text-sm text-blue-200 mb-2">Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Emgality', 'Mounjaro', 'Taltz', 'Verzenio'].map((example) => (
                <Link
                  key={example}
                  href={`/search?q=${encodeURIComponent(example)}`}
                  className="px-3 py-1 text-sm bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                >
                  {example}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {query && results && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Results for "{query}"
                </h2>
                <p className="text-gray-600">
                  Found {results.data?.length || 0} medications
                </p>
              </div>

              {results.data && results.data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {results.data.map((drug: any) => (
                    <div key={drug.setId} className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all p-6 border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-lg">Rx</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">
                        <Link 
                          href={`/drugs/${drug.slug}`}
                          className="text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {drug.drugName}
                        </Link>
                      </h3>
                      
                      {drug.label?.genericName && (
                        <p className="text-gray-600 mb-2">
                          <span className="font-medium">Generic:</span> {drug.label.genericName}
                        </p>
                      )}
                      
                      <p className="text-gray-600 mb-4">
                        <span className="font-medium">Manufacturer:</span> {drug.labeler}
                      </p>

                      {drug.label?.indicationsAndUsage && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {drug.label.indicationsAndUsage.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                      )}
                      
                      <Link 
                        href={`/drugs/${drug.slug}`}
                        className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
                      >
                        View Details 
                        <span className="ml-2">→</span>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-16 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No medications found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search terms or using different keywords</p>
                  <Link href="/drugs/discovery" className="text-blue-600 hover:text-blue-700 font-medium">
                    Browse drug discovery →
                  </Link>
                </div>
              )}
            </div>
          )}

          {!query && (
            <div className="bg-white rounded-lg shadow-sm p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Your Drug Search</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Enter a drug name to search our comprehensive FDA database
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/drugs" 
                  className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-all"
                >
                  Browse All Drugs
                </Link>
                <Link 
                  href="/drugs/discovery" 
                  className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-all"
                >
                  Smart Drug Discovery
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}