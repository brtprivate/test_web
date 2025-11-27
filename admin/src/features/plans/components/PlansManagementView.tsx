'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, Clock, Edit2, Plus, RefreshCcw, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useGetInvestmentPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  type CreatePlanDto,
} from '@/features/plans/api';
import type { InvestmentPlan, PlanType } from '@/features/plans/types';

type PlanFormState = CreatePlanDto & { isActive?: boolean };

const dayOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const defaultWeeklyVisibility = {
  dayOfWeek: 6,
  startHourUtc: 0,
  durationHours: 24,
};

const defaultFormState: PlanFormState = {
  name: '',
  description: '',
  minAmount: 0,
  maxAmount: undefined,
  dailyROI: 7,
  compoundingEnabled: false,
  planType: 'bot',
  durationDays: 20,
  payoutType: 'daily',
  payoutDelayHours: 72,
  lumpSumROI: 40,
  visibility: defaultWeeklyVisibility,
  displayOrder: 10,
  isActive: true,
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') {
    return 'Unlimited';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatUtcTime = (hour?: number) => `${String(hour ?? 0).padStart(2, '0')}:00 UTC`;

export const PlansManagementView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormState>(defaultFormState);

  const { data: plans, isLoading, refetch } = useGetInvestmentPlansQuery();
  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();
  const [deletePlan, { isLoading: isDeleting }] = useDeletePlanMutation();

  const isWeeklyPlan = formData.planType === 'weekly';

  const handlePlanTypeChange = (value: PlanType) => {
    setFormData(prev => {
      if (value === 'weekly') {
        return {
          ...prev,
          planType: 'weekly',
          payoutType: 'lump_sum',
          compoundingEnabled: false,
          dailyROI: 0,
          durationDays: prev.durationDays || 3,
          lumpSumROI: prev.lumpSumROI ?? 40,
          visibility: prev.visibility ?? defaultWeeklyVisibility,
        };
      }

      return {
        ...prev,
        planType: 'bot',
        payoutType: 'daily',
        compoundingEnabled: prev.compoundingEnabled ?? false,
        dailyROI: prev.dailyROI && prev.dailyROI > 0 ? prev.dailyROI : 7,
        lumpSumROI: undefined,
        payoutDelayHours: undefined,
      };
    });
  };

  const handleOpenModal = (plan?: InvestmentPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        minAmount: plan.minAmount,
        maxAmount: typeof plan.maxAmount === 'number' ? plan.maxAmount : undefined,
        dailyROI: plan.dailyROI,
        compoundingEnabled: plan.compoundingEnabled ?? false,
        planType: plan.planType,
        durationDays: plan.durationDays,
        payoutType: plan.payoutType,
        payoutDelayHours: plan.payoutDelayHours,
        lumpSumROI: plan.lumpSumROI,
        visibility: plan.visibility ?? defaultWeeklyVisibility,
        displayOrder: plan.displayOrder,
        isActive: plan.isActive,
      });
    } else {
      setEditingPlan(null);
      setFormData(defaultFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreatePlanDto = {
      ...formData,
      maxAmount: typeof formData.maxAmount === 'number' ? formData.maxAmount : undefined,
      visibility: formData.planType === 'weekly' ? formData.visibility : undefined,
      dailyROI: formData.planType === 'weekly' ? 0 : formData.dailyROI,
      payoutDelayHours: formData.planType === 'weekly' ? formData.payoutDelayHours : undefined,
      lumpSumROI: formData.planType === 'weekly' ? formData.lumpSumROI : undefined,
      compoundingEnabled: formData.planType === 'weekly' ? false : formData.compoundingEnabled,
      isActive: formData.isActive,
    };

    try {
      if (editingPlan) {
        await updatePlan({ id: editingPlan._id, body: payload }).unwrap();
        toast.success('Plan updated successfully');
      } else {
        await createPlan(payload).unwrap();
        toast.success('Plan created successfully');
      }
      handleCloseModal();
      refetch();
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Failed to save plan';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }
    try {
      await deletePlan(id).unwrap();
      toast.success('Plan deleted successfully');
      refetch();
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Failed to delete plan';
      toast.error(message);
    }
  };

  const sortedPlans = useMemo(
    () => (plans ?? []).slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [plans]
  );

  const computedRoiPreview = isWeeklyPlan
    ? `${formData.lumpSumROI ?? 0}% in ${formData.payoutDelayHours ?? 0} hrs`
    : `${formData.dailyROI ?? 0}% • ${formData.durationDays ?? 0} days`;

  return (
    <div className="space-y-6">
      <Card
        title="Investment plans management"
        subtitle="Create, update, and manage investment plans for your platform."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              icon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => refetch()}
              className="px-3 py-2 text-xs uppercase"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => handleOpenModal()}
              className="px-3 py-2 text-xs uppercase"
            >
              New Plan
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <div className="grid-auto-fit">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="grid-auto-fit">
            {sortedPlans.map(plan => {
              const weekly = plan.planType === 'weekly';
              const visibility = plan.visibility;
              const roiLabel = weekly
                ? `${plan.lumpSumROI ?? 0}% in ${plan.payoutDelayHours ?? 0} hrs`
                : `${plan.dailyROI ?? 0}% daily • ${plan.durationDays} days`;
              const dayLabel =
                visibility && typeof visibility.dayOfWeek === 'number'
                  ? dayOptions.find(d => d.value === visibility.dayOfWeek)?.label || 'Saturday'
                  : 'Saturday';

              return (
                <div
                  key={plan._id}
                  className="card-surface flex flex-col gap-4 rounded-2xl border border-white/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[--color-foreground]">{plan.name}</h3>
                      {plan.description && (
                        <p className="mt-1 text-sm text-[--color-mutedForeground]">{plan.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className="badge" data-tone={weekly ? 'primary' : 'info'}>
                        {weekly ? 'Weekly' : 'Bot'}
                      </span>
                      <span className="badge" data-tone={plan.isActive ? 'success' : 'warning'}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                      ROI Summary
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[--color-foreground]">{roiLabel}</p>
                    {!weekly && (
                      <p className="mt-2 text-xs font-semibold text-[--color-mutedForeground]">
                        Compounding: <span className="text-[--color-foreground]">{plan.compoundingEnabled ? 'Enabled' : 'Disabled'}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[--color-mutedForeground]">Min capital</p>
                      <p className="font-semibold">{formatCurrency(plan.minAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[--color-mutedForeground]">Max capital</p>
                      <p className="font-semibold">{formatCurrency(plan.maxAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[--color-mutedForeground]">Duration</p>
                      <p className="font-semibold">{plan.durationDays} days</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {weekly ? <CalendarDays className="h-4 w-4 text-[--color-mutedForeground]" /> : null}
                      <div>
                        <p className="text-[--color-mutedForeground]">
                          {weekly ? 'Opens' : 'Display order'}
                        </p>
                        <p className="font-semibold">
                          {weekly
                            ? `${dayLabel} • ${formatUtcTime(visibility?.startHourUtc)}`
                            : `#${plan.displayOrder ?? 0}`}
                        </p>
                      </div>
                    </div>
                    {weekly && (
                      <div className="col-span-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold">
                        <div className="flex items-center gap-1 text-[--color-mutedForeground]">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Window {visibility?.durationHours ?? 24} hrs</span>
                        </div>
                        <span className="badge" data-tone={plan.isVisibleNow ? 'success' : 'warning'}>
                          {plan.isVisibleNow
                            ? 'Open now'
                            : plan.nextVisibleAt
                            ? `Next: ${new Date(plan.nextVisibleAt).toUTCString()}`
                            : 'Hidden'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Button
                      variant="ghost"
                      icon={<Edit2 className="h-3.5 w-3.5" />}
                      onClick={() => handleOpenModal(plan)}
                      className="flex-1 px-3 py-2 text-xs uppercase"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => handleDelete(plan._id)}
                      loading={isDeleting}
                      className="px-3 py-2 text-xs uppercase text-[--color-danger] hover:text-[--color-danger]"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}

            {!sortedPlans.length && (
              <div className="col-span-full py-12 text-center">
                <p className="text-sm text-[--color-mutedForeground]">No investment plans found.</p>
                <Button
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => handleOpenModal()}
                  className="mt-4"
                >
                  Create First Plan
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-surface relative w-full max-w-2xl rounded-2xl border border-white/10 p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[--color-foreground]">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5 text-[--color-mutedForeground]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Plan Name"
                placeholder="e.g., Bot Slab One"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Description"
                placeholder="Plan description (optional)"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Amount ($)"
                  type="number"
                  min="0"
                  value={formData.minAmount ?? ''}
                  onChange={e =>
                    setFormData({ ...formData, minAmount: Number(e.target.value) || 0 })
                  }
                  required
                />
                <Input
                  label="Max Amount ($)"
                  type="number"
                  min="0"
                  value={formData.maxAmount ?? ''}
                  onChange={e => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      maxAmount: value === '' ? undefined : Number(value) || 0,
                    });
                  }}
                  placeholder="Leave blank for unlimited"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground] mb-2 block">
                    Plan Type
                  </label>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <select
                      className="w-full bg-transparent text-sm font-semibold text-[--color-foreground] outline-none"
                      value={formData.planType}
                      onChange={e => handlePlanTypeChange(e.target.value as PlanType)}
                    >
                      <option value="bot">Bot Investment</option>
                      <option value="weekly">Weekly Power Trade</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground] mb-2 block">
                    Status
                  </label>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <select
                      className="w-full bg-transparent text-sm font-semibold text-[--color-foreground] outline-none"
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={e =>
                        setFormData({ ...formData, isActive: e.target.value === 'active' })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {!isWeeklyPlan && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground] mb-2 block">
                    Compounding
                  </label>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <select
                      className="w-full bg-transparent text-sm font-semibold text-[--color-foreground] outline-none"
                      value={formData.compoundingEnabled ? 'true' : 'false'}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          compoundingEnabled: e.target.value === 'true',
                        }))
                      }
                    >
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {!isWeeklyPlan && (
                  <>
                    <Input
                      label="Daily ROI (%)"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.dailyROI ?? ''}
                      onChange={e =>
                        setFormData({ ...formData, dailyROI: Number(e.target.value) || 0 })
                      }
                      required
                    />
                    <Input
                      label="Duration (Days)"
                      type="number"
                      min="1"
                      value={formData.durationDays ?? ''}
                      onChange={e =>
                        setFormData({ ...formData, durationDays: Number(e.target.value) || 1 })
                      }
                      required
                    />
                  </>
                )}
                {isWeeklyPlan && (
                  <>
                    <Input
                      label="Payout (%)"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.lumpSumROI ?? ''}
                      onChange={e =>
                        setFormData({ ...formData, lumpSumROI: Number(e.target.value) || 0 })
                      }
                      required
                    />
                    <Input
                      label="Release After (hours)"
                      type="number"
                      min="1"
                      value={formData.payoutDelayHours ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          payoutDelayHours: Number(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </>
                )}
              </div>

              <Input
                label="Display Order"
                type="number"
                min="0"
                value={formData.displayOrder ?? ''}
                onChange={e =>
                  setFormData({ ...formData, displayOrder: Number(e.target.value) || 0 })
                }
              />

              {isWeeklyPlan && (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]">
                    Weekly visibility
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] uppercase text-[--color-mutedForeground] block mb-1">
                        Day
                      </label>
                      <select
                        className="w-full rounded-xl border border-white/10 bg-white/10 px-2 py-1.5 text-sm font-semibold text-[--color-foreground] outline-none"
                        value={formData.visibility?.dayOfWeek ?? defaultWeeklyVisibility.dayOfWeek}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            visibility: {
                              ...(formData.visibility ?? defaultWeeklyVisibility),
                              dayOfWeek: Number(e.target.value),
                            },
                          })
                        }
                      >
                        {dayOptions.map(day => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Start hour (UTC)"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.visibility?.startHourUtc ?? 0}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          visibility: {
                            ...(formData.visibility ?? defaultWeeklyVisibility),
                            startHourUtc: Number(e.target.value) || 0,
                          },
                        })
                      }
                    />
                    <Input
                      label="Window (hrs)"
                      type="number"
                      min="1"
                      max="168"
                      value={formData.visibility?.durationHours ?? 24}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          visibility: {
                            ...(formData.visibility ?? defaultWeeklyVisibility),
                            durationHours: Number(e.target.value) || 24,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-[--color-mutedForeground]">Preview</p>
                <p className="text-2xl font-semibold text-[--color-foreground]">
                  {computedRoiPreview}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={handleCloseModal} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isCreating || isUpdating}
                  className="flex-1"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

