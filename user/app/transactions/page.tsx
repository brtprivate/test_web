/**
 * Transactions Page
 * Mobile-first transactions page with filtering by type
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useGetWithdrawalsQuery } from '@/features/withdrawals/api/withdrawalsApi';
import { Transaction } from '@/features/transactions/api/transactionsApi';
import { Withdrawal } from '@/features/withdrawals/api/withdrawalsApi';

type TransactionTypeFilter = 'all' | 'withdrawal' | 'deposit' | 'investment' | 'income' | 'referral';

export default function TransactionsPage() {
  const [filter, setFilter] = useState<TransactionTypeFilter>('all');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Get type from URL on mount and when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeFromUrl = urlParams.get('type') || 'all';
    const validType = ['all', 'withdrawal', 'deposit', 'investment', 'income', 'referral'].includes(typeFromUrl)
      ? (typeFromUrl as TransactionTypeFilter)
      : 'all';
    setFilter(validType);
    setPage(0);
  }, []);

  // Fetch transactions
  const { transactions, total, isLoading, error } = useTransactions({
    type: filter === 'all' || filter === 'withdrawal' ? undefined : filter,
    limit,
    skip: page * limit,
  });

  // Fetch withdrawals if filter is withdrawal or all
  const {
    data: withdrawalsData,
    isLoading: isWithdrawalsLoading,
    error: withdrawalsError,
  } = useGetWithdrawalsQuery(
    {
      limit: filter === 'withdrawal' ? limit : 0,
      skip: filter === 'withdrawal' ? page * limit : 0,
    },
    { skip: filter !== 'withdrawal' && filter !== 'all' }
  );

  const withdrawals = withdrawalsData?.data?.withdrawals || [];

  // Combine transactions and withdrawals
  const allTransactions = useMemo(() => {
    const combined: Array<
      | (Transaction & { _type: 'transaction' })
      | (Withdrawal & { _type: 'withdrawal' })
    > = [];

    // Add regular transactions
    if (filter === 'all' || filter !== 'withdrawal') {
      transactions.forEach((tx) => {
        combined.push({ ...tx, _type: 'transaction' as const });
      });
    }

    // Add withdrawals
    if (filter === 'all' || filter === 'withdrawal') {
      withdrawals.forEach((wd) => {
        combined.push({ ...wd, _type: 'withdrawal' as const });
      });
    }

    // Sort by date (newest first)
    return combined.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [transactions, withdrawals, filter]);

  const isLoadingData = isLoading || (filter === 'withdrawal' || filter === 'all' ? isWithdrawalsLoading : false);
  const hasError = error || (filter === 'withdrawal' || filter === 'all' ? withdrawalsError : null);
  const totalCount = filter === 'withdrawal' 
    ? withdrawalsData?.total || 0 
    : filter === 'all' 
      ? (total || 0) + (withdrawalsData?.total || 0)
      : total || 0;

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

  // Get status badge variant
  const getStatusVariant = (status: string): 'primary' | 'success' | 'warning' | 'danger' | 'gray' => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      completed: 'success',
      approved: 'success',
      pending: 'warning',
      failed: 'danger',
      rejected: 'danger',
      cancelled: 'gray',
    };
    return variants[status.toLowerCase()] || 'gray';
  };

  // Get type badge variant
  const getTypeVariant = (type: string): 'primary' | 'success' | 'warning' | 'danger' | 'gray' => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      withdrawal: 'danger',
      deposit: 'success',
      investment: 'primary',
      income: 'success',
      referral: 'primary',
    };
    return variants[type.toLowerCase()] || 'gray';
  };

  // Format amount
  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'withdrawal' ? '-' : '+';
    return `${sign}$${amount.toFixed(2)}`;
  };

  const hasMore = (page + 1) * limit < totalCount;

  return (
    <MobileLayout showBottomNav={true} showHeaderContent={true}>
      <div className="space-y-3 sm:space-y-4 pb-4">
        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Transactions
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">
            View all your transaction history
          </p>
        </div>

        {/* Filter Tabs - Mobile First */}
        <Card className="p-2 sm:p-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {(
              [
                'all',
                'withdrawal',
                'deposit',
                'investment',
                'income',
                'referral',
              ] as TransactionTypeFilter[]
            ).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilter(type);
                  setPage(0);
                  // Update URL without page reload
                  const url = new URL(window.location.href);
                  if (type === 'all') {
                    url.searchParams.delete('type');
                  } else {
                    url.searchParams.set('type', type);
                  }
                  window.history.pushState({}, '', url.toString());
                }}
                className={`
                  px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap
                  transition-all duration-200 touch-manipulation
                  ${
                    filter === type
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                  }
                `}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Transactions List */}
        <Card>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              {filter === 'all' ? 'All Transactions' : `${filter.charAt(0).toUpperCase() + filter.slice(1)}s`}
            </h2>
            {totalCount > 0 && (
              <Badge variant="gray" size="sm">
                {totalCount} total
              </Badge>
            )}
          </div>

          {isLoadingData && page === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : hasError ? (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-600 mb-2">
                Failed to load transactions
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          ) : allTransactions.length === 0 ? (
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
              <p className="text-sm sm:text-base text-gray-600 mb-1">
                No transactions found
              </p>
              <p className="text-xs text-gray-500">
                {filter !== 'all' ? `No ${filter} transactions yet` : 'Your transaction history will appear here'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {allTransactions.map((item) => {
                  const isWithdrawal = item._type === 'withdrawal';
                  const withdrawal = isWithdrawal ? (item as Withdrawal & { _type: 'withdrawal' }) : null;
                  const transaction = !isWithdrawal ? (item as Transaction & { _type: 'transaction' }) : null;

                  const uniqueKey = isWithdrawal 
                    ? `withdrawal-${withdrawal!._id}` 
                    : `transaction-${transaction!.id}`;

                  return (
                    <div
                      key={uniqueKey}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors bg-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <Badge
                              variant={getTypeVariant(
                                isWithdrawal ? 'withdrawal' : transaction!.type
                              )}
                              size="sm"
                            >
                              {isWithdrawal
                                ? 'Withdrawal'
                                : transaction!.type.charAt(0).toUpperCase() +
                                  transaction!.type.slice(1)}
                            </Badge>
                            <Badge
                              variant={getStatusVariant(
                                isWithdrawal ? withdrawal!.status : transaction!.status
                              )}
                              size="sm"
                            >
                              {isWithdrawal
                                ? withdrawal!.status
                                : transaction!.status}
                            </Badge>
                          </div>
                          {isWithdrawal ? (
                            <div className="space-y-1">
                              <p className="text-xs sm:text-sm text-gray-600">
                                Wallet: {withdrawal!.walletAddress.slice(0, 6)}...
                                {withdrawal!.walletAddress.slice(-4)}
                              </p>
                              {withdrawal!.transactionHash && (
                                <p className="text-xs text-gray-500">
                                  TX: {withdrawal!.transactionHash.slice(0, 8)}...
                                  {withdrawal!.transactionHash.slice(-6)}
                                </p>
                              )}
                              {withdrawal!.adminNote && (
                                <p className="text-xs text-gray-500 italic">
                                  Note: {withdrawal!.adminNote}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                              {transaction!.description || 'Transaction'}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p
                            className={`text-base sm:text-lg md:text-xl font-bold ${
                              isWithdrawal || transaction!.type === 'withdrawal'
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {formatAmount(
                              isWithdrawal ? withdrawal!.amount : transaction!.amount,
                              isWithdrawal ? 'withdrawal' : transaction!.type
                            )}
                          </p>
                          {isWithdrawal && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {withdrawal!.currency} {withdrawal!.network}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span>
                          {formatDate(
                            isWithdrawal
                              ? withdrawal!.createdAt
                              : transaction!.createdAt || ''
                          )}
                        </span>
                        {isWithdrawal && withdrawal!.completedAt && (
                          <span className="text-green-600">
                            Completed: {formatDate(withdrawal!.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isLoadingData}
                    fullWidth
                  >
                    {isLoadingData ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </MobileLayout>
  );
}

