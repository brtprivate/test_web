"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useGetDepositsQuery,
  useUpdateDepositStatusMutation,
} from '@/features/deposits/api';
import type { DepositStatus } from '@/features/deposits/types';

const statusOptions: DepositStatus[] = ['pending', 'confirmed', 'completed', 'failed'];

export const DepositsBoard = () => {
  const [statusFilter, setStatusFilter] = useState<string>();
  const { data, isLoading, refetch } = useGetDepositsQuery({
    status: statusFilter,
    limit: 20,
  });
  const [updateDeposit, { isLoading: updating }] = useUpdateDepositStatusMutation();

  const handleStatusChange = async (id: string, nextStatus: DepositStatus) => {
    try {
      await updateDeposit({
        id,
        body: { status: nextStatus, adminNote: 'Updated from admin console' },
      }).unwrap();
      toast.success(`Deposit moved to ${nextStatus}`);
      refetch();
    } catch (error: unknown) {
      type ApiError = { data?: { message?: string }; message?: string };
      let message = 'Unable to update status';
      if (typeof error === 'object' && error !== null) {
        const apiError = error as ApiError;
        message = apiError.data?.message || apiError.message || message;
      }
      toast.error(message);
    }
  };

  const deposits = data?.deposits ?? [];

  return (
    <Card
      title="Capital pipelines"
      subtitle="Live deposits awaiting review"
      actions={
        <div className="flex gap-2">
          <select
            className="rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm text-[--color-foreground]"
            value={statusFilter || ''}
            onChange={(event) => setStatusFilter(event.target.value || undefined)}
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <Button variant="ghost" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      }
    >
      {isLoading && <Skeleton className="mb-4 h-48 w-full" />}
      <div className="scroll-area">
        <table className="table-grid min-w-full">
          <thead>
            <tr>
              <th className="text-left">User</th>
              <th className="text-left">Amount</th>
              <th className="text-left">Network</th>
              <th className="text-left">Status</th>
              <th className="text-left">Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {deposits.map((deposit) => (
              <tr key={deposit._id}>
                <td>
                  <div className="text-sm">
                    {typeof deposit.user === 'string'
                      ? deposit.user
                      : deposit.user?.name || deposit.user?.email || deposit.user?._id}
                    <p className="text-xs text-[--color-mutedForeground]">
                      {typeof deposit.user !== 'string' ? deposit.user?.referralCode : ''}
                    </p>
                  </div>
                </td>
                <td>
                  ${deposit.amount.toLocaleString()} {deposit.currency}
                </td>
                <td>{deposit.network}</td>
                <td>
                  <span
                    className="badge"
                    data-tone={deposit.status === 'completed' ? 'success' : 'warning'}
                  >
                    {deposit.status}
                  </span>
                </td>
                <td>{new Date(deposit.updatedAt).toLocaleString()}</td>
                <td className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {statusOptions.map((status) => (
                      <Button
                        key={status}
                        variant="ghost"
                        className="px-3 py-1 text-xs"
                        disabled={deposit.status === status}
                        loading={updating}
                        onClick={() => handleStatusChange(deposit._id, status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {!deposits.length && !isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-sm text-[--color-mutedForeground]"
                >
                  No deposits in this bucket.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};


