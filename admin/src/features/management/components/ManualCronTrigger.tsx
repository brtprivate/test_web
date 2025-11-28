"use client";

import { useCallback } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useTriggerDailyRewardsMutation,
  useTriggerDailyRewardsForceMutation,
} from '@/features/management/api';

type TriggerMetrics = {
  processedInvestments?: number;
  durationMs?: number;
  referralSummary?: string | null;
};

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return currencyFormatter.format(value);
};

const parseReferralBucket = (raw: unknown): string | null => {
  if (raw == null) {
    return null;
  }

  if (typeof raw === 'number') {
    return formatCurrency(raw);
  }

  if (typeof raw === 'string') {
    const numeric = Number(raw);
    if (!Number.isNaN(numeric)) {
      return formatCurrency(numeric);
    }
    try {
      const parsed = JSON.parse(raw);
      return parseReferralBucket(parsed);
    } catch {
      return raw;
    }
  }

  if (typeof raw === 'object') {
    const bucket = raw as Record<string, unknown>;
    const total =
      typeof bucket.total === 'number'
        ? bucket.total
        : typeof bucket.amount === 'number'
          ? bucket.amount
          : typeof bucket.referral === 'number'
            ? bucket.referral
            : undefined;
    const direct = typeof bucket.direct === 'number' ? bucket.direct : undefined;
    const team = typeof bucket.team === 'number' ? bucket.team : undefined;

    const parts: string[] = [];
    if (total !== undefined) {
      parts.push(`Total ${formatCurrency(total)}`);
    }
    if (direct !== undefined) {
      parts.push(`Direct ${formatCurrency(direct)}`);
    }
    if (team !== undefined) {
      parts.push(`Team ${formatCurrency(team)}`);
    }

    return parts.length ? parts.join(' • ') : null;
  }

  return null;
};

const getBuckets = (payload: any): any[] => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const list: any[] = [
    payload,
    payload.summary,
    payload.metrics,
    payload.stats,
    payload.summary?.stats,
    payload.processed,
  ];

  return list.filter(Boolean);
};

const extractNumber = (buckets: any[], resolvers: Array<(bucket: any) => unknown>) => {
  for (const bucket of buckets) {
    for (const resolver of resolvers) {
      const value = resolver(bucket);
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
      }
    }
  }
  return undefined;
};

const extractReferral = (buckets: any[]) => {
  for (const bucket of buckets) {
    if (bucket == null) continue;
    if (bucket.referralAmount !== undefined) return bucket.referralAmount;
    if (bucket.referralPayout !== undefined) return bucket.referralPayout;
    if (bucket.referral !== undefined) return bucket.referral;
    if (bucket.metrics && bucket.metrics.referralAmount !== undefined) {
      return bucket.metrics.referralAmount;
    }
  }
  return undefined;
};

const deriveTriggerMetrics = (payload: any): TriggerMetrics => {
  const buckets = getBuckets(payload);

  const processedInvestments = extractNumber(buckets, [
    bucket => bucket.processedInvestments,
    bucket => bucket.investments,
    bucket => bucket.processed?.investments,
    bucket => bucket.count,
    bucket => bucket.counts?.investments,
  ]);

  const durationMs =
    extractNumber(buckets, [
      bucket => bucket.durationMs,
      bucket => bucket.metrics?.durationMs,
      bucket => bucket.summary?.durationMs,
    ]) ?? payload?.durationMs;

  const referralSummary = parseReferralBucket(extractReferral(buckets));

  return {
    processedInvestments,
    durationMs,
    referralSummary,
  };
};

const formatToastDescription = (metrics: TriggerMetrics) => {
  const parts: string[] = [];
  if (typeof metrics.processedInvestments === 'number') {
    parts.push(`${metrics.processedInvestments} investments`);
  }
  if (metrics.referralSummary) {
    parts.push(`Referral payout: ${metrics.referralSummary}`);
  }
  if (typeof metrics.durationMs === 'number') {
    parts.push(`${(metrics.durationMs / 1000).toFixed(2)}s`);
  }

  return parts.join(' • ') || undefined;
};

export const ManualCronTrigger = () => {
  const [triggerRewards, { isLoading }] = useTriggerDailyRewardsMutation();
  const [triggerForceRewards, { isLoading: isForceLoading }] = useTriggerDailyRewardsForceMutation();

  const handleTrigger = useCallback(async () => {
    try {
      const response = await triggerRewards().unwrap();
      const metrics = deriveTriggerMetrics(response.data);
      const message =
        response.data?.message ||
        `Triggered successfully. Processed ${response.data?.processedInvestments ?? 0} investments.`;
      toast.success(message, {
        description: formatToastDescription(metrics),
      });
    } catch (error) {
      const fallback = 'Failed to trigger Daily ROI + Team Level ROI.';
      if (typeof error === 'object' && error && 'data' in error) {
        const err = error as { data?: { message?: string }; message?: string };
        toast.error(err.data?.message || err.message || fallback);
      } else {
        toast.error(fallback);
      }
    }
  }, [triggerRewards]);

  const handleForceTrigger = useCallback(async () => {
    try {
      const response = await triggerForceRewards().unwrap();
      const metrics = deriveTriggerMetrics(response.data);
      const message =
        response.data?.message ||
        `Force trigger success. Processed ${response.data?.processedInvestments ?? 0} investments.`;
      toast.success(message, {
        description: formatToastDescription(metrics),
      });
    } catch (error) {
      const fallback = 'Failed to force trigger Daily ROI + Team Level ROI.';
      if (typeof error === 'object' && error && 'data' in error) {
        const err = error as { data?: { message?: string }; message?: string };
        toast.error(err.data?.message || err.message || fallback);
      } else {
        toast.error(fallback);
      }
    }
  }, [triggerForceRewards]);

  return (
    <Card title="Manual ROI triggers" subtitle="Run Daily ROI + multi-level ROI instantly.">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[--color-foreground]">Scheduled-safe trigger</p>
              <p className="text-xs text-[--color-mutedForeground]">
                Respects the 24h cooldown (skips investments that already received ROI today).
              </p>
            </div>
            <Button variant="primary" loading={isLoading} onClick={handleTrigger}>
              {isLoading ? 'Running…' : 'Run Daily & Level ROI'}
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 p-4 bg-red-500/5 border-red-500/30">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-red-300">Force trigger (testing only)</p>
              <p className="text-xs text-red-200">
                Ignores last payout date. Every active investment earns again. Use carefully in prod.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-red-500/60 text-red-100 hover:bg-red-500/10"
              loading={isForceLoading}
              onClick={handleForceTrigger}
            >
              {isForceLoading ? 'Forcing…' : 'Force Run ROI'}
            </Button>
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[--color-mutedForeground]">
          Both actions distribute Daily ROI and multi-level (1%) income.
        </p>
      </div>
    </Card>
  );
};


