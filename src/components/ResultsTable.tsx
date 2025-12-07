'use client';

import { useState, useMemo } from 'react';
import { MatchResult } from '@/types';
import { ResultRow } from './ResultRow';

interface ResultsTableProps {
  results: MatchResult[];
  isLoading?: boolean;
  error?: string | null;
}

export function ResultsTable({
  results,
  isLoading = false,
  error = null,
}: ResultsTableProps) {
  const [filter, setFilter] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = results;

    // Apply "contains" filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      filtered = results.filter(
        (r) =>
          r.position.toLowerCase().includes(lowerFilter) ||
          r.shortName.toLowerCase().includes(lowerFilter) ||
          r.why.toLowerCase().includes(lowerFilter)
      );
    }

    // Sort by score
    return [...filtered].sort((a, b) =>
      sortDirection === 'desc' ? b.score - a.score : a.score - b.score
    );
  }, [results, filter, sortDirection]);

  // Download results as JSON
  const handleDownload = () => {
    const data = JSON.stringify(filteredResults, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matching-results-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Results</h2>
        {results.length > 0 && (
          <span className="text-sm text-gray-500">
            {filteredResults.length} of {results.length} items
          </span>
        )}
      </div>

      {/* Filter and actions */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label htmlFor="filter" className="sr-only">
            Filter results
          </label>
          <input
            type="text"
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter results..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>
        <button
          onClick={handleDownload}
          disabled={filteredResults.length === 0}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          aria-label="Download results as JSON"
        >
          Download JSON
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Matching services...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-red-600 font-medium">Error</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && results.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No results yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Fill in the intake form and click &quot;Run Matching&quot;
            </p>
          </div>
        </div>
      )}

      {/* No filter matches */}
      {!isLoading && !error && results.length > 0 && filteredResults.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No results match your filter</p>
            <button
              onClick={() => setFilter('')}
              className="mt-2 text-sm text-blue-600 hover:text-blue-500"
            >
              Clear filter
            </button>
          </div>
        </div>
      )}

      {/* Results table */}
      {!isLoading && !error && filteredResults.length > 0 && (
        <div className="flex-1 overflow-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                >
                  Position
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Short Name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100"
                  onClick={() =>
                    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                    }
                  }}
                  aria-sort={sortDirection === 'desc' ? 'descending' : 'ascending'}
                >
                  Score {sortDirection === 'desc' ? '↓' : '↑'}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Why
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map((result, index) => (
                <ResultRow
                  key={result.position}
                  result={result}
                  rank={index + 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
