import { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowRight, Pill, FlaskConical, GitCompare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Drug Information Portal - PharmaIQ',
  description: 'Explore comprehensive drug information, compare medications, and discover treatment options with AI-powered insights.',
};

export default function DrugsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Drug Information Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access comprehensive drug information, compare medications side-by-side, 
            and discover treatment options with AI-powered insights.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/drugs/discovery">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center mb-4">
                <FlaskConical className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold">Smart Drug Discovery</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Find the right medication based on your symptoms, conditions, or treatment goals using AI.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                Start Discovery
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Card>
          </Link>

          <Link href="/drugs/compare">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center mb-4">
                <GitCompare className="h-8 w-8 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold">Compare Medications</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Compare up to 5 medications side-by-side with detailed effectiveness and safety analysis.
              </p>
              <div className="flex items-center text-green-600 font-medium">
                Compare Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Card>
          </Link>

          <Card className="p-6 bg-gray-100">
            <div className="flex items-center mb-4">
              <Pill className="h-8 w-8 text-purple-600 mr-3" />
              <h2 className="text-xl font-semibold">Browse All Drugs</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Browse our comprehensive database of FDA-approved medications with detailed information.
            </p>
            <div className="text-gray-500 italic">
              Coming Soon
            </div>
          </Card>
        </div>

        {/* Search Section */}
        <Card className="p-8">
          <h3 className="text-2xl font-semibold mb-6 text-center">
            Search for Drug Information
          </h3>
          <form action="/search" method="GET" className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="q"
                placeholder="Search by drug name, condition, or symptom..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                Search
              </Button>
            </div>
          </form>
        </Card>

        {/* Popular Categories */}
        <div className="mt-12">
          <h3 className="text-2xl font-semibold mb-6">Popular Drug Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Antibiotics',
              'Pain Relief',
              'Cardiovascular',
              'Diabetes',
              'Mental Health',
              'Respiratory',
              'Immunology',
              'Oncology',
            ].map((category) => (
              <Link
                key={category}
                href={`/search?category=${encodeURIComponent(category.toLowerCase())}`}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-center"
              >
                <span className="font-medium text-gray-800">{category}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-4">About Our Drug Information</h3>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h4 className="font-medium mb-2">FDA-Approved Data</h4>
              <p className="text-sm">
                All drug information is sourced from official FDA labels and enhanced with AI-powered insights
                for better understanding and decision-making.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Healthcare Professional Focus</h4>
              <p className="text-sm">
                Our platform is designed for healthcare professionals, providing detailed clinical information,
                drug interactions, and evidence-based recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}