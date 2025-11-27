"use client";

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetDepositsQuery } from '@/features/deposits/api';

const headers = ['User', 'Amount', 'Network', 'Status', 'Created'];

export const RecentDeposits = () => {
  const { data, isLoading } = useGetDepositsQuery({ limit: 6 });

  const rows = useMemo(() => {
    if (!data?.deposits) return [];
    return data.deposits.map((deposit) => ({
      id: deposit._id,
      user:
        typeof deposit.user === 'string'
          ? deposit.user
          : deposit.user?.name || deposit.user?.email || deposit.user?._id,
      amount: `$${deposit.amount.toLocaleString()} ${deposit.currency}`,
      network: `${deposit.network}`,
      status: deposit.status,
      created: new Date(deposit.createdAt).toLocaleDateString(),
    }));
  }, [data]);

  return (
    <Card title="Recent capital inflows" subtitle="Latest verified deposits">
      {isLoading && <Skeleton className="mb-4 h-32 w-full" />}
      <div className="scroll-area -mx-6 px-6">
        <table className="table-grid min-w-full">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr 
                key={row.id}
                className="group transition-colors duration-150 hover:bg-white/5"
              >
                <td className="font-medium text-[--color-foreground]">{row.user}</td>
                <td className="font-semibold text-[--color-primary]">{row.amount}</td>
                <td className="text-[--color-mutedForeground]">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs">
                    {row.network}
                  </span>
                </td>
                <td>
                  <span className="badge" data-tone={row.status === 'completed' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'}>
                    {row.status}
                  </span>
                </td>
                <td className="text-sm text-[--color-mutedForeground]">{row.created}</td>
              </tr>
            ))}
            {!rows.length && !isLoading && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="py-8 text-center text-sm text-[--color-mutedForeground]"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p>No deposits recorded yet.</p>
                    <p className="text-xs">New deposits will appear here.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};


