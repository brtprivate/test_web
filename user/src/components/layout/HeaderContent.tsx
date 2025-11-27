/**
 * Header Content Component
 * Shows "You Earned" amount and support button
 */

'use client';

import { useIncome } from '@/features/income/hooks/useIncome';
import Link from 'next/link';

export default function HeaderContent() {
  const { summary, isSummaryLoading, summaryError } = useIncome();

  const totalEarned = summary?.totalIncome || 0;
  
  // Show error state if connection fails
  const hasError = summaryError && 'status' in summaryError && 
    (summaryError.status === 'FETCH_ERROR' || summaryError.status === 'PARSING_ERROR');

  return (
    <div className="flex items-center justify-between w-full gap-2 sm:gap-3 flex-wrap">
      {/* Left: You Earned */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="flex flex-col min-w-0">
          <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
            You Earned
          </span>
          {isSummaryLoading ? (
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          ) : hasError ? (
            <span className="text-xs text-red-600 truncate" title="Connection error">
              --
            </span>
          ) : (
            <span className="text-sm sm:text-base md:text-lg font-bold text-green-600 truncate">
              ${totalEarned.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Withdraw Button */}
      <Link
        href="/withdraw"
        className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 
                 bg-green-600 hover:bg-green-700 active:bg-green-800 
                 text-white rounded-lg transition-colors touch-manipulation
                 text-xs sm:text-sm font-semibold shadow-sm flex-shrink-0"
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v8m4-4H8m12-2a7 7 0 10-14 0 7 7 0 0014 0z"
          />
        </svg>
        <span>Withdraw</span>
      </Link>

      {/* Right: Support Button */}
      <Link
        href="/support"
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 
                 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 
                 rounded-lg transition-colors touch-manipulation
                 text-xs sm:text-sm font-medium text-gray-700"
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="hidden sm:inline">Support</span>
      </Link>
    </div>
  );
}

