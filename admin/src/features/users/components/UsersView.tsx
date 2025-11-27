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
  Sparkles,
  TrendingUp,
  ExternalLink,
  Users,
  DollarSign,
  Wallet,
  Award,
  X,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  BarChart3,
  Info,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useGetUsersQuery,
  useUpdateUserMutation,
  useGenerateUserLoginTokenMutation,
} from '@/features/users/api';
import type { AdminUser, AdminUserReferrer } from '@/features/users/types';

type StatusFilter = 'all' | 'active' | 'suspended';
type BonusFilter = 'all' | 'bonus' | 'no-bonus';
type CapitalFilter = 'all' | 'starters' | 'scaling' | 'whales';
type SortField = 'createdAt' | 'name' | 'totalInvested' | 'totalEarned';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_TOTALS = {
  totalInvested: 0,
  totalEarned: 0,
  active: 0,
  whales: 0,
  bonusClaimed: 0,
};

export const UsersView = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [bonusFilter, setBonusFilter] = useState<BonusFilter>('all');
  const [capitalFilter, setCapitalFilter] = useState<CapitalFilter>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 350);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      bonus: bonusFilter !== 'all' ? bonusFilter : undefined,
      capital: capitalFilter !== 'all' ? capitalFilter : undefined,
      sortField,
      sortDirection,
      limit: pageSize,
      page,
    }),
    [
      debouncedSearch,
      statusFilter,
      bonusFilter,
      capitalFilter,
      sortField,
      sortDirection,
      pageSize,
      page,
    ]
  );

  const { data, isLoading, isFetching, refetch } = useGetUsersQuery(queryParams);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [generateLoginToken, { isLoading: isGeneratingToken }] = useGenerateUserLoginTokenMutation();

  const users = useMemo(() => data?.data.users ?? [], [data]);
  const apiTotalPages = data?.meta?.totalPages;
  const totals = data?.meta?.totals ?? DEFAULT_TOTALS;
  const totalRecords = data?.total ?? 0;
  const totalPages = apiTotalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = isFetching ? page : data?.meta?.page ?? page;
  const pageRangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageRangeEnd =
    totalRecords === 0 ? 0 : Math.min(currentPage * pageSize, totalRecords);

  const recentHighEarners = useMemo(
    () => [...users].sort((a, b) => b.totalEarned - a.totalEarned).slice(0, 3),
    [users]
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter, bonusFilter, capitalFilter, pageSize, debouncedSearch]);

  useEffect(() => {
    if (!apiTotalPages) return;
    if (page > apiTotalPages) {
      setPage(apiTotalPages || 1);
    }
  }, [apiTotalPages, page]);

  const handleStatusToggle = async (id: string, current: boolean) => {
    try {
      await updateUser({ id, body: { isActive: !current } }).unwrap();
      toast.success(`User ${!current ? 'activated' : 'disabled'}`);
      refetch();
    } catch (error: unknown) {
      type ApiError = { data?: { message?: string }; message?: string };
      let message = 'Unable to update user';
      if (typeof error === 'object' && error !== null) {
        const apiError = error as ApiError;
        message = apiError.data?.message || apiError.message || message;
      }
      toast.error(message);
    }
  };

  const handleLoginAsUser = async (user: AdminUser) => {
    try {
      const result = await generateLoginToken(user._id).unwrap();
      if (result.data?.token && user.telegramChatId) {
        const userPortalUrl = process.env.NEXT_PUBLIC_USER_PORTAL_URL || 'http://localhost:3000';
        const timestamp = Date.now();
        const loginUrl = `${userPortalUrl}/?chatId=${user.telegramChatId}&token=${result.data.token}&source=telegram&ts=${timestamp}`;
        toast.success(`Logging in as ${user.name}...`);
        window.open(loginUrl, '_blank');
      } else if (!user.telegramChatId) {
        toast.error('User does not have a Telegram Chat ID');
      }
    } catch (error: unknown) {
      type ApiError = { data?: { message?: string }; message?: string };
      let message = 'Unable to generate login token';
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
    setSortDirection(field === 'name' ? 'asc' : 'desc');
  };

  const formatCurrency = (value: number) => {
    // Show full precision without rounding
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 18, // Support up to 18 decimal places
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
    <div className="space-y-4 md:space-y-6">
      {/* Stats Overview Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                Total Invested
              </p>
              <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                {formatCurrency(totals.totalInvested)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                <Wallet className="h-3 w-3" />
                <span>Deployed capital</span>
              </div>
            </div>
            <div className="rounded-xl bg-blue-500/20 p-2.5">
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                Total Earned
              </p>
              <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                {formatCurrency(totals.totalEarned)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                <TrendingUp className="h-3 w-3" />
                <span>Total earnings</span>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-500/20 p-2.5">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-4 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                Active Users
              </p>
              <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                {totals.active}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                <Users className="h-3 w-3" />
                <span>of {totalRecords} total</span>
              </div>
            </div>
            <div className="rounded-xl bg-purple-500/20 p-2.5">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                Whales
              </p>
              <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                {totals.whales}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                <Sparkles className="h-3 w-3" />
                <span>High value</span>
              </div>
            </div>
            <div className="rounded-xl bg-amber-500/20 p-2.5">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      <Card
        title="User intelligence"
        subtitle="Search, filter, and moderate every wallet connected to the network."
        actions={
          <div className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-[--color-mutedForeground] md:flex">
            <ShieldCheck size={14} />
            SOC2 READY
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
                  placeholder="Search by name, email, referral code..."
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
                    <X className="h-3.5 w-3.5" />
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
                  { label: 'All accounts', value: 'all' },
                  { label: 'Active only', value: 'active' },
                  { label: 'Suspended only', value: 'suspended' },
                ]}
              />
              <SelectField
                label="Bonus"
                value={bonusFilter}
                onChange={(value) => setBonusFilter(value as BonusFilter)}
                options={[
                  { label: 'All users', value: 'all' },
                  { label: 'Bonus granted', value: 'bonus' },
                  { label: 'Bonus pending', value: 'no-bonus' },
                ]}
              />
              <SelectField
                label="Capital profile"
                value={capitalFilter}
                onChange={(value) => setCapitalFilter(value as CapitalFilter)}
                options={[
                  { label: 'All brackets', value: 'all' },
                  { label: '< $1K (Starters)', value: 'starters' },
                  { label: '$1K - $10K (Scaling)', value: 'scaling' },
                  { label: '>$10K (Whales)', value: 'whales' },
                ]}
              />
              <SelectField
                label="Page size"
                value={String(pageSize)}
                onChange={(value) => setPageSize(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number])}
                options={PAGE_SIZE_OPTIONS.map((size) => ({
                  label: `${size} per page`,
                  value: String(size),
                }))}
              />
            </div>

            {/* Active Filters Display */}
            {(statusFilter !== 'all' || bonusFilter !== 'all' || capitalFilter !== 'all' || search) && (
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
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs">
                    Status: {statusFilter === 'active' ? 'Active' : 'Suspended'}
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className="rounded-full p-0.5 hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {bonusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs">
                    Bonus: {bonusFilter === 'bonus' ? 'Granted' : 'Pending'}
                    <button
                      type="button"
                      onClick={() => setBonusFilter('all')}
                      className="rounded-full p-0.5 hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {capitalFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs">
                    Capital: {capitalFilter === 'starters' ? 'Starters' : capitalFilter === 'scaling' ? 'Scaling' : 'Whales'}
                    <button
                      type="button"
                      onClick={() => setCapitalFilter('all')}
                      className="rounded-full p-0.5 hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setBonusFilter('all');
                    setCapitalFilter('all');
                  }}
                  className="ml-auto text-xs text-[--color-primary] hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Performance Snapshot */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
            <header className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]">
              <TrendingUp className="h-4 w-4 text-[--color-primary]" />
              Performance snapshot
            </header>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="mb-1 text-xs text-[--color-mutedForeground]">Deployed capital</p>
                <p className="text-2xl font-bold text-[--color-foreground]">
                  {formatCurrency(totals.totalInvested)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="mb-1 text-xs text-[--color-mutedForeground]">Earnings</p>
                  <p className="text-lg font-semibold text-emerald-400">
                    {formatCurrency(totals.totalEarned)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="mb-1 text-xs text-[--color-mutedForeground]">Active</p>
                  <p className="text-lg font-semibold text-[--color-foreground]">
                    {totals.active}
                    <span className="ml-1 text-xs text-[--color-mutedForeground]">/ {totalRecords}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[--color-primary]" />
                  <span>{totals.whales} whales</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-3.5 w-3.5" />
                  <span>{totals.bonusClaimed} bonuses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Runtime Segmentation */}
        <Card title="Runtime segmentation" subtitle="Live distribution overview">
          <div className="space-y-4">
            {/* Active Users */}
            <div className="group relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                      <Users className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                        Active
                      </p>
                      <p className="text-2xl font-bold text-emerald-400">{totals.active}</p>
                    </div>
                  </div>
                  {totalRecords > 0 && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-[--color-mutedForeground]">Available investors</span>
                        <span className="font-semibold text-emerald-400">
                          {Math.round((totals.active / totalRecords) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${(totals.active / totalRecords) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Suspended Users */}
            <div className="group relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                      <ShieldCheck className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                        Suspended
                      </p>
                      <p className="text-2xl font-bold text-amber-400">
                        {Math.max(totalRecords - totals.active, 0)}
                      </p>
                    </div>
                  </div>
                  {totalRecords > 0 && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-[--color-mutedForeground]">Requires review</span>
                        <span className="font-semibold text-amber-400">
                          {Math.round(((totalRecords - totals.active) / totalRecords) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                          style={{
                            width: `${((totalRecords - totals.active) / totalRecords) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bonus Claimed */}
            <div className="group relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                      <Award className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                        Bonus claimed
                      </p>
                      <p className="text-2xl font-bold text-blue-400">{totals.bonusClaimed}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-[--color-mutedForeground]">Promos used</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Capital Champions */}
        <Card
          title="Capital champions"
          subtitle="Top earners this cycle"
          actions={
            <Button
              variant="ghost"
              icon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => refetch()}
              loading={isFetching}
              className="px-3 py-2 text-xs uppercase"
            >
              Refresh
            </Button>
          }
        >
          <div className="space-y-3">
            {recentHighEarners.map((user, index) => {
              const rankColors = [
                'from-yellow-500/20 to-amber-500/20 text-yellow-400',
                'from-slate-400/20 to-slate-500/20 text-slate-300',
                'from-amber-600/20 to-amber-700/20 text-amber-400',
              ];
              const rankIcons = ['🥇', '🥈', '🥉'];
              return (
                <div
                  key={user._id}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${rankColors[index] || 'from-[--color-primary]/20 to-[--color-accent]/20 text-[--color-primary]'} text-lg font-bold shadow-lg`}
                    >
                      {index < 3 ? rankIcons[index] : index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm text-[--color-foreground]">{user.name}</p>
                      <p className="mt-0.5 truncate text-xs text-[--color-mutedForeground]">
                        {user.email ?? user.telegramUsername ?? 'N/A'}
                      </p>
                      {user.referralCode && (
                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                          Ref: {user.referralCode}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">
                        {formatCurrency(user.totalEarned)}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                        earned
                      </p>
                      {user.totalInvested > 0 && (
                        <p className="mt-1 text-xs text-[--color-mutedForeground]">
                          Invested: {formatCurrency(user.totalInvested)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {!recentHighEarners.length && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-[--color-mutedForeground]" />
                <p className="text-sm font-medium text-[--color-foreground]">No earnings data yet</p>
                <p className="mt-1 text-xs text-[--color-mutedForeground]">
                  Top earners will appear here once users start earning
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Control Center */}
        <Card title="Control center" subtitle="Fine-grained controls for the account directory">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4">
              <div className="mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4 text-[--color-primary]" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                  Quick Actions
                </p>
              </div>
              <div className="space-y-2 text-xs text-[--color-mutedForeground]">
                <p className="flex items-start gap-2">
                  <span className="mt-0.5 text-[--color-primary]">•</span>
                  <span>Use filters to segment growth experiments, chase whales, or isolate risk.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="mt-0.5 text-[--color-primary]">•</span>
                  <span>Click column headers to sort ascending/descending.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="mt-0.5 text-[--color-primary]">•</span>
                  <span>Pagination keeps the table performant with large datasets.</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[--color-mutedForeground]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                    Total Results
                  </p>
                </div>
                <p className="text-xl font-bold text-[--color-foreground]">{totalRecords}</p>
                <p className="mt-1 text-[10px] text-[--color-mutedForeground]">accounts</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[--color-mutedForeground]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                    Total Pages
                  </p>
                </div>
                <p className="text-xl font-bold text-[--color-foreground]">{totalPages}</p>
                <p className="mt-1 text-[10px] text-[--color-mutedForeground]">pages</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                  Current View
                </p>
                <span className="rounded-full bg-[--color-primary]/20 px-2 py-0.5 text-[10px] font-semibold text-[--color-primary]">
                  {currentPage}/{totalPages}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[--color-mutedForeground]">Showing</span>
                <span className="font-semibold text-[--color-foreground]">
                  {pageRangeStart}-{pageRangeEnd || 0}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Accounts directory" subtitle="Paginated, sortable intelligence grid">
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
                of{' '}
                <span className="font-semibold text-[--color-foreground]">{totalRecords}</span> accounts
              </div>
              <div className="flex items-center gap-2">
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
                      <SortButton label="User" field="name" activeField={sortField} onSort={handleSort}>
                        {renderSortIcon('name')}
                      </SortButton>
                    </th>
                    <th className="min-w-[140px]">
                      <SortButton
                        label="Invested"
                        field="totalInvested"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('totalInvested')}
                      </SortButton>
                    </th>
                    <th className="min-w-[140px]">
                      <SortButton
                        label="Earned"
                        field="totalEarned"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('totalEarned')}
                      </SortButton>
                    </th>
                    <th className="min-w-[100px]">Status</th>
                    <th className="min-w-[100px]">Bonus</th>
                    <th className="min-w-[150px]">Referral</th>
                    <th className="min-w-[120px]">
                      <SortButton
                        label="Joined"
                        field="createdAt"
                        activeField={sortField}
                        onSort={handleSort}
                      >
                        {renderSortIcon('createdAt')}
                      </SortButton>
                    </th>
                    <th className="min-w-[140px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="transition-colors duration-150 hover:bg-white/5"
                    >
                      <td>
                        <UserIdentity user={user} />
                      </td>
                      <td>
                        <div className="text-sm leading-5">
                          <p className="font-semibold text-[--color-foreground]">
                            {formatCurrency(user.totalInvested)}
                          </p>
                          <p className="text-xs text-[--color-mutedForeground]">
                            Wallet {user.walletAddress ? user.walletAddress.slice(0, 8) + '…' : 'n/a'}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm leading-5">
                          <p className="font-semibold text-[--color-foreground]">
                            Earned: {formatCurrency(user.totalEarned)}
                          </p>
                          <p className="text-xs text-[--color-mutedForeground]">
                            Wallet: {formatCurrency(user.earningWallet)}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          data-tone={user.isActive ? 'success' : 'warning'}
                        >
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          data-tone={user.freeBonusReceived ? 'info' : 'muted'}
                        >
                          {user.freeBonusReceived ? 'Claimed' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <ReferralCell referrer={user.referredBy} />
                      </td>
                      <td>
                        <p className="text-sm">
                          {new Intl.DateTimeFormat('en', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }).format(new Date(user.createdAt))}
                        </p>
                        <p className="text-xs text-[--color-mutedForeground]">
                          {timeAgo(user.createdAt)}
                        </p>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            className="px-2.5 py-1.5 text-xs uppercase sm:px-3 sm:py-2"
                            icon={<ExternalLink className="h-3.5 w-3.5" />}
                            loading={isGeneratingToken}
                            onClick={() => handleLoginAsUser(user)}
                            title="Login as this user"
                          >
                            <span className="hidden sm:inline">Login</span>
                          </Button>
                          <Button
                            variant="ghost"
                            className="px-2.5 py-1.5 text-xs uppercase sm:px-3 sm:py-2"
                            loading={isUpdating}
                            onClick={() => handleStatusToggle(user._id, user.isActive)}
                          >
                            <span className="hidden sm:inline">{user.isActive ? 'Disable' : 'Activate'}</span>
                            <span className="sm:hidden">{user.isActive ? 'Off' : 'On'}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!users.length && !isFetching && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-sm text-[--color-mutedForeground]">
                        No users match this view. Adjust filters or search criteria.
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
          <option key={option.value} value={option.value} className="bg-[--color-card] text-[--color-foreground]">
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

const StatPill = ({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'success' | 'warning' | 'neutral';
}) => {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
      : tone === 'warning'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
        : 'border-white/10 bg-white/5 text-white';
  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.3em]">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.2em]">{hint}</p>
    </div>
  );
};

const UserIdentity = ({ user }: { user: AdminUser }) => (
  <div className="flex flex-col gap-1">
    <div className="flex flex-wrap items-center gap-x-2 text-sm">
      <span className="font-semibold">{user.name}</span>
      {user.telegramUsername && (
        <span className="text-xs text-[--color-mutedForeground]">@{user.telegramUsername}</span>
      )}
    </div>
    <span className="text-xs text-[--color-mutedForeground]">
      {user.email || 'No email on file'}
    </span>
    <span className="text-[10px] uppercase tracking-[0.3em] text-[--color-mutedForeground]">
      Chat ID {user.telegramChatId ?? '—'}
    </span>
    <span className="text-[10px] uppercase tracking-[0.3em] text-[--color-mutedForeground]">
      Ref {user.referralCode}
    </span>
  </div>
);

const ReferralCell = ({ referrer }: { referrer: AdminUser['referredBy'] }) => {
  if (!referrer) {
    return (
      <div className="text-xs">
        <p className="font-semibold uppercase tracking-[0.3em]">ORGANIC</p>
        <p className="text-[--color-mutedForeground]">No inviter</p>
      </div>
    );
  }

  if (typeof referrer === 'string') {
    return (
      <div className="text-xs">
        <p className="font-semibold uppercase tracking-[0.3em]">CODE {referrer}</p>
        <p className="text-[--color-mutedForeground]">Legacy referrer</p>
      </div>
    );
  }

  if (!isPopulatedReferrer(referrer)) {
    return (
      <div className="text-xs">
        <p className="font-semibold uppercase tracking-[0.3em]">UNKNOWN</p>
        <p className="text-[--color-mutedForeground]">No referrer metadata</p>
      </div>
    );
  }

  return (
    <div className="text-xs">
      <p className="font-semibold">{referrer.name}</p>
      <p className="text-[--color-mutedForeground]">
        {referrer.telegramUsername ? `@${referrer.telegramUsername}` : 'Chat'} · ID{' '}
        {referrer.telegramChatId ?? '—'}
      </p>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[--color-mutedForeground]">
        {referrer.referralCode}
      </p>
    </div>
  );
};

const isPopulatedReferrer = (
  referrer: AdminUser['referredBy']
): referrer is AdminUserReferrer =>
  typeof referrer === 'object' && referrer !== null && '_id' in referrer;

const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
};



