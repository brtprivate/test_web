"use client";

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ExternalLink,
  Users,
  DollarSign,
  Wallet,
  X,
  Edit,
  Save,
  XCircle,
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

  // Inline editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    email: string;
    telegramUsername: string;
  }>({ name: '', email: '', telegramUsername: '' });

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

  const handleEditClick = (user: AdminUser) => {
    setEditingUserId(user._id);
    setEditFormData({
      name: user.name,
      email: user.email || '',
      telegramUsername: user.telegramUsername || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({ name: '', email: '', telegramUsername: '' });
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      // Validate required fields
      if (!editFormData.name.trim()) {
        toast.error('Name is required');
        return;
      }

      await updateUser({
        id: userId,
        body: {
          name: editFormData.name.trim(),
          email: editFormData.email.trim() || undefined,
          telegramUsername: editFormData.telegramUsername.trim() || undefined,
        },
      }).unwrap();

      toast.success('User updated successfully');
      setEditingUserId(null);
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
        className={`h-3.5 w-3.5 text-[--color-primary] ${sortDirection === 'asc' ? 'rotate-180' : ''
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
        <div className="space-y-4">
          {/* Filters Section */}
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]">
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

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
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
        </div>
      </Card>

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
                        {editingUserId === user._id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, name: e.target.value })
                              }
                              className="w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-sm text-[--color-foreground] outline-none focus:border-[--color-primary] focus:ring-1 focus:ring-[--color-primary]"
                              placeholder="Name"
                            />
                            <input
                              type="email"
                              value={editFormData.email}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, email: e.target.value })
                              }
                              className="w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-sm text-[--color-foreground] outline-none focus:border-[--color-primary] focus:ring-1 focus:ring-[--color-primary]"
                              placeholder="Email"
                            />
                            <input
                              type="text"
                              value={editFormData.telegramUsername}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, telegramUsername: e.target.value })
                              }
                              className="w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-sm text-[--color-foreground] outline-none focus:border-[--color-primary] focus:ring-1 focus:ring-[--color-primary]"
                              placeholder="Telegram Username"
                            />
                          </div>
                        ) : (
                          <UserIdentity user={user} />
                        )}
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
                          {editingUserId === user._id ? (
                            <>
                              <Button
                                variant="ghost"
                                className="px-2.5 py-1.5 text-xs uppercase sm:px-3 sm:py-2"
                                icon={<Save className="h-3.5 w-3.5" />}
                                loading={isUpdating}
                                onClick={() => handleSaveEdit(user._id)}
                                title="Save changes"
                              >
                                <span className="hidden sm:inline">Save</span>
                              </Button>
                              <Button
                                variant="ghost"
                                className="px-2.5 py-1.5 text-xs uppercase sm:px-3 sm:py-2"
                                icon={<XCircle className="h-3.5 w-3.5" />}
                                onClick={handleCancelEdit}
                                title="Cancel editing"
                              >
                                <span className="hidden sm:inline">Cancel</span>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                className="px-2.5 py-1.5 text-xs uppercase sm:px-3 sm:py-2"
                                icon={<Edit className="h-3.5 w-3.5" />}
                                onClick={() => handleEditClick(user)}
                                title="Edit user details"
                              >
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
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
                            </>
                          )}
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
  <label className="flex flex-col gap-1.5">
    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-[--color-mutedForeground]">
      {label}
    </span>
    <div className="relative rounded-xl border border-white/10 bg-white/5 transition-all hover:border-white/20 focus-within:border-[--color-primary] focus-within:ring-2 focus-within:ring-[--color-primary]/20">
      <select
        className="w-full appearance-none bg-transparent px-3 py-2 text-sm font-medium text-[--color-foreground] outline-none"
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



