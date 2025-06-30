import Link from 'next/link';

async function getPopularDrugs() {
  try {
    const apiUrl = typeof window === 'undefined' ? 'http://api:3001' : 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/drugs?limit=6`);
    const data = await response.json();
    return data.success && data.data ? data.data : [];
  } catch (error) {
    console.error('Error fetching drugs:', error);
    return [];
  }
}

export default async function Home() {
  const drugs = await getPopularDrugs();
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-teal-700">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-teal-600/90"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                AI-Enhanced 
                <span className="block text-transparent bg-gradient-to-r from-teal-200 to-blue-200 bg-clip-text">
                  Drug Information
                </span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Your trusted source for comprehensive FDA drug information powered by artificial intelligence. 
                Access detailed medication data designed for healthcare professionals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/search" 
                  className="bg-white text-blue-700 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl text-center"
                >
                  Search Drugs Now
                </Link>
                <Link 
                  href="/drugs/discovery" 
                  className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-blue-700 transition-all text-center"
                >
                  Browse Drug Database
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold text-white mb-2">{drugs.length}+</div>
                    <div className="text-blue-100 text-sm">FDA Approved Drugs</div>
                  </div>
                  <div className="bg-white/20 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold text-white mb-2">AI</div>
                    <div className="text-blue-100 text-sm">Enhanced Content</div>
                  </div>
                  <div className="bg-white/20 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold text-white mb-2">24/7</div>
                    <div className="text-blue-100 text-sm">Access Available</div>
                  </div>
                  <div className="bg-white/20 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold text-white mb-2">Pro</div>
                    <div className="text-blue-100 text-sm">Healthcare Tools</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Comprehensive Drug Information</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access FDA-approved drug data enhanced with AI-powered insights for healthcare professionals
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/search" className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Drug Search</h3>
              <p className="text-gray-600 mb-6">Search through thousands of FDA-approved medications with advanced filtering and AI-powered recommendations.</p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                Start Searching <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
            
            <Link href="/drugs/discovery" className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">FDA Label Data</h3>
              <p className="text-gray-600 mb-6">Access comprehensive FDA-approved drug labeling with detailed indications, dosages, warnings, and contraindications.</p>
              <div className="flex items-center text-teal-600 font-semibold group-hover:text-teal-700">
                Browse Database <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
            
            <Link href="/drugs/compare" className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Enhanced Insights</h3>
              <p className="text-gray-600 mb-6">Get AI-powered explanations, drug comparisons, and professional insights to support clinical decision-making.</p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700">
                Explore AI Tools <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Drugs Section */}
      {Array.isArray(drugs) && drugs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Medications</h2>
              <p className="text-xl text-gray-600">Explore our most accessed drug information pages</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {drugs.map((drug) => (
                <Link
                  key={drug.setId}
                  href={`/drugs/${drug.slug}`}
                  className="group bg-gray-50 hover:bg-white rounded-2xl p-8 transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">Rx</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">FDA Approved</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{drug.drugName}</h3>
                  
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
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link 
                href="/search" 
                className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
              >
                Search All Medications
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Trusted by Healthcare Professionals</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">FDA</div>
              <div className="text-gray-600">Approved Data</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-teal-600 mb-2">AI</div>
              <div className="text-gray-600">Enhanced Content</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">Real-time</div>
              <div className="text-gray-600">Updates</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">Secure</div>
              <div className="text-gray-600">Platform</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}