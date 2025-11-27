"use client";

import { useCallback } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useTriggerDailyRewardsMutation,
  useTriggerDailyRewardsForceMutation,
} from '@/features/management/api';

export const ManualCronTrigger = () => {
  const [triggerRewards, { isLoading }] = useTriggerDailyRewardsMutation();
  const [triggerForceRewards, { isLoading: isForceLoading }] = useTriggerDailyRewardsForceMutation();

  const handleTrigger = useCallback(async () => {
    try {
      const response = await triggerRewards().unwrap();
      const message =
        response.data?.message ||
        `Triggered successfully. Processed ${response.data?.processedInvestments ?? 0} investments.`;
      toast.success(message, {
        description: `Executed in ${(response.data?.durationMs ?? 0) / 1000}s`,
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
      const message =
        response.data?.message ||
        `Force trigger success. Processed ${response.data?.processedInvestments ?? 0} investments.`;
      toast.success(message, {
        description: `Executed in ${(response.data?.durationMs ?? 0) / 1000}s`,
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


