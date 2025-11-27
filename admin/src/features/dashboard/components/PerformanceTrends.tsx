"use client";

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  type TooltipProps,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetDashboardStatsQuery } from '@/features/dashboard/api';

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/20 bg-black/90 backdrop-blur-sm px-4 py-3 shadow-xl">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="h-3 w-3 rounded-full" 
            style={{ backgroundColor: entry.color || 'var(--color-primary)' }}
          />
          <div>
            <p className="text-xs text-[--color-mutedForeground] uppercase tracking-wide">
              {entry.dataKey === 'capital' ? 'Capital' : 'ROI'}
            </p>
            <p className="text-sm font-semibold text-[--color-foreground]">
              ${entry.value?.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
      {payload[0]?.payload?.label && (
        <p className="mt-2 border-t border-white/10 pt-2 text-xs text-[--color-mutedForeground]">
          {payload[0].payload.label}
        </p>
      )}
    </div>
  );
};

export const PerformanceTrends = () => {
  const { data, isLoading } = useGetDashboardStatsQuery();

  const chartData = useMemo(() => {
    if (!data) return [];
    const amount = data.stats.investments.totalAmount;
    return Array.from({ length: 7 }).map((_, index) => {
      const dayOffset = 6 - index;
      const base = amount / (10 - index);
      const variation = Math.abs(Math.sin((index + 1) * 1.3));
      return {
        label: `${dayOffset}d ago`,
        capital: Math.round(base + variation * (amount * 0.05)),
        roi: Math.round(data.stats.earnings.total / (index + 2)),
      };
    });
  }, [data]);

  if (isLoading || !data) {
    return (
      <Card title="Network performance" subtitle="Capital inflows vs ROI yield">
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  return (
    <Card title="Network performance" subtitle="Capital inflows vs ROI yield" className="group">
      <div className="h-72 w-full -mx-6 px-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="capital" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.9} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="roi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.9} />
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="rgba(255,255,255,0.4)" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.4)" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} 
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="capital"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#capital)"
              dot={{ fill: 'var(--color-primary)', r: 4 }}
              activeDot={{ r: 6, fill: 'var(--color-primary)' }}
            />
            <Area
              type="monotone"
              dataKey="roi"
              stroke="var(--color-accent)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#roi)"
              dot={{ fill: 'var(--color-accent)', r: 4 }}
              activeDot={{ r: 6, fill: 'var(--color-accent)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};


