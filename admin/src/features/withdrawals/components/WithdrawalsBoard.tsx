"use client";

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCcw,
  Search,
  ShieldCheck,
  Copy,
  Check,
  TrendingUp,
  Wallet,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useGetWithdrawalsQuery,
  useUpdateWithdrawalStatusMutation,
  useGetPendingWithdrawalsCountQuery,
} from '@/features/withdrawals/api';
import type { WithdrawalStatus, Withdrawal } from '@/features/withdrawals/types';

type StatusFilter = 'all' | 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
type SortField = 'createdAt' | 'amount' | 'status' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_TOTALS = {
  totalPending: 0,
  totalApproved: 0,
  totalCompleted: 0,
  totalRejected: 0,
  totalAmount: 0,
};

export const WithdrawalsBoard = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [page, setPage] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 350);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sortField,
      sortDirection,
      limit: pageSize,
      page,
    }),
    [debouncedSearch, statusFilter, sortField, sortDirection, pageSize, page]
  );

  const { data, isLoading, isFetching, refetch } = useGetWithdrawalsQuery(queryParams);
  const { data: pendingCountData } = useGetPendingWithdrawalsCountQuery();
  const [updateWithdrawal, { isLoading: isUpdating }] = useUpdateWithdrawalStatusMutation();

  const withdrawals = useMemo(() => data?.withdrawals ?? [], [data]);
  const apiTotalPages = data?.meta?.totalPages;
  const totalRecords = data?.total ?? 0;
  const totalPages = apiTotalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = isFetching ? page : data?.meta?.page ?? page;
  const pageRangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageRangeEnd =
    totalRecords === 0 ? 0 : Math.min(currentPage * pageSize, totalRecords);

  const totals = useMemo(() => {
    if (!data?.withdrawals) return DEFAULT_TOTALS;
    return {
      totalPending: withdrawals.filter((w) => w.status === 'pending').length,
      totalApproved: withdrawals.filter((w) => w.status === 'approved').length,
      totalCompleted: withdrawals.filter((w) => w.status === 'completed').length,
      totalRejected: withdrawals.filter((w) => w.status === 'rejected').length,
      totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
    };
  }, [withdrawals, data]);

  const pendingCount = pendingCountData?.count ?? 0;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, pageSize, debouncedSearch]);

  useEffect(() => {
    if (!apiTotalPages) return;
    if (page > apiTotalPages) {
      setPage(apiTotalPages || 1);
    }
  }, [apiTotalPages, page]);

  const handleStatusChange = async (
    id: string,
    nextStatus: WithdrawalStatus,
    transactionHash?: string
  ) => {
    try {
      await updateWithdrawal({
        id,
        body: {
          status: nextStatus,
          adminNote: `Updated to ${nextStatus} from admin console`,
          ...(nextStatus === 'completed' && transactionHash ? { transactionHash } : {}),
        },
      }).unwrap();
      toast.success(`Withdrawal moved to ${nextStatus}`);
      refetch();
    } catch (error: unknown) {
      type ApiError = { data?: { message?: string }; message?: string };
      let message = 'Unable to update status';
      if (typeof error === 'object' && error !== null) {
        const apiError = error as ApiError;
        message = apiError.data?.message || apiError.message || message;
      }
      toast.error(message);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection(field === 'createdAt' || field === 'updatedAt' ? 'desc' : 'asc');
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'BNB' || currency === 'USDT' ? 'USD' : currency,
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

  const getStatusBadge = (status: WithdrawalStatus) => {
    const statusConfig = {
      pending: { tone: 'warning' as const, icon: Clock, label: 'Pending' },
      approved: { tone: 'info' as const, icon: CheckCircle2, label: 'Approved' },
      completed: { tone: 'success' as const, icon: CheckCircle2, label: 'Completed' },
      rejected: { tone: 'danger' as const, icon: XCircle, label: 'Rejected' },
      cancelled: { tone: 'muted' as const, icon: Ban, label: 'Cancelled' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className="badge inline-flex items-center gap-1.5" data-tone={config.tone}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Overview Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                Pending
              </p>
              <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                {pendingCount}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                <Clock className="h-3 w-3" />
                <span>Awaiting review</span>
              </div>
            </div>
            <div className="rounded-xl bg-amber-500/20 p-2.5">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                Approved
              </p>
              <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                {totals.totalApproved}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                <CheckCircle2 className="h-3 w-3" />
                <span>Ready to process</span>
              </div>
            </div>
            <div className="rounded-xl bg-blue-500/20 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                Completed
              </p>
              <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                {totals.totalCompleted}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                <CheckCircle2 className="h-3 w-3" />
                <span>Successfully processed</span>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-500/20 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-4 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                Total Amount
              </p>
              <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                {formatCurrency(totals.totalAmount)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                <DollarSign className="h-3 w-3" />
                <span>In this view</span>
              </div>
            </div>
            <div className="rounded-xl bg-purple-500/20 p-2.5">
              <Wallet className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <Card
        title="Withdrawal management"
        subtitle="Search, filter, and manage all withdrawal requests from users."
        actions={
          <div className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-[--color-mutedForeground] md:flex">
            <ShieldCheck size={14} />
            SECURED
          </div>
        }
      >
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
                  placeholder="Search by user name, email, chat ID, wallet address..."
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
              <SelectField
                label="Status"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
                options={[
                  { label: 'All statuses', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Rejected', value: 'rejected' },
                  { label: 'Cancelled', value: 'cancelled' },
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
            </div>

            {/* Active Filters Display */}
            {(statusFilter !== 'all' || search) && (
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
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="mb-1 text-xs text-[--color-mutedForeground]">Pending</p>
                  <p className="text-lg font-semibold text-amber-400">{pendingCount}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="mb-1 text-xs text-[--color-mutedForeground]">Completed</p>
                  <p className="text-lg font-semibold text-emerald-400">
                    {totals.totalCompleted}
                  </p>
                </div>
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

      <Card title="Withdrawals directory" subtitle="Paginated, sortable withdrawal intelligence grid">
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
                withdrawals
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
                  <tr className="bg-white/5">
                    <th className="min-w-[200px]">
                      <SortButton
                        label="User"
                        field="createdAt"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('createdAt')}
                      </SortButton>
                    </th>
                    <th className="min-w-[120px]">
                      <SortButton
                        label="Chat ID"
                        field="createdAt"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('createdAt')}
                      </SortButton>
                    </th>
                    <th className="min-w-[140px]">
                      <SortButton
                        label="Amount"
                        field="amount"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('amount')}
                      </SortButton>
                    </th>
                    <th className="min-w-[250px]">Wallet Address</th>
                    <th className="min-w-[120px]">
                      <SortButton
                        label="Status"
                        field="status"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('status')}
                      </SortButton>
                    </th>
                    <th className="min-w-[150px]">
                      <SortButton
                        label="Created"
                        field="createdAt"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('createdAt')}
                      </SortButton>
                    </th>
                    <th className="min-w-[200px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => {
                    const user =
                      typeof withdrawal.user === 'string'
                        ? null
                        : withdrawal.user;
                    const userName = user?.name || user?.email || 'Unknown';
                    const userChatId = user?.telegramChatId;
                    const userEmail = user?.email || 'No email';

                    return (
                      <tr
                        key={withdrawal._id}
                        className="transition-colors duration-150 hover:bg-white/5"
                      >
                        <td>
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-x-2 text-sm">
                              <span className="font-semibold">{userName}</span>
                              {user?.telegramUsername && (
                                <span className="text-xs text-[--color-mutedForeground]">
                                  @{user.telegramUsername}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[--color-mutedForeground]">
                              {userEmail}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-[--color-foreground]">
                              {userChatId ?? 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm leading-5">
                            <p className="font-semibold text-[--color-foreground]">
                              {formatCurrency(withdrawal.amount, withdrawal.currency)}
                            </p>
                            <p className="text-xs text-[--color-mutedForeground]">
                              {withdrawal.currency} • {withdrawal.network}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 break-all font-mono text-xs text-[--color-foreground]">
                              {withdrawal.walletAddress}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyAddress(withdrawal.walletAddress)}
                              className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-1.5 transition-colors hover:bg-white/10 hover:border-white/20"
                              title="Copy address"
                            >
                              {copiedAddress === withdrawal.walletAddress ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-[--color-mutedForeground]" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td>{getStatusBadge(withdrawal.status)}</td>
                        <td>
                          <p className="text-sm">
                            {new Intl.DateTimeFormat('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }).format(new Date(withdrawal.createdAt))}
                          </p>
                          <p className="text-xs text-[--color-mutedForeground]">
                            {timeAgo(withdrawal.createdAt)}
                          </p>
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {withdrawal.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  className="px-2.5 py-1.5 text-xs uppercase sm:px-3 sm:py-2"
                                  loading={isUpdating}
                                  onClick={() => handleStatusChange(withdrawal._id, 'approved')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="px-2.5 py-1.5 text-xs uppercase sm:px-3 sm:py-2"
                                  loading={isUpdating}
                                  onClick={() => handleStatusChange(withdrawal._id, 'rejected')}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {withdrawal.status === 'approved' && (
                              <Button
                                variant="ghost"
                                className="px-2.5 py-1.5 text-xs uppercase sm:px-3 sm:py-2"
                                loading={isUpdating}
                                onClick={() => handleStatusChange(withdrawal._id, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                            {withdrawal.status === 'pending' && (
                              <Button
                                variant="ghost"
                                className="px-2.5 py-1.5 text-xs uppercase sm:px-3 sm:py-2"
                                loading={isUpdating}
                                onClick={() => handleStatusChange(withdrawal._id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!withdrawals.length && !isFetching && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-sm text-[--color-mutedForeground]"
                      >
                        No withdrawals match this view. Adjust filters or search criteria.
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
          <option
            key={option.value}
            value={option.value}
            className="bg-[--color-card] text-[--color-foreground]"
          >
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <svg
          className="h-4 w-4 text-[--color-mutedForeground]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
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

const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
};
