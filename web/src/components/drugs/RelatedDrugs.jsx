import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
export function RelatedDrugs({ drugs }) {
    if (!drugs.length) {
        return (<section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Related Drugs</h2>
        <p className="text-gray-500">No related drugs found.</p>
      </section>);
    }
    return (<section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Related Drugs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drugs.map((drug) => (<Card key={drug.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                <Link href={`/drugs/${drug.slug}`} className="hover:text-blue-600">
                  {drug.name}
                </Link>
              </CardTitle>
              {drug.genericName && (<p className="text-sm text-gray-600">{drug.genericName}</p>)}
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Similarity</span>
                <span className="text-sm font-medium">{Math.round(drug.similarity * 100)}%</span>
              </div>
            </CardContent>
          </Card>))}
      </div>
    </section>);
}
