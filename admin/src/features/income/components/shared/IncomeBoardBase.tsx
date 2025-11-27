"use client";

import { useEffect, useMemo, useState, ReactNode } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Search,
  TrendingUp,
  DollarSign,
  XCircle,
  Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetIncomesQuery } from '@/features/income/api';
import type { IncomeStatus, IncomeType } from '@/features/income/types';

type StatusFilter = IncomeStatus | 'all';
type SortField = 'incomeDate' | 'createdAt' | 'amount' | 'level' | 'incomeType';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
};

export const SelectField = ({
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
  <label className="flex flex-col gap-2">
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
      {label}
    </span>
    <div className="relative rounded-xl border border-white/10 bg-white/5 transition-all hover:border-white/20 focus-within:border-[--color-primary] focus-within:ring-2 focus-within:ring-[--color-primary]/20">
      <select
        className="w-full appearance-none bg-transparent px-3 py-2.5 text-sm font-medium text-[--color-foreground] outline-none"
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

export const SortButton = ({
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
  children?: ReactNode;
}) => (
  <button
    type="button"
    onClick={() => onSort(field)}
    className="flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground] transition-colors hover:text-[--color-foreground]"
  >
    {label}
    {children}
  </button>
);

interface IncomeBoardBaseProps {
  incomeType?: IncomeType | 'all';
  title: string;
  subtitle: string;
  statsCard?: (totals: { totalAmount: number; levelStats: Array<{ _id: number; count: number; totalAmount: number }> }, totalRecords: number, formatCurrency: (value: number) => string) => ReactNode;
  showLevelFilter?: boolean;
  additionalFilters?: ReactNode;
  tableColumns: ReactNode;
  renderRow?: (income: any, formatCurrency: (value: number) => string, formatDate: (date: string) => string, timeAgo: (date: string) => string, getStatusBadge: (status: IncomeStatus) => ReactNode) => ReactNode;
}

export const IncomeBoardBase = ({
  incomeType,
  title,
  subtitle,
  statsCard,
      showLevelFilter = false,
      additionalFilters,
      tableColumns,
      renderRow,
    }: IncomeBoardBaseProps) => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('incomeDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 350);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      incomeType: incomeType || undefined,
      level: levelFilter !== 'all' ? parseInt(levelFilter, 10) : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sortField,
      sortDirection,
      limit: pageSize,
      page,
    }),
    [debouncedSearch, incomeType, levelFilter, statusFilter, sortField, sortDirection, pageSize, page]
  );

  const { data, isLoading, isFetching, refetch } = useGetIncomesQuery(queryParams);

  const incomes = useMemo(() => data?.data?.incomes ?? [], [data]);
  const totalRecords = data?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = isFetching ? page : data?.meta?.page ?? page;
  const pageRangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageRangeEnd =
    totalRecords === 0 ? 0 : Math.min(currentPage * pageSize, totalRecords);

  const totals = useMemo(() => {
    if (!data?.meta?.totals) {
      return {
        totalAmount: 0,
        incomeTypeStats: [],
        levelStats: [],
      };
    }
    return data.meta.totals;
  }, [data]);

  useEffect(() => {
    setPage(1);
  }, [levelFilter, statusFilter, pageSize, debouncedSearch]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection(field === 'incomeDate' || field === 'createdAt' ? 'desc' : 'asc');
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

  const formatDate = (date: string) => {
    const d = new Date(date);
    const month = d.toLocaleString('en', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
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

  const getStatusBadge = (status: IncomeStatus) => {
    const statusConfig = {
      pending: { tone: 'warning' as const, label: 'Pending' },
      completed: { tone: 'success' as const, label: 'Completed' },
      failed: { tone: 'danger' as const, label: 'Failed' },
    };

    const config = statusConfig[status];

    return (
      <span className="badge" data-tone={config.tone}>
        {config.label}
      </span>
    );
  };

  // Get available levels from levelStats
  const availableLevels = useMemo(() => {
    const levels = totals.levelStats.map((stat) => stat._id).sort((a, b) => a - b);
    return levels;
  }, [totals.levelStats]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Overview Cards */}
      {statsCard ? statsCard(totals, totalRecords, formatCurrency) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                  Total Income
                </p>
                <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                  {formatCurrency(totals.totalAmount)}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                  <DollarSign className="h-3 w-3" />
                  <span>All time</span>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500/20 p-2.5">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                  {totalRecords}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                  <Filter className="h-3 w-3" />
                  <span>In database</span>
                </div>
              </div>
              <div className="rounded-xl bg-blue-500/20 p-2.5">
                <Filter className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      <Card title={title} subtitle={subtitle}>
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Filters Section */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]">
                Search & Filter
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[--color-mutedForeground]" />
                <Input
                  placeholder="Search by user name, email, description, reference ID..."
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  className="pl-10 pr-10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-3.5 rounded-full p-1 text-[--color-mutedForeground] transition-colors hover:bg-white/10 hover:text-[--color-foreground]"
                    title="Clear search"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {showLevelFilter && (
                <SelectField
                  label="Level"
                  value={levelFilter}
                  onChange={(value) => setLevelFilter(value)}
                  options={[
                    { label: 'All levels', value: 'all' },
                    ...availableLevels.map((level) => ({
                      label: `Level ${level}`,
                      value: String(level),
                    })),
                  ]}
                />
              )}
              <SelectField
                label="Status"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
                options={[
                  { label: 'All statuses', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Failed', value: 'failed' },
                ]}
              />
              <SelectField
                label="Page size"
                value={String(pageSize)}
                onChange={(value) =>
                  setPageSize(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number])
                }
                options={PAGE_SIZE_OPTIONS.map((size) => ({
                  label: `${size} per page`,
                  value: String(size),
                }))}
              />
              {additionalFilters}
            </div>

            {/* Active Filters Display */}
            {(levelFilter !== 'all' || statusFilter !== 'all' || search) && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                  Active filters:
                </span>
                {search && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs">
                    Search: "{search}"
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="rounded-full p-0.5 hover:bg-white/20"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {levelFilter !== 'all' && showLevelFilter && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs">
                    Level: {levelFilter}
                    <button
                      type="button"
                      onClick={() => setLevelFilter('all')}
                      className="rounded-full p-0.5 hover:bg-white/20"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs capitalize">
                    Status: {statusFilter}
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className="rounded-full p-0.5 hover:bg-white/20"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setLevelFilter('all');
                    setStatusFilter('all');
                  }}
                  className="ml-auto text-xs text-[--color-primary] hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Summary Panel */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
            <header className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]">
              <TrendingUp className="h-4 w-4 text-[--color-primary]" />
              Summary
            </header>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="mb-1 text-xs text-[--color-mutedForeground]">Total records</p>
                <p className="text-2xl font-bold text-[--color-foreground]">{totalRecords}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="mb-1 text-xs text-[--color-mutedForeground]">Total amount</p>
                <p className="text-lg font-semibold text-emerald-400">
                  {formatCurrency(totals.totalAmount)}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="mb-1 text-xs text-[--color-mutedForeground]">Current view</p>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-foreground]">
                  Page {currentPage} of {totalPages}
                </p>
                <p className="mt-1 text-xs text-[--color-mutedForeground]">
                  Showing {pageRangeStart}-{pageRangeEnd} of {totalRecords}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title={`${title} Directory`} subtitle="Paginated, sortable income intelligence grid">
        {isLoading ? (
          <Skeleton className="mb-4 h-48 w-full" />
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm">
                Showing{' '}
                <span className="font-semibold text-[--color-foreground]">
                  {pageRangeStart}-{pageRangeEnd || 0}
                </span>{' '}
                of <span className="font-semibold text-[--color-foreground]">{totalRecords}</span>{' '}
                records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="px-3 py-2 text-xs uppercase"
                  icon={<RefreshCcw className="h-4 w-4" />}
                  onClick={() => refetch()}
                  loading={isFetching}
                >
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 py-2 text-xs uppercase"
                  icon={<ChevronLeft className="h-4 w-4" />}
                  disabled={currentPage === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  <span className="hidden sm:inline">Prev</span>
                </Button>
                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  className="px-3 py-2 text-xs uppercase"
                  icon={<ChevronRight className="h-4 w-4" />}
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  <span className="hidden sm:inline">Next</span>
                </Button>
              </div>
            </div>

            <div className="scroll-area -mx-2 overflow-x-auto px-2">
              <table className="table-grid min-w-full">
                <thead>
                  <tr className="bg-white/5">{tableColumns}</tr>
                </thead>
                <tbody>
                  {incomes.map((income) => {
                    if (renderRow) {
                      return renderRow(income, formatCurrency, formatDate, timeAgo, getStatusBadge);
                    }

                    const userName = income.user?.name || income.user?.email || 'Unknown';
                    const userEmail = income.user?.email || 'No email';
                    const userTelegram = income.user?.telegramUsername;

                    return (
                      <tr
                        key={income._id}
                        className="transition-colors duration-150 hover:bg-white/5"
                      >
                        <td>
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-x-2 text-sm">
                              <span className="font-semibold">{userName}</span>
                              {userTelegram && (
                                <span className="text-xs text-[--color-mutedForeground]">
                                  @{userTelegram}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[--color-mutedForeground]">
                              {userEmail}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm leading-5">
                            <p className="font-semibold text-[--color-foreground]">
                              {formatCurrency(income.amount)}
                            </p>
                            <p className="text-xs text-[--color-mutedForeground]">
                              Wallet: {formatCurrency(income.earningWalletAfter)}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="max-w-[200px]">
                            <p className="truncate text-sm text-[--color-foreground]">
                              {income.description}
                            </p>
                            {income.referenceId && (
                              <p className="text-xs text-[--color-mutedForeground]">
                                Ref: {income.referenceId}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>{getStatusBadge(income.status)}</td>
                        <td>
                          <span className="text-sm whitespace-nowrap">{formatDate(income.incomeDate)}</span>
                        </td>
                        <td>
                          <p className="text-sm">
                            {new Intl.DateTimeFormat('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }).format(new Date(income.createdAt))}
                          </p>
                          <p className="text-xs text-[--color-mutedForeground]">
                            {timeAgo(income.createdAt)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                  {!incomes.length && !isFetching && (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-6 text-center text-sm text-[--color-mutedForeground]"
                      >
                        No records match this view. Adjust filters or search criteria.
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

