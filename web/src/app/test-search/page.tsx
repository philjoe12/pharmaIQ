'use client';

import { useState, useEffect } from 'react';

export default function TestSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/drugs/search?q=${encodeURIComponent(query)}&limit=10`);
        const data = await response.json();
        console.log('Search response:', data);
        
        if (data.success && data.data) {
          setResults(data.data);
        } else {
          setResults([]);
          setError('No results found');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test Drug Search</h1>
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search drugs..."
        className="w-full p-3 border rounded"
      />
      
      {loading && <p className="mt-2">Searching...</p>}
      {error && <p className="mt-2 text-red-500">Error: {error}</p>}
      
      <div className="mt-4">
        <h2 className="text-lg mb-2">Results ({results.length}):</h2>
        {results.map((drug) => (
          <div key={drug.setId} className="p-2 border-b">
            <div className="font-bold">{drug.drugName}</div>
            <div className="text-sm text-gray-600">{drug.genericName}</div>
            <div className="text-xs text-gray-500">{drug.labeler || drug.manufacturer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}