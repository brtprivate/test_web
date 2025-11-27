"use client";

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useGetDashboardStatsQuery } from '@/features/dashboard/api';
import { Skeleton } from '@/components/ui/Skeleton';

export const RiskAlerts = () => {
  const { data, isLoading } = useGetDashboardStatsQuery();

  if (isLoading || !data) {
    return (
      <Card title="Risk radar" subtitle="Operational watchlist">
        <Skeleton className="h-28 w-full" />
      </Card>
    );
  }

  const alerts = [
    {
      id: 'users',
      label: 'Network saturation',
      description: `${data.stats.users.active.toLocaleString()} / ${data.stats.users.total.toLocaleString()} wallets active`,
      tone: 'neutral',
      icon: ShieldCheck,
    },
    {
      id: 'investments',
      label: 'Capital deployment',
      description: `${data.stats.investments.active.toLocaleString()} live investments`,
      tone: data.stats.investments.active < 10 ? 'warning' : 'neutral',
      icon: data.stats.investments.active < 10 ? AlertTriangle : ShieldCheck,
    },
    {
      id: 'transactions',
      label: 'Payout traffic',
      description: `${data.stats.transactions.total.toLocaleString()} transactions`,
      tone: data.stats.transactions.total > 1000 ? 'warning' : 'neutral',
      icon: data.stats.transactions.total > 1000 ? AlertTriangle : ShieldCheck,
    },
  ];

  return (
    <Card title="Risk radar" subtitle="Automated anomaly highlights">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="group flex items-center gap-3 rounded-xl border border-white/5 bg-gradient-to-r from-transparent to-white/5 p-3.5 transition-all duration-200 hover:border-white/10 hover:shadow-md"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3"
              style={{
                background:
                  alert.tone === 'warning'
                    ? 'color-mix(in srgb, var(--color-warning) 20%, transparent)'
                    : 'color-mix(in srgb, var(--color-success) 20%, transparent)',
                boxShadow:
                  alert.tone === 'warning'
                    ? '0 4px 12px color-mix(in srgb, var(--color-warning) 20%, transparent)'
                    : '0 4px 12px color-mix(in srgb, var(--color-success) 20%, transparent)',
              }}
            >
              <alert.icon
                className="h-5 w-5"
                color={
                  alert.tone === 'warning' ? 'var(--color-warning)' : 'var(--color-success)'
                }
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[--color-foreground]">{alert.label}</p>
              <p className="truncate text-xs text-[--color-mutedForeground]">{alert.description}</p>
            </div>
            {alert.tone === 'warning' && (
              <div className="h-2 w-2 rounded-full bg-[--color-warning] animate-pulse"></div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};


