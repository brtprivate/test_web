"use client";

import { useMemo, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCcw,
  Search,
  Wallet,
  TrendingUp,
  DollarSign,
  Plus,
  Minus,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useGetWalletAdjustmentsQuery,
  useGetWalletAdjustmentStatsQuery,
} from '@/features/wallet-adjustments/api';
import type { WalletAdjustment } from '@/features/wallet-adjustments/types';

type WalletTypeFilter = 'all' | 'investment' | 'earning';
type ActionFilter = 'all' | 'add' | 'deduct';
type SortField = 'createdAt' | 'amount';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export interface WalletAdjustmentHistoryRef {
  refetch: () => void;
}

export const WalletAdjustmentHistory = forwardRef<WalletAdjustmentHistoryRef>((_, ref) => {
  const [search, setSearch] = useState('');
  const [walletTypeFilter, setWalletTypeFilter] = useState<WalletTypeFilter>('all');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 350);

  const queryParams = useMemo(
    () => ({
      walletType: walletTypeFilter !== 'all' ? walletTypeFilter : undefined,
      action: actionFilter !== 'all' ? actionFilter : undefined,
      sortField,
      sortDirection,
      limit: pageSize,
      page,
    }),
    [walletTypeFilter, actionFilter, sortField, sortDirection, pageSize, page]
  );

  const { data, isLoading, isFetching, refetch } = useGetWalletAdjustmentsQuery(queryParams);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetWalletAdjustmentStatsQuery();

  useImperativeHandle(ref, () => ({
    refetch: () => {
      refetch();
      refetchStats();
    },
  }));

  const adjustments = useMemo(() => data?.adjustments ?? [], [data]);
  const totalRecords = data?.total ?? 0;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = isFetching ? page : data?.page ?? page;
  const pageRangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageRangeEnd = totalRecords === 0 ? 0 : Math.min(currentPage * pageSize, totalRecords);

  useEffect(() => {
    setPage(1);
  }, [walletTypeFilter, actionFilter, pageSize]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getActionBadge = (action: 'add' | 'deduct') => {
    if (action === 'add') {
      return (
        <span className="badge" data-tone="success">
          <Plus className="mr-1 h-3 w-3" />
          Add
        </span>
      );
    }
    return (
      <span className="badge" data-tone="danger">
        <Minus className="mr-1 h-3 w-3" />
        Deduct
      </span>
    );
  };

  const getWalletTypeBadge = (walletType: 'investment' | 'earning') => {
    if (walletType === 'investment') {
      return (
        <span className="badge" data-tone="info">
          <TrendingUp className="mr-1 h-3 w-3" />
          Investment
        </span>
      );
    }
    return (
      <span className="badge" data-tone="warning">
        <DollarSign className="mr-1 h-3 w-3" />
        Earning
      </span>
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

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[--color-primary]/20 to-[--color-accent]/20">
            <Wallet className="h-5 w-5 text-[--color-primary]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[--color-foreground]">Adjustment History</h2>
            <p className="text-sm text-[--color-mutedForeground]">View all wallet adjustments</p>
          </div>
        </div>
        <Button variant="ghost" icon={<RefreshCcw className="h-4 w-4" />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[--color-muted]/30 to-transparent p-4">
            <div className="text-xs font-medium text-[--color-mutedForeground]">Total Adjustments</div>
            <div className="mt-1 text-2xl font-bold text-[--color-foreground]">{stats.totalAdjustments}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[--color-success]/10 to-transparent p-4">
            <div className="text-xs font-medium text-[--color-mutedForeground]">Total Added</div>
            <div className="mt-1 text-2xl font-bold text-[--color-success]">
              ${stats.totalAdded.toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[--color-danger]/10 to-transparent p-4">
            <div className="text-xs font-medium text-[--color-mutedForeground]">Total Deducted</div>
            <div className="mt-1 text-2xl font-bold text-[--color-danger]">
              ${stats.totalDeducted.toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[--color-primary]/10 to-transparent p-4">
            <div className="text-xs font-medium text-[--color-mutedForeground]">Net Change</div>
            <div
              className={`mt-1 text-2xl font-bold ${
                stats.totalAdded - stats.totalDeducted >= 0
                  ? 'text-[--color-success]'
                  : 'text-[--color-danger]'
              }`}
            >
              ${(stats.totalAdded - stats.totalDeducted).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-mutedForeground]" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={walletTypeFilter}
          onChange={(e) => setWalletTypeFilter(e.target.value as WalletTypeFilter)}
          className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[--color-foreground] outline-none transition-all duration-150 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/20"
        >
          <option value="all">All Wallet Types</option>
          <option value="investment">Investment</option>
          <option value="earning">Earning</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
          className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[--color-foreground] outline-none transition-all duration-150 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/20"
        >
          <option value="all">All Actions</option>
          <option value="add">Add</option>
          <option value="deduct">Deduct</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
          className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[--color-foreground] outline-none transition-all duration-150 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/20"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-medium uppercase text-[--color-mutedForeground]">
                <th className="pb-3">User</th>
                <th className="pb-3">
                  <button
                    onClick={() => toggleSort('createdAt')}
                    className="flex items-center gap-1 hover:text-[--color-foreground]"
                  >
                    Date
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="pb-3">Wallet Type</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">
                  <button
                    onClick={() => toggleSort('amount')}
                    className="flex items-center gap-1 hover:text-[--color-foreground]"
                  >
                    Amount
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="pb-3">Balance Before</th>
                <th className="pb-3">Balance After</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Admin</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adjustment: WalletAdjustment) => (
                <tr
                  key={adjustment._id}
                  className="border-b border-white/5 transition-colors hover:bg-white/5"
                >
                  <td className="py-4">
                    <div>
                      <div className="font-medium">{adjustment.user.name || 'Unknown'}</div>
                      <div className="text-xs text-[--color-mutedForeground]">
                        {adjustment.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div>
                      <div className="text-sm">
                        {new Intl.DateTimeFormat('en', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(adjustment.createdAt))}
                      </div>
                      <div className="text-xs text-[--color-mutedForeground]">
                        {timeAgo(adjustment.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">{getWalletTypeBadge(adjustment.walletType)}</td>
                  <td className="py-4">{getActionBadge(adjustment.action)}</td>
                  <td className="py-4">
                    <span
                      className={`font-semibold ${
                        adjustment.action === 'add' ? 'text-[--color-success]' : 'text-[--color-danger]'
                      }`}
                    >
                      {adjustment.action === 'add' ? '+' : '-'}${adjustment.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 text-sm">${adjustment.balanceBefore.toFixed(2)}</td>
                  <td className="py-4 text-sm font-medium">${adjustment.balanceAfter.toFixed(2)}</td>
                  <td className="py-4">
                    <div className="max-w-xs truncate text-sm" title={adjustment.description}>
                      {adjustment.description}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="text-sm">{adjustment.admin.username || 'Admin'}</div>
                  </td>
                </tr>
              ))}
              {!adjustments.length && !isFetching && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-sm text-[--color-mutedForeground]">
                    No adjustments found. Adjust filters or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalRecords > 0 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-[--color-mutedForeground]">
            Showing {pageRangeStart} to {pageRangeEnd} of {totalRecords} adjustments
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              icon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-[--color-foreground]">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="ghost"
              icon={<ChevronRight className="h-4 w-4" />}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
});

WalletAdjustmentHistory.displayName = 'WalletAdjustmentHistory';

