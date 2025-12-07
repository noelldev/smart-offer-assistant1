'use client';

import { useState } from 'react';
import { MatchResult } from '@/types';

interface ResultRowProps {
  result: MatchResult;
  rank: number;
}

export function ResultRow({ result, rank }: ResultRowProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Color code score
  const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-green-700 bg-green-100';
    if (score >= 30) return 'text-yellow-700 bg-yellow-100';
    return 'text-gray-700 bg-gray-100';
  };

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowDetails(!showDetails);
          }
        }}
        aria-expanded={showDetails}
      >
        <td className="px-4 py-3 text-sm text-gray-500 text-center">
          {rank}
        </td>
        <td className="px-4 py-3 text-sm font-mono text-gray-900">
          {result.position}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900">
          {result.shortName}
          <span className="ml-2 text-gray-400 text-xs">({result.unit})</span>
        </td>
        <td className="px-4 py-3 text-sm text-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(result.score)}`}
          >
            {result.score}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
          {result.why}
        </td>
      </tr>

      {/* Expanded details row */}
      {showDetails && (
        <tr className="bg-blue-50">
          <td colSpan={5} className="px-4 py-3">
            <div className="text-sm space-y-2">
              <h4 className="font-medium text-gray-900">Match Details</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium text-gray-700">
                    Matched Keywords:
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {result.matchedKeywords.length > 0 ? (
                      result.matchedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                        >
                          {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Scores:</span>
                  <ul className="mt-1 space-y-1 text-gray-600">
                    <li>
                      Fuzzy Score: {Math.round(result.fuzzyScore * 10) / 10}
                    </li>
                    <li>
                      Category Boost:{' '}
                      {result.categoryBoost ? (
                        <span className="text-green-600">Yes (difficult access)</span>
                      ) : (
                        'No'
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
