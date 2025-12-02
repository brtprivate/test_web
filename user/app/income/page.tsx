/**
 * Income History Page
 * Displays all income transactions for the user
 */

'use client';

import { useState, useMemo } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useIncomeHistory, useIncome } from '@/features/income/hooks/useIncome';
import { IncomeTransaction } from '@/features/income/api/incomeApi';

type IncomeTypeFilter = 'all' | 'daily_roi' | 'referral' | 'team_income' | 'bonus' | 'compounding';

export default function IncomePage() {
  const [filter, setFilter] = useState<IncomeTypeFilter>('all');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { summary } = useIncome();
  const { history, total, isLoading, error } = useIncomeHistory({
    limit,
    skip: page * limit,
    incomeType: filter === 'all' ? undefined : filter,
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to replace ROI text in descriptions
  const formatDescription = (description: string) => {
    return description
      .replace(/Daily ROI/gi, 'Trade profit')
      .replace(/daily ROI/gi, 'Trade profit')
      .replace(/\bROI\b/gi, 'Trade profit');
  };

  // Get income type label
  const getIncomeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily_roi: 'Trade profit',
      referral: 'Referral',
      team_income: 'Team Income',
      bonus: 'Bonus',
      compounding: 'Compounding',
    };
    return labels[type] || type;
  };

  // Get income type badge variant
  const getIncomeTypeVariant = (type: string): 'primary' | 'success' | 'warning' | 'danger' | 'gray' => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      daily_roi: 'success',
      referral: 'primary',
      team_income: 'warning',
      bonus: 'primary',
      compounding: 'success',
    };
    return variants[type] || 'gray';
  };

  // Get status badge variant
  const getStatusVariant = (status: string): 'primary' | 'success' | 'warning' | 'danger' | 'gray' => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
    };
    return variants[status] || 'gray';
  };

  // Calculate totals by type
  const totalsByType = useMemo(() => {
    const totals: Record<string, number> = {};
    history.forEach((transaction) => {
      totals[transaction.incomeType] = (totals[transaction.incomeType] || 0) + transaction.amount;
    });
    return totals;
  }, [history]);

  const hasMore = (page + 1) * limit < total;

  return (
    <MobileLayout showBottomNav={true} showHeaderContent={true}>
      <div className="space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Income History
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View all your income transactions
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Income</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  ${summary.totalIncome?.toFixed(2) || '0.00'}
                </p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Trade profit</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  ${summary.dailyROI?.toFixed(2) || '0.00'}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Filter Tabs */}
        <Card>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {(['all', 'daily_roi', 'referral', 'team_income', 'bonus', 'compounding'] as IncomeTypeFilter[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilter(type);
                  setPage(0);
                }}
                className={`
                  px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap
                  transition-colors touch-manipulation
                  ${
                    filter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {type === 'all' ? 'All' : getIncomeTypeLabel(type)}
              </button>
            ))}
          </div>
        </Card>

        {/* Income List */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Transactions
            </h2>
            {total > 0 && (
              <Badge variant="gray" size="sm">
                {total} total
              </Badge>
            )}
          </div>

          {isLoading && page === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-600 mb-2">
                Failed to load income history
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-gray-600">No income transactions found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {history.map((transaction: IncomeTransaction) => (
                  <div
                    key={transaction._id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={getIncomeTypeVariant(transaction.incomeType)}
                            size="sm"
                          >
                            {getIncomeTypeLabel(transaction.incomeType)}
                          </Badge>
                          {transaction.level && (
                            <Badge variant="gray" size="sm">
                              Level {transaction.level}
                            </Badge>
                          )}
                          <Badge
                            variant={getStatusVariant(transaction.status)}
                            size="sm"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {formatDescription(transaction.description)}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-lg sm:text-xl font-bold text-green-600">
                          +${transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(transaction.incomeDate)}</span>
                      {transaction.referenceId && (
                        <span className="truncate ml-2">
                          Ref: {transaction.referenceId.slice(-8)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}

              {/* Totals Summary */}
              {Object.keys(totalsByType).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Filtered Totals:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(totalsByType).map(([type, amount]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-xs text-gray-600">
                          {getIncomeTypeLabel(type)}:
                        </span>
                        <span className="text-xs font-semibold text-gray-900">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </MobileLayout>
  );
}

