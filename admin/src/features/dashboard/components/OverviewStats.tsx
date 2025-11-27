"use client";

import { Activity, ArrowUpRight, Users, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetDashboardStatsQuery } from '@/features/dashboard/api';
import { useGetPendingDepositsCountQuery } from '@/features/deposits/api';

const StatSkeleton = () => (
  <Card>
    <Skeleton className="h-6 w-24" />
    <Skeleton className="mt-4 h-8 w-32" />
  </Card>
);

export const OverviewStats = () => {
  const { data, isLoading } = useGetDashboardStatsQuery();
  const { data: pendingCount } = useGetPendingDepositsCountQuery();

  if (isLoading || !data) {
    return (
      <div className="grid-auto-fit">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total users',
      value: data.stats.users.total.toLocaleString(),
      detail: `${data.stats.users.active.toLocaleString()} active`,
      icon: Users,
      tone: 'primary',
    },
    {
      label: 'Capital invested',
      value: `$${data.stats.investments.totalAmount.toLocaleString()}`,
      detail: `${data.stats.investments.active.toLocaleString()} live portfolios`,
      icon: Wallet,
      tone: 'accent',
    },
    {
      label: 'Cumulative ROI',
      value: `$${data.stats.earnings.total.toLocaleString()}`,
      detail: `${data.stats.transactions.total.toLocaleString()} payouts`,
      icon: Activity,
      tone: 'success',
    },
    {
      label: 'Pending deposits',
      value: pendingCount?.count?.toString() ?? '0',
      detail: 'Requires review',
      icon: ArrowUpRight,
      tone: 'warning',
    },
  ];

  const getToneStyles = (tone: string) => {
    const colorMap: Record<string, string> = {
      primary: 'var(--color-primary)',
      accent: 'var(--color-accent)',
      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
    };
    return colorMap[tone] || colorMap.primary;
  };

  return (
    <div className="grid-auto-fit">
      {cards.map(({ label, value, detail, icon: Icon, tone }) => {
        const toneColor = getToneStyles(tone);
        return (
          <Card key={label} className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            {/* Gradient Background Effect */}
            <div 
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: `linear-gradient(to bottom right, color-mix(in srgb, ${toneColor} 5%, transparent), transparent)`
              }}
            ></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[--color-mutedForeground] font-medium">
                  {label}
                </p>
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{
                    background: `linear-gradient(to bottom right, color-mix(in srgb, ${toneColor} 20%, transparent), color-mix(in srgb, ${toneColor} 5%, transparent))`
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: toneColor }} />
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-[--color-foreground] mb-2 transition-colors duration-300 group-hover:text-[--color-primary]">{value}</p>
              <div className="flex items-center gap-2 text-sm text-[--color-mutedForeground]">
                <span className="status-dot" data-tone={tone} />
                <span className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {detail}
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};


