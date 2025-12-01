/**
 * Deposits History Page
 * Shows only deposit records for the current user.
 */

'use client';

import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useDeposits } from '@/features/deposits/hooks/useDeposits';

export default function DepositsPage() {
  const limit = 20;
  const { deposits, total, isLoading, error, refetch } = useDeposits({
    limit,
    skip: 0,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusVariant = (
    status: string
  ): 'primary' | 'success' | 'warning' | 'danger' | 'gray' => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      completed: 'success',
      confirmed: 'primary',
      pending: 'warning',
      failed: 'danger',
      cancelled: 'gray',
    };
    return variants[status.toLowerCase()] || 'gray';
  };

  return (
    <MobileLayout showBottomNav={true}>
      <div className="space-y-4 sm:space-y-5 pb-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            Deposit History
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            All deposits that have been added to your Investment Wallet.
          </p>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Deposits ({total || deposits.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-red-600">Failed to load deposits.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-sm text-gray-700">No deposits found yet.</p>
              <p className="text-xs text-gray-500">
                When you add funds via Buy TP, your deposits will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="success" size="sm">
                          Deposit
                        </Badge>
                        <Badge variant={getStatusVariant(deposit.status)} size="sm">
                          {deposit.status}
                        </Badge>
                      </div>
                      <p className="text-gray-700 font-medium">
                        {deposit.currency} on {deposit.network}
                      </p>
                      {deposit.transactionHash && (
                        <p className="text-xs text-gray-500">
                          TX: {deposit.transactionHash.slice(0, 8)}...
                          {deposit.transactionHash.slice(-6)}
                        </p>
                      )}
                      {deposit.description && (
                        <p className="text-xs text-gray-500">{deposit.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-base sm:text-lg font-bold text-green-600">
                        +${deposit.amount.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {formatDate(deposit.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MobileLayout>
  );
}


