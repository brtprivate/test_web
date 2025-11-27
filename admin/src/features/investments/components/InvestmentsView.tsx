"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCcw,
  Search,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetAllInvestmentsQuery } from '@/features/investments/api';
import type { Investment } from '@/features/investments/types';

type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled';
type BonusFilter = 'all' | 'bonus' | 'no-bonus';
type SortField = 'createdAt' | 'amount' | 'startDate' | 'status';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_TOTALS = {
  active: 0,
  completed: 0,
  cancelled: 0,
  totalAmount: 0,
  totalEarnings: 0,
};

export const InvestmentsView = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [bonusFilter, setBonusFilter] = useState<BonusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [page, setPage] = useState(1);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const debouncedSearch = useDebouncedValue(search, 350);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      bonus: bonusFilter !== 'all' ? bonusFilter : undefined,
      sortField,
      sortDirection,
      limit: pageSize,
      page,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
    }),
    [debouncedSearch, statusFilter, bonusFilter, sortField, sortDirection, pageSize, page, minAmount, maxAmount]
  );

  const { data, isLoading, isFetching, refetch } = useGetAllInvestmentsQuery(queryParams);

  const investments = useMemo(() => data?.data?.investments ?? [], [data]);
  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = isFetching ? page : page;
  const pageRangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageRangeEnd = totalRecords === 0 ? 0 : Math.min(currentPage * pageSize, totalRecords);

  // Get totals from API response meta, fallback to calculating from investments
  const apiTotals = data?.meta?.totals;
  const totals = useMemo(() => {
    if (apiTotals) {
      return {
        active: apiTotals.active || 0,
        completed: apiTotals.completed || 0,
        cancelled: apiTotals.cancelled || 0,
        totalAmount: apiTotals.totalAmount || 0,
        totalEarnings: apiTotals.totalEarnings || 0,
        totalEarningWallet: apiTotals.totalEarningWallet || 0,
        totalEarned: apiTotals.totalEarned || 0,
      };
    }
    // Fallback: calculate from current page investments
    const stats = {
      active: 0,
      completed: 0,
      cancelled: 0,
      totalAmount: 0,
      totalEarnings: 0,
      totalEarningWallet: 0,
      totalEarned: 0,
    };
    investments.forEach((inv) => {
      if (inv.status === 'active') stats.active++;
      if (inv.status === 'completed') stats.completed++;
      if (inv.status === 'cancelled') stats.cancelled++;
      stats.totalAmount += inv.amount;
      stats.totalEarnings += inv.totalROI || 0;
    });
    return stats;
  }, [apiTotals, investments]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, bonusFilter, pageSize, debouncedSearch, minAmount, maxAmount]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection(field === 'amount' ? 'desc' : 'desc');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
      useGrouping: true,
    }).format(value);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-[--color-mutedForeground]" />;
    }
    return (
      <ArrowUpDown
        className={`h-3.5 w-3.5 text-[--color-primary] ${
          sortDirection === 'asc' ? 'rotate-180' : ''
        }`}
      />
    );
  };

  return (
    <div className="space-y-6">
      <Card
        title="Investment portfolio"
        subtitle="Monitor all active investments, track performance, and manage capital flows."
        actions={
          <Button
            variant="ghost"
            icon={<RefreshCcw className="h-4 w-4" />}
            onClick={() => refetch()}
            loading={isFetching}
            className="px-3 py-2 text-xs uppercase"
          >
            Sync
          </Button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]">
              SEARCH & FILTER
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[--color-mutedForeground]" />
              <Input
                placeholder="Search by user name, email, plan name..."
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                className="pl-10"
              />
              {debouncedSearch && (
                <button
                  type="button"
                  className="absolute right-3 top-3 text-xs text-[--color-mutedForeground]"
                  onClick={() => setSearch('')}
                >
                  clear
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Status"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
                options={[
                  { label: 'All investments', value: 'all' },
                  { label: 'Active only', value: 'active' },
                  { label: 'Completed only', value: 'completed' },
                  { label: 'Cancelled only', value: 'cancelled' },
                ]}
              />
              <SelectField
                label="Bonus"
                value={bonusFilter}
                onChange={(value) => setBonusFilter(value as BonusFilter)}
                options={[
                  { label: 'All investments', value: 'all' },
                  { label: 'Bonus only', value: 'bonus' },
                  { label: 'Hide bonus', value: 'no-bonus' },
                ]}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Page size"
                value={String(pageSize)}
                onChange={(value) => setPageSize(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number])}
                options={PAGE_SIZE_OPTIONS.map((size) => ({
                  label: `${size} / page`,
                  value: String(size),
                }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]">
                  Min Amount
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]">
                  Max Amount
                </label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-white/10 p-4">
            <header className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
              <TrendingUp className="h-4 w-4" />
              Portfolio snapshot
            </header>
            <div>
              <p className="text-sm text-[--color-mutedForeground]">Total capital</p>
              <p className="text-3xl font-semibold text-[--color-foreground]">
                {formatCurrency(totals.totalAmount)}
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[--color-mutedForeground]">Total earnings</p>
                  <p className="font-semibold">{formatCurrency(totals.totalEarnings)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[--color-mutedForeground]">Active</p>
                  <p className="font-semibold">
                    {totals.active} / {totalRecords}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div>
                  <p className="text-[--color-mutedForeground]">Earning wallet</p>
                  <p className="font-semibold text-[--color-primary]">
                    {formatCurrency(totals.totalEarningWallet || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[--color-mutedForeground]">Total earned</p>
                  <p className="font-semibold text-[--color-accent]">
                    {formatCurrency(totals.totalEarned || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <StatPill label="Active" value={totals.active} tone="success" />
              <StatPill label="Completed" value={totals.completed} tone="info" />
              <StatPill label="Cancelled" value={totals.cancelled} tone="warning" />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Investments directory" subtitle="Paginated, sortable investment grid">
        {isLoading ? (
          <Skeleton className="mb-4 h-48 w-full" />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 p-3 text-sm text-[--color-mutedForeground]">
              <div>
                Showing{' '}
                <span className="font-semibold text-[--color-foreground]">
                  {pageRangeStart}-{pageRangeEnd || 0}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-[--color-foreground]">{totalRecords}</span>{' '}
                investments
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="px-3 py-2 text-xs uppercase"
                  icon={<ChevronLeft className="h-4 w-4" />}
                  disabled={currentPage === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev
                </Button>
                <span className="text-xs uppercase tracking-[0.3em]">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  className="px-3 py-2 text-xs uppercase"
                  icon={<ChevronRight className="h-4 w-4" />}
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="scroll-area">
              <table className="table-grid min-w-full">
                <thead>
                  <tr>
                    <th>
                      <SortButton label="User" field="createdAt" activeField={sortField} onSort={handleSort}>
                        User
                      </SortButton>
                    </th>
                    <th>
                      <SortButton label="Plan" field="createdAt" activeField={sortField} onSort={handleSort}>
                        Plan
                      </SortButton>
                    </th>
                    <th>
                      <SortButton
                        label="Amount"
                        field="amount"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('amount')}
                      </SortButton>
                    </th>
                    <th>ROI</th>
                    <th>Status</th>
                    <th>
                      <SortButton
                        label="Start Date"
                        field="startDate"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('startDate')}
                      </SortButton>
                    </th>
                    <th>
                      <SortButton
                        label="Created"
                        field="createdAt"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('createdAt')}
                      </SortButton>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment) => (
                    <tr key={investment._id}>
                      <td>
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-x-2 text-sm">
                            <span className="font-semibold">{investment.user.name}</span>
                            {investment.user.telegramUsername && (
                              <span className="text-xs text-[--color-mutedForeground]">
                                @{investment.user.telegramUsername}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[--color-mutedForeground]">
                            {investment.user.email || 'No email'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <p className="font-semibold">{investment.plan.name}</p>
                          <p className="text-xs text-[--color-mutedForeground]">
                            {investment.plan.dailyROI}% daily • {investment.plan.termDays} days
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <p className="font-semibold text-[--color-foreground]">
                            {formatCurrency(investment.amount)}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <p className="font-semibold">
                            {formatCurrency(investment.totalROI || 0)}
                          </p>
                          <p className="text-xs text-[--color-mutedForeground]">
                            {investment.dailyROI || investment.plan.dailyROI}% daily
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span
                            className="badge"
                            data-tone={
                              investment.status === 'active'
                                ? 'success'
                                : investment.status === 'completed'
                                  ? 'info'
                                  : 'warning'
                            }
                          >
                            {investment.status}
                          </span>
                          {investment.isWelcomeBonusInvestment && (
                            <span className="badge text-[10px]" data-tone="info">
                              Bonus
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <p className="text-sm">
                          {new Intl.DateTimeFormat('en', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }).format(new Date(investment.startDate))}
                        </p>
                        {investment.endDate && (
                          <p className="text-xs text-[--color-mutedForeground]">
                            Ends: {new Intl.DateTimeFormat('en', {
                              month: 'short',
                              day: 'numeric',
                            }).format(new Date(investment.endDate))}
                          </p>
                        )}
                      </td>
                      <td>
                        <p className="text-sm">
                          {new Intl.DateTimeFormat('en', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }).format(new Date(investment.createdAt))}
                        </p>
                        <p className="text-xs text-[--color-mutedForeground]">
                          {timeAgo(investment.createdAt)}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {!investments.length && !isFetching && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-sm text-[--color-mutedForeground]">
                        No investments match this view. Adjust filters or search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) => (
  <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]">
    {label}
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <select
        className="w-full bg-transparent text-sm font-semibold text-[--color-foreground] outline-none"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-black">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </label>
);

const SortButton = ({
  label,
  field,
  activeField,
  onSort,
  children,
}: {
  label: string;
  field: SortField;
  activeField: SortField;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={() => onSort(field)}
    className="flex w-full items-center gap-1 text-left text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]"
  >
    {label}
    {children}
    {activeField === field && <span className="sr-only">sorted</span>}
  </button>
);

const StatPill = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'info';
}) => {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
      : tone === 'warning'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
        : 'border-blue-500/40 bg-blue-500/10 text-blue-200';
  return (
    <div className={`rounded-xl border px-2 py-1.5 text-center ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-[0.2em]">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
};

const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
};

