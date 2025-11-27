/**
 * Investment Plans Table Component
 * Displays investment plans in a table format with ROI information
 */

'use client';

import Card from './Card';
import { useInvestmentPlans } from '@/features/investment-plans/hooks/useInvestmentPlans';
import type { InvestmentPlan } from '@/features/investment-plans/api/investmentPlansApi';

const formatAmountRange = (plan: InvestmentPlan) => {
  const { minAmount, maxAmount } = plan;
  if (typeof maxAmount === 'number') {
    return `$${minAmount.toLocaleString()} - $${maxAmount.toLocaleString()}`;
  }
  return `$${minAmount.toLocaleString()} +`;
};

const formatWeeklyWindow = (plan: InvestmentPlan) => {
  if (!plan.visibility) return 'Opens once per week';
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = dayNames[plan.visibility.dayOfWeek] ?? 'Saturday';
  const hour = plan.visibility.startHourUtc ?? 0;
  return `${day} • ${hour.toString().padStart(2, '0')}:00 UTC`;
};

export default function InvestmentPlansTable() {
  const { plans, isLoading } = useInvestmentPlans();

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!plans || plans.length === 0) {
    return null;
  }

  const botPlans = plans
    .filter(plan => plan.planType !== 'weekly')
    .sort((a, b) => a.minAmount - b.minAmount);

  const weeklyPlans = plans.filter(plan => plan.planType === 'weekly');

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden border-0 shadow-sm rounded-3xl">
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-[#FF6B00] text-white text-[10px] font-bold px-8 py-1 transform rotate-45 translate-x-8 translate-y-4 shadow-sm">
            HOT
          </div>
        </div>

        <div className="text-center mb-4 pt-2">
          <h2 className="text-lg sm:text-xl font-bold text-[#4F46E5]">
            Investment Bot Packages
          </h2>
          <p className="text-xs text-gray-500">Daily ROI for 20 days • Auto compounding</p>
        </div>

        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm sm:text-base font-medium text-gray-500">
                  Slab
                </th>
                <th className="text-right py-3 px-4 text-sm sm:text-base font-medium text-gray-500">
                  Daily ROI
                </th>
              </tr>
            </thead>
            <tbody>
              {botPlans.map((plan, index) => (
                <tr
                  key={plan.id || plan._id || index}
                  className={`${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}
                >
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-base sm:text-lg font-semibold text-[#6366F1]">
                        {plan.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatAmountRange(plan)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="text-base sm:text-lg font-bold text-[#84CC16]">
                      {plan.dailyROI?.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500">
                      For {plan.durationDays ?? 20} days
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {weeklyPlans.map(plan => (
        <Card
          key={plan.id || plan._id}
          className="border border-[#2563EB]/20 bg-gradient-to-br from-[#EFF6FF] to-white rounded-3xl p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#2563EB] mb-1">
                Weekly Power Trade
              </p>
              <h3 className="text-xl font-bold text-[#1E3A8A]">{plan.name}</h3>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Payout</p>
              <p className="text-3xl font-black text-[#10B981]">
                {plan.lumpSumROI ?? 0}%
              </p>
              <p className="text-xs text-gray-500">
                in {plan.payoutDelayHours ?? 72} hrs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            <div className="rounded-xl bg-white shadow-sm p-3 border border-white/60">
              <p className="text-gray-500 mb-1">Amount</p>
              <p className="text-base font-semibold text-gray-900">{formatAmountRange(plan)}</p>
            </div>
            <div className="rounded-xl bg-white shadow-sm p-3 border border-white/60">
              <p className="text-gray-500 mb-1">Window</p>
              <p className="text-base font-semibold text-gray-900">
                {plan.visibility?.durationHours ?? 24} hrs
              </p>
            </div>
            <div className="rounded-xl bg-white shadow-sm p-3 border border-white/60 col-span-2 sm:col-span-1">
              <p className="text-gray-500 mb-1">Opens</p>
              <p className="text-base font-semibold text-gray-900">
                {formatWeeklyWindow(plan)}
              </p>
            </div>
            <div className="rounded-xl bg-white shadow-sm p-3 border border-white/60 flex flex-col justify-center items-start sm:items-center">
              <p className="text-gray-500 mb-2">Status</p>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  plan.isVisibleNow ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {plan.isVisibleNow ? 'Live now' : 'Opens weekly'}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

