'use client';

import { useState, useEffect } from 'react';
import { IntakeForm } from '@/components/IntakeForm';
import { ResultsTable } from '@/components/ResultsTable';
import { IntakeFormSchema } from '@/lib/validation';
import { matchServices, flattenCatalogue } from '@/lib/matcher';
import { CatalogueItem, MatchResult, Catalogue } from '@/types';

// Import sample catalogue for demo
import sampleCatalogue from '../../sample/catalogue.json';

export default function Home() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);

  // Load and flatten catalogue on mount
  useEffect(() => {
    try {
      const flattened = flattenCatalogue(sampleCatalogue as Catalogue);
      setCatalogue(flattened);
    } catch (err) {
      setError('Failed to load service catalogue');
      console.error('Catalogue load error:', err);
    }
  }, []);

  const handleSubmit = async (data: IntakeFormSchema) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 300));

      const matchResults = matchServices(
        data.description,
        data.difficultAccess,
        catalogue
      );

      setResults(matchResults);

      if (matchResults.length === 0) {
        // Not an error, just no matches
        console.log('No matches found for the given description');
      }
    } catch (err) {
      setError('Failed to run matching algorithm');
      console.error('Matching error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Smart Offer Assistant
              </h1>
              <p className="text-sm text-gray-500">
                Match client needs to trade services
              </p>
            </div>
            <div className="text-sm text-gray-400">
              {catalogue.length} services loaded
            </div>
          </div>
        </div>
      </header>

      {/* Main content - two panel layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)]">
          {/* Left panel - Client Intake */}
          <div className="bg-white rounded-lg shadow p-6 overflow-auto">
            <IntakeForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          {/* Right panel - Results */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col min-h-[500px]">
            <ResultsTable
              results={results}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-400 text-center">
            Smart Offer Assistant MVP - Deterministic matching (no LLM)
          </p>
        </div>
      </footer>
    </div>
  );
}
