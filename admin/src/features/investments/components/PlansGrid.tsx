"use client";

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetInvestmentPlansQuery } from '@/features/plans/api';

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') {
    return 'Unlimited';
  }

  return value.toLocaleString();
};

export const PlansGrid = () => {
  const { data, isLoading } = useGetInvestmentPlansQuery();

  if (isLoading || !data) {
    return (
      <div className="grid-auto-fit">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="grid-auto-fit">
      {data.map((plan) => (
        <Card
          key={plan._id}
          title={plan.name}
          subtitle={plan.description ?? 'Automated AI yield strategy'}
        >
          <div className="flex items-center justify-between text-3xl font-semibold">
            <span>{plan.dailyROI}%</span>
            <span className="text-sm text-[--color-mutedForeground]">daily ROI</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[--color-mutedForeground]">Min capital</p>
              <p className="font-semibold">${formatCurrency(plan.minAmount)}</p>
            </div>
            <div>
              <p className="text-[--color-mutedForeground]">Max capital</p>
              <p className="font-semibold">${formatCurrency(plan.maxAmount)}</p>
            </div>
            <div>
              <p className="text-[--color-mutedForeground]">Term</p>
              <p className="font-semibold">{plan.durationDays} days</p>
            </div>
            <div>
              <p className="text-[--color-mutedForeground]">Status</p>
              <span className="badge" data-tone={plan.isActive ? 'success' : 'warning'}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};




