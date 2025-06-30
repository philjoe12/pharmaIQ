import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
export function SearchResults({ results, loading, error }) {
    if (loading) {
        return (<div className="flex justify-center py-8">
        <LoadingSpinner size="lg"/>
      </div>);
    }
    if (error) {
        return (<div className="text-center py-8 text-red-600">
        <p>Error: {error}</p>
      </div>);
    }
    if (results.length === 0) {
        return (<div className="text-center py-8 text-gray-500">
        <p>No drugs found. Try adjusting your search criteria.</p>
      </div>);
    }
    return (<div className="space-y-4">
      <p className="text-sm text-gray-600">
        Found {results.length} result{results.length !== 1 ? 's' : ''}
      </p>
      
      <div className="grid gap-4">
        {results.map((drug) => (<Card key={drug.id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/drugs/${drug.slug}`} className="hover:text-blue-600">
                  {drug.name}
                </Link>
              </CardTitle>
              {drug.genericName && (<p className="text-sm text-gray-600">Generic: {drug.genericName}</p>)}
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">{drug.description}</p>
              <p className="text-sm text-gray-500">Manufacturer: {drug.manufacturer}</p>
            </CardContent>
          </Card>))}
      </div>
    </div>);
}
