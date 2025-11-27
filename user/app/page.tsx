/**
 * Home Page
 * Main landing page with mobile-first design
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConnectionError from '@/components/ui/ConnectionError';
import BuyTPModal from '@/components/ui/BuyTPModal';
import InvestmentPlansTable from '@/components/ui/InvestmentPlansTable';
import StatCard from '@/components/ui/StatCard';
import TradingStatus from '@/components/ui/TradingStatus';
import { useUser } from '@/features/users/hooks/useUser';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useIncome } from '@/features/income/hooks/useIncome';
import { useInvestments } from '@/features/investments/hooks/useInvestments';
import { useInvestmentPlans, useWeeklyPlanStatus } from '@/features/investment-plans/hooks/useInvestmentPlans';
import { useCreateInvestmentMutation } from '@/features/investments/api/investmentsApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useAlerts } from '@/hooks/useAlerts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AlertStack from '@/components/ui/AlertStack';
import type { InvestmentPlan as InvestmentPlanType } from '@/features/investment-plans/api/investmentPlansApi';

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

const formatSecondsAsClock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${secs
    .toString()
    .padStart(2, '0')}s`;
};

export default function Home() {
  const { user, isLoading: isUserLoading, error: userError } = useUser();
  const { balance, isLoading: isBalanceLoading, error: balanceError } = useWallet();
  const { summary } = useIncome();
  const { investments, isLoading: isInvestmentsLoading } = useInvestments();
  const { plans } = useInvestmentPlans();
  const { weeklyPlanStatus, isLoading: isWeeklyStatusLoading } = useWeeklyPlanStatus();
  const [isBuyTPModalOpen, setIsBuyTPModalOpen] = useState(false);
  const [settlementTime, setSettlementTime] = useState({ hours: 16, minutes: 48, seconds: 38 });
  const [weeklyCountdown, setWeeklyCountdown] = useState('');
  const [createInvestment, { isLoading: isCreating }] = useCreateInvestmentMutation();
  const storedToken = useAppSelector((state) => state.auth.token);
  const hasMounted = useHasMounted();
  const { logout } = useAuth();
  const tokenPreview = useMemo(() => {
    if (!storedToken) return 'No token stored';
    if (storedToken.length <= 16) return storedToken;
    return `${storedToken.substring(0, 8)}...${storedToken.substring(storedToken.length - 8)}`;
  }, [storedToken]);
  const { alerts, addAlert, removeAlert } = useAlerts();

  // Calculate Trade Power from investments (sum of all active investment amounts)
  const tradePower = useMemo(() => {
    try {
      if (!investments || investments.length === 0) return 0;
      return investments
        .filter((inv: any) => inv?.status === 'active')
        .reduce((sum: number, inv: any) => sum + (parseFloat(inv?.amount) || 0), 0);
    } catch (error) {
      return 0; // Default fallback
    }
  }, [investments]);

  // Get daily earn percent from user's highest investment plan
  const dailyEarnPercent = useMemo(() => {
    try {
      if (!investments || investments.length === 0) {
        // Default to first plan's ROI or 5.5%
        return plans && plans.length > 0 ? (plans[0]?.dailyROI || 5.5) : 5.5;
      }
      // Get the highest ROI from active investments
      const activeInvestments = investments.filter((inv: any) => inv?.status === 'active');
      if (activeInvestments.length === 0) return 5.5;

      // Get ROI from plan if available
      const rois = activeInvestments
        .map((inv: any) => {
          if (inv?.plan && typeof inv.plan === 'object') {
            return inv.plan.dailyROI ?? inv.plan.roiPercentage;
          }
          return inv?.dailyROI ?? (inv as any)?.roiPercentage ?? 5.5;
        })
        .filter((roi: any) => roi != null && !isNaN(roi));

      return rois.length > 0 ? Math.max(...rois) : 5.5;
    } catch (error) {
      return 5.5; // Default fallback
    }
  }, [investments, plans]);

  const weeklyPlan = useMemo(
    () => (weeklyPlanStatus?.plan as InvestmentPlanType | undefined) ?? plans?.find(plan => plan.planType === 'weekly'),
    [weeklyPlanStatus?.plan, plans]
  );
  const weeklyStatus = weeklyPlanStatus?.status;

  const formatAmountRange = (plan?: InvestmentPlanType) => {
    if (!plan) return '$50 - $100';
    if (typeof plan.maxAmount === 'number') {
      return `$${plan.minAmount.toLocaleString()} - $${plan.maxAmount.toLocaleString()}`;
    }
    return `$${plan.minAmount.toLocaleString()} +`;
  };

  const weeklyWindowInfo = useMemo(() => {
    if (!weeklyPlan?.visibility) return null;
    const { dayOfWeek, startHourUtc = 0, durationHours = 24 } = weeklyPlan.visibility;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      dayLabel: dayNames[dayOfWeek] ?? 'Saturday',
      startLabel: `${startHourUtc.toString().padStart(2, '0')}:00 UTC`,
      durationHours,
    };
  }, [weeklyPlan]);

  const weeklyWindowLabel = useMemo(() => {
    if (!weeklyWindowInfo) return 'Opens once per week';
    return `${weeklyWindowInfo.dayLabel} ${weeklyWindowInfo.startLabel} • ${weeklyWindowInfo.durationHours} hrs`;
  }, [weeklyWindowInfo]);

  const weeklyStatusLabel = useMemo(() => {
    if (!weeklyStatus) return 'Weekly power trade window coming soon';
    if (weeklyStatus.canInvestNow) {
      return weeklyStatus.currentWindowEnd
        ? `Closes ${formatDateTime(weeklyStatus.currentWindowEnd)}`
        : 'Live window active now';
    }
    if (weeklyStatus.isReminderWindow && weeklyStatus.nextWindowStart) {
      return `Reminder: Opens ${formatDateTime(weeklyStatus.nextWindowStart)}`;
    }
    if (weeklyStatus.nextWindowStart) {
      return `Next window: ${formatDateTime(weeklyStatus.nextWindowStart)}`;
    }
    return 'Opens once per week';
  }, [weeklyStatus]);

  const weeklyRoiLabel = useMemo(() => {
    if (!weeklyPlan) return '40% in 72 hrs';
    const percent = weeklyPlan.lumpSumROI ?? 40;
    const hours = weeklyPlan.payoutDelayHours ?? 72;
    return `${percent}% in ${hours} hrs`;
  }, [weeklyPlan]);

  const countdownSecondsTarget = weeklyStatus
    ? weeklyStatus.canInvestNow
      ? weeklyStatus.secondsUntilClose ?? null
      : weeklyStatus.secondsUntilOpen ?? null
    : null;

  useEffect(() => {
    if (countdownSecondsTarget == null) {
      setWeeklyCountdown('');
      return;
    }

    let remaining = countdownSecondsTarget;
    setWeeklyCountdown(formatSecondsAsClock(remaining));

    const timer = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      setWeeklyCountdown(formatSecondsAsClock(remaining));
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownSecondsTarget, weeklyStatus?.canInvestNow]);

  const canJoinWeekly = weeklyStatus?.canInvestNow ?? weeklyPlan?.isVisibleNow ?? false;
  const weeklyBadgeText = weeklyStatus?.canInvestNow
    ? 'OPEN NOW'
    : weeklyStatus?.isReminderWindow
    ? 'REMINDER'
    : 'UPCOMING';
  const weeklyCountdownPrefix = weeklyStatus?.canInvestNow ? 'Time remaining:' : 'Opens in:';
  const reminderStartsLabel = weeklyStatus?.reminderStartsAt ? formatDateTime(weeklyStatus.reminderStartsAt) : '';
  const nextWindowStartLabel = weeklyStatus?.nextWindowStart ? formatDateTime(weeklyStatus.nextWindowStart) : '';

  // Check for connection errors
  const hasConnectionError =
    (userError && 'status' in userError && (userError.status === 'FETCH_ERROR' || userError.status === 'PARSING_ERROR')) ||
    (balanceError && 'status' in balanceError && (balanceError.status === 'FETCH_ERROR' || balanceError.status === 'PARSING_ERROR'));

  // Settlement timer
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // Next midnight
      const diff = midnight.getTime() - now.getTime();

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setSettlementTime({ hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleBuyTP = async (
    amount: number,
    planId: string,
    options?: { source?: 'wallet' | 'deposit' }
  ) => {
    if (options?.source === 'deposit') {
      addAlert({ type: 'success', message: 'Payment detected and investment started successfully.' });
      setIsBuyTPModalOpen(false);
      window.location.reload();
      return;
    }

    try {
      const result = await createInvestment({
        planId: planId,
        amount: amount,
      }).unwrap();

      if (result.status === 'success') {
        console.log('✅ Investment created successfully:', result);
        addAlert({ type: 'success', message: 'Investment created successfully!' });
        setIsBuyTPModalOpen(false);
        // Refresh data
        window.location.reload();
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to create investment. Please try again.';
      console.error('❌ Investment creation failed:', error);
      addAlert({ type: 'error', message: errorMessage });
    }
  };

  const dailyEarn = summary?.todayIncome || summary?.dailyROI || 0;
  const totalBalance = balance?.total ?? 0;
  const investmentWalletBalance = balance?.investmentWallet ?? 0;
  const earningWalletBalance = balance?.earningWallet ?? 0;



  return (
    <MobileLayout showBottomNav={true}>
      <AlertStack alerts={alerts} onClose={removeAlert} />
      <div className="space-y-4 sm:space-y-5">
        {/* Redux Token + Reload */}
        {/* New Header Section - Moved to MobileLayout header prop */}

        {/* Connection Error Alert */}
        {hasConnectionError && (
          <ConnectionError onRetry={() => window.location.reload()} />
        )}

        {/* Show Login Prompt if not authenticated */}
        {!user && !isUserLoading && (
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <div className="text-center">
              <p className="text-sm sm:text-base text-blue-900 mb-3 font-medium">
                Please login to access all features
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => (window.location.href = '/login')}
              >
                Go to Login 1
              </Button>
            </div>
          </Card>
        )}

        {/* Weekly Power Trade Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#0F172A] to-[#0B1324] shadow-lg border border-white/10 text-white">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 right-0 w-44 h-44 bg-pink-500/30 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/30 blur-3xl rounded-full"></div>
          </div>

          <div className="relative p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs tracking-[0.4em] uppercase text-pink-200">Weekly Power Trade</p>
                <h2 className="text-2xl font-bold">Earn {weeklyRoiLabel}</h2>
                <p className="text-sm text-white/80 mt-1">
                  Invest {formatAmountRange(weeklyPlan)} • {weeklyWindowLabel}
                </p>
                {isWeeklyStatusLoading && (
                  <p className="text-[10px] text-white/60">Updating schedule...</p>
                )}
                {weeklyCountdown && (
                  <p className="text-xs text-white/70">
                    {weeklyCountdownPrefix} {weeklyCountdown}
                  </p>
                )}
                {!canJoinWeekly && reminderStartsLabel && (
                  <p className="text-[10px] text-white/60">
                    Reminder day starts {reminderStartsLabel}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-white/30 text-white">
                  {weeklyBadgeText}
                </span>
                <p className="text-sm text-white/80 mt-2 max-w-[200px]">{weeklyStatusLabel}</p>
                {!canJoinWeekly && nextWindowStartLabel && (
                  <p className="text-[11px] text-white/60 mt-1">Next slot: {nextWindowStartLabel}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {formatAmountRange(weeklyPlan)}
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                {weeklyPlan?.payoutDelayHours ?? 72} hrs release
              </div>
              {weeklyStatus?.isReminderWindow && (
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-white">
                  <span className="w-2 h-2 rounded-full bg-yellow-300"></span>
                  Reminder day active
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => setIsBuyTPModalOpen(true)}
              disabled={!canJoinWeekly}
            >
              Join Weekly Power Trade
            </Button>
          </div>
        </div>

        {/* TP (Trade Power) Section - Centered Design */}
        <div className="flex flex-col items-center justify-center py-4">
          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold text-gray-900">TP (Trade Power)</h2>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* TP Value with Cube Icon */}
          <div className="flex items-center gap-3 mb-2">
            {/* Cube Icon */}
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#111" />
                <path d="M2 17L12 22L22 17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 7V17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 7V17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12V22" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Green accents for "tech" look */}
                <circle cx="12" cy="2" r="1" fill="#4ADE80" />
                <circle cx="2" cy="7" r="1" fill="#4ADE80" />
                <circle cx="22" cy="7" r="1" fill="#4ADE80" />
                <circle cx="12" cy="12" r="1" fill="#4ADE80" />
                <circle cx="2" cy="17" r="1" fill="#4ADE80" />
                <circle cx="22" cy="17" r="1" fill="#4ADE80" />
                <circle cx="12" cy="22" r="1" fill="#4ADE80" />
              </svg>
            </div>
            <span className="text-4xl font-bold text-black">
              {isInvestmentsLoading ? '...' : tradePower.toFixed(1)}
            </span>
          </div>

          {/* Daily Earn Line */}
          <div className="flex items-center gap-2 mb-4 text-sm sm:text-base">
            <span className="text-gray-600">Daily Earn :</span>
            <span className="font-bold text-gray-900">${dailyEarn.toFixed(3)}</span>
            <span className="text-[#65A30D] font-bold">(+{(dailyEarnPercent || 5.5).toFixed(1)}%)</span>
            <a href="/income" className="flex items-center gap-1 text-gray-400 hover:text-gray-600 ml-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              History
            </a>
          </div>

          {/* Settlement Timer Pill */}
          <div className="bg-[#E9D5FF] text-[#6B21A8] px-6 py-2 rounded-full font-medium flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Settlement time: {settlementTime.hours}h {settlementTime.minutes}m {settlementTime.seconds}s
            </span>
          </div>
        </div>

        {/* Action Buttons - New Design */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* Buy TP Button */}
          <button
            onClick={() => setIsBuyTPModalOpen(true)}
            className="bg-[#84CC16] hover:bg-[#65A30D] text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-md transition-all active:scale-95"
          >
            <div className="w-8 h-8 relative">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 7V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 7V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="2" r="1" fill="#FFF" />
                <circle cx="2" cy="7" r="1" fill="#FFF" />
                <circle cx="22" cy="7" r="1" fill="#FFF" />
                <circle cx="12" cy="12" r="1" fill="#FFF" />
                <circle cx="2" cy="17" r="1" fill="#FFF" />
                <circle cx="22" cy="17" r="1" fill="#FFF" />
                <circle cx="12" cy="22" r="1" fill="#FFF" />
              </svg>
            </div>
            <span className="text-xl font-bold">Buy TP</span>
          </button>

          {/* Refer & Earn Button */}
          <button
            onClick={() => (window.location.href = '/friends')}
            className="bg-[#E9D5FF] hover:bg-[#D8B4FE] text-gray-900 rounded-2xl p-4 flex items-center justify-center gap-3 shadow-md transition-all active:scale-95"
          >
            <div className="w-10 h-10 bg-[#F43F5E] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm border-2 border-white">
              <div className="flex flex-col items-center leading-none">
                <span>$15+</span>
                <span className="text-[8px]">Refer</span>
              </div>
            </div>
            <span className="text-lg font-medium text-gray-800">Refer&Earn</span>
          </button>
        </div>

        {/* Investment Plans Table - Show After Buttons */}
        <InvestmentPlansTable />



        {/* Trading Status Section with Tabs */}
        <TradingStatus
          investments={investments}
          isLoading={isInvestmentsLoading}
        />

        {/* Buy TP Modal */}
        <BuyTPModal
          isOpen={isBuyTPModalOpen}
          onClose={() => {
            setIsBuyTPModalOpen(false);
          }}
          onConfirm={(amount, planId, options) => handleBuyTP(amount, planId, options)}
          isInvesting={isCreating}
        />
      </div>
    </MobileLayout>
  );
}
