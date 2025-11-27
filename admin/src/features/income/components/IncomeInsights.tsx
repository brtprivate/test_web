"use client";

import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetDashboardStatsQuery } from '@/features/dashboard/api';
import { useGetDepositsQuery } from '@/features/deposits/api';

export const IncomeInsights = () => {
  const { data, isLoading } = useGetDashboardStatsQuery();
  const { data: deposits, isLoading: depositsLoading } = useGetDepositsQuery({ limit: 10 });

  const timeline = useMemo(() => {
    if (!deposits?.deposits) return [];
    return deposits.deposits.slice(0, 5).map((deposit) => ({
      id: deposit._id,
      label:
        deposit.status === 'completed'
          ? 'ROI payout released'
          : deposit.status === 'pending'
          ? 'Awaiting confirmations'
          : 'Capital movement',
      value: `$${deposit.amount.toLocaleString()}`,
      status: deposit.status,
      date: new Date(deposit.createdAt).toLocaleString(),
    }));
  }, [deposits]);

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Income runway" subtitle="Daily ROI vs reinvestment velocity">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
              ROI distributed
            </p>
            <p className="mt-2 text-3xl font-semibold">
              ${data.stats.earnings.total.toLocaleString()}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-[--color-success]">
              <ArrowUpRight size={16} />
              +14% week over week
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
              Reinvested
            </p>
            <p className="mt-2 text-3xl font-semibold">
              ${Math.round(data.stats.investments.totalAmount * 0.42).toLocaleString()}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-[--color-warning]">
              <ArrowDownRight size={16} />
              -3% vs target
            </p>
          </div>
        </div>
      </Card>
      <Card title="Cashflow timeline" subtitle="Latest yield + payout motions">
        {depositsLoading && <Skeleton className="mb-4 h-32 w-full" />}
        <div className="space-y-4">
          {timeline.map((event) => (
            <div key={event.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{event.label}</p>
                <p className="text-xs text-[--color-mutedForeground]">{event.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{event.value}</p>
                <span className="badge" data-tone={event.status === 'completed' ? 'success' : 'warning'}>
                  {event.status}
                </span>
              </div>
            </div>
          ))}
          {!timeline.length && (
            <p className="text-sm text-[--color-mutedForeground]">
              No payout movements captured yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};




