"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Search, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useGetDepositsQuery,
  useGetPendingDepositsCountQuery,
  useUpdateDepositStatusMutation,
} from "@/features/deposits/api";
import type { Deposit, DepositStatus, DepositUser } from "@/features/deposits/types";

const statusFilters: Array<DepositStatus | "all"> = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "failed",
  "cancelled",
];

const pageSizeOptions = [10, 20, 50];

const normalizeDepositUser = (user: Deposit["user"]): DepositUser =>
  typeof user === "string" ? { name: user } : user;

export const DepositsView = () => {
  const [statusFilter, setStatusFilter] = useState<DepositStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryParams = useMemo(
    () => ({
      status: statusFilter !== "all" ? statusFilter : undefined,
      limit: pageSize,
      skip: (page - 1) * pageSize,
    }),
    [page, pageSize, statusFilter]
  );

  const { data, isLoading, isFetching, refetch } = useGetDepositsQuery(queryParams);
  const { data: pendingData } = useGetPendingDepositsCountQuery();
  const [updateDeposit, { isLoading: isUpdating }] = useUpdateDepositStatusMutation();

  const deposits = data?.deposits ?? [];
  const totalRecords = data?.total ?? deposits.length;

  const filteredDeposits = useMemo(() => {
    if (!searchTerm) return deposits;
    const lowered = searchTerm.toLowerCase();
    return deposits.filter((deposit) => {
      const user = normalizeDepositUser(deposit.user);
      return (
        deposit.walletAddress?.toLowerCase().includes(lowered) ||
        deposit.transactionHash?.toLowerCase().includes(lowered) ||
        user?.name?.toLowerCase().includes(lowered) ||
        user?.email?.toLowerCase().includes(lowered) ||
        user?.referralCode?.toLowerCase().includes(lowered)
      );
    });
  }, [deposits, searchTerm]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? filteredDeposits.length) / pageSize));

  const handleStatusChange = async (deposit: Deposit, nextStatus: DepositStatus) => {
    if (deposit.status === nextStatus) return;
    try {
      await updateDeposit({
        id: deposit._id,
        body: { status: nextStatus, adminNote: "Updated via deposits view" },
      }).unwrap();
      toast.success(`Deposit moved to ${nextStatus}`);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Failed to update status");
    }
  };

  const handlePageChange = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
  };

  const handleFilterChange = (next: DepositStatus | "all") => {
    setStatusFilter(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
          Capital inflows
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-[--color-foreground]">Deposits console</h1>
          <Button
            type="button"
            variant="ghost"
            icon={<RefreshCw size={16} />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Refresh feed
          </Button>
        </div>
        <p className="text-sm text-[--color-mutedForeground]">
          Review every deposit, update statuses, and slice by user or network information.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
            Pending reviews
          </p>
          <p className="mt-2 text-3xl font-semibold text-[--color-foreground]">
            {pendingData?.count ?? "—"}
          </p>
          <p className="text-xs text-[--color-mutedForeground]">Awaiting manual action</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
            Showing
          </p>
          <p className="mt-2 text-3xl font-semibold text-[--color-foreground]">
            {filteredDeposits.length}
          </p>
          <p className="text-xs text-[--color-mutedForeground]">
            Of {totalRecords.toLocaleString()} records
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
            Current filter
          </p>
          <p className="mt-2 text-xl font-semibold capitalize text-[--color-foreground]">
            {statusFilter}
          </p>
          <p className="text-xs text-[--color-mutedForeground]">Server-side filter</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
            Page
          </p>
          <p className="mt-2 text-3xl font-semibold text-[--color-foreground]">
            {page} / {totalPages}
          </p>
          <p className="text-xs text-[--color-mutedForeground]">Page size {pageSize}</p>
        </Card>
      </div>

      <Card
        title="Filters"
        subtitle="Combine server filters with instant text search."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-mutedForeground]"
                size={14}
              />
              <input
                type="search"
                placeholder="Search wallet, hash, user..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                className="w-64 rounded-full border border-white/10 bg-transparent pl-9 pr-3 py-2 text-sm text-[--color-foreground] placeholder:text-[--color-mutedForeground] focus:border-[--color-primary] focus:outline-none"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              icon={<Filter size={16} />}
              onClick={() => {
                setStatusFilter("all");
                setSearchTerm("");
                setPage(1);
                setPageSize(20);
                refetch();
              }}
            >
              Clear
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((item) => (
            <Button
              key={item}
              type="button"
              variant={statusFilter === item ? "primary" : "ghost"}
              className="px-4 py-2 text-xs capitalize"
              onClick={() => handleFilterChange(item)}
            >
              {item}
            </Button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
              Page size
            </label>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-sm text-[--color-foreground] focus:border-[--color-primary]"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card
        title="Deposits ledger"
        subtitle="Complete view with pagination, inline status changes, and search."
      >
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="scroll-area">
            <table className="table-grid min-w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Network</th>
                  <th>Wallet</th>
                  <th>Tx hash</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredDeposits.map((deposit) => {
                  const user = normalizeDepositUser(deposit.user);
                  return (
                    <tr key={deposit._id}>
                      <td>
                        <div className="text-sm font-medium text-[--color-foreground]">
                          {user?.name || user?.email || user?._id}
                        </div>
                        <p className="text-xs text-[--color-mutedForeground]">
                          {user?.email ?? user?.referralCode ?? "—"}
                        </p>
                      </td>
                      <td className="text-sm font-semibold">
                        ${deposit.amount.toLocaleString()} {deposit.currency}
                      </td>
                      <td>
                        <div className="text-sm">{deposit.network}</div>
                        <p className="text-xs text-[--color-mutedForeground]">
                          {deposit.description ?? "—"}
                        </p>
                      </td>
                      <td className="break-all text-xs">{deposit.walletAddress}</td>
                      <td className="break-all text-xs">
                        {deposit.transactionHash ?? (
                          <span className="text-[--color-mutedForeground]">N/A</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="badge capitalize"
                          data-tone={
                            deposit.status === "completed"
                              ? "success"
                              : deposit.status === "pending"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {deposit.status}
                        </span>
                      </td>
                      <td className="text-xs">
                        {new Date(deposit.updatedAt).toLocaleString()}
                      </td>
                      <td className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {statusFilters
                            .filter((status): status is DepositStatus => status !== "all")
                            .map((status) => (
                              <Button
                                key={status}
                                type="button"
                                variant="ghost"
                                className="px-3 py-1 text-xs capitalize"
                                disabled={deposit.status === status}
                                loading={isUpdating}
                                onClick={() => handleStatusChange(deposit, status)}
                              >
                                {status}
                              </Button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredDeposits.length && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-sm text-[--color-mutedForeground]"
                    >
                      No deposits found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[--color-mutedForeground]">
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, data?.total ?? filteredDeposits.length)} of{" "}
            {data?.total?.toLocaleString() ?? filteredDeposits.length} records
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => handlePageChange(page - 1)}>
              Previous
            </Button>
            <span className="text-sm text-[--color-mutedForeground]">
              Page {page} of {totalPages}
            </span>
            <Button type="button" variant="ghost" onClick={() => handlePageChange(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};


