"use client";

import { TrendingUp } from 'lucide-react';
import { IncomeBoardBase, SortButton } from './shared/IncomeBoardBase';
import type { Income, IncomeStatus } from '@/features/income/types';

export const DailyROIBoard = () => {
  return (
    <IncomeBoardBase
      incomeType="daily_roi"
      title="Daily ROI Management"
      subtitle="Track and manage all daily ROI income from investments."
      statsCard={(totals, totalRecords, formatCurrency) => {
        const avgRoi = totalRecords ? totals.totalAmount / totalRecords : 0;
        const topLevel = totals.levelStats?.[0];
        return (
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4">
            <div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[--color-mutedForeground]">
              <TrendingUp className="h-4 w-4 text-[--color-primary]" />
              Snapshot
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <SnapshotChip label="Total ROI" value={formatCurrency(totals.totalAmount)} />
              <SnapshotChip label="Records" value={totalRecords.toString()} />
              <SnapshotChip label="Avg / rec" value={formatCurrency(avgRoi)} />
              {topLevel && (
                <SnapshotChip
                  label={`Level ${topLevel._id}`}
                  value={`${topLevel.count} rec`}
                />
              )}
              <SnapshotChip label="Max Wallet" value={formatCurrency(totals.levelStats?.[0]?.totalAmount || totals.totalAmount)} />
            </div>
          </div>
        );
      }}
      tableColumns={({ sortField, handleSort, renderSortIcon }) => (
        <>
          <th className="min-w-[200px] text-left text-xs uppercase tracking-[0.15em] text-[--color-mutedForeground]">
            User
          </th>
          <th className="min-w-[180px] text-left text-xs uppercase tracking-[0.15em] text-[--color-mutedForeground]">
            Investment Plan
          </th>
          <th className="min-w-[140px] text-left">
            <SortButton
              label="Investment Amount"
              field="amount"
              activeField={sortField}
              onSort={handleSort}
            >
              {renderSortIcon('amount')}
            </SortButton>
          </th>
          <th className="min-w-[140px] text-left">
            <SortButton
              label="ROI Amount"
              field="amount"
              activeField={sortField}
              onSort={handleSort}
            >
              {renderSortIcon('amount')}
            </SortButton>
          </th>
          <th className="min-w-[150px] text-left text-xs uppercase tracking-[0.15em] text-[--color-mutedForeground]">
            Description
          </th>
          <th className="min-w-[120px] text-left text-xs uppercase tracking-[0.15em] text-[--color-mutedForeground]">
            Status
          </th>
          <th className="min-w-[150px] text-left">
            <SortButton
              label="Income Date"
              field="incomeDate"
              activeField={sortField}
              onSort={handleSort}
            >
              {renderSortIcon('incomeDate')}
            </SortButton>
          </th>
        </>
      )}
      renderRow={(income, formatCurrency, formatDate, timeAgo, getStatusBadge) => {
        const userName = income.user?.name || income.user?.email || 'Unknown';
        const userChatId = income.user?.telegramChatId;
        const userIdentifier = income.user?.telegramUsername
          ? `@${income.user?.telegramUsername}`
          : userChatId
            ? `Chat ID ${userChatId}`
            : income.user?.email || 'No contact';
        const userTelegram = income.user?.telegramUsername;
        const investmentAmount = income.investment?.amount || 0;
        const planName = income.investment?.plan?.name || 'N/A';
        const planDailyROI = income.investment?.plan?.dailyROI || 0;
        const planTermDays = income.investment?.plan?.termDays;
        const planDurationLabel =
          typeof planTermDays === 'number' && planTermDays > 0
            ? `${planTermDays} days`
            : 'Duration pending';

        return (
          <tr key={income._id} className="transition-colors duration-150 hover:bg-white/5">
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
                <span className="text-xs text-[--color-mutedForeground]">{userIdentifier}</span>
              </div>
            </td>
            <td>
              {income.investment?.plan ? (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[--color-foreground]">
                    {planName}
                  </span>
                  <div className="flex gap-2 text-xs text-[--color-mutedForeground]">
                    <span>{planDailyROI}% ROI</span>
                    <span>•</span>
                    <span>{planDurationLabel}</span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[--color-mutedForeground]">N/A</span>
              )}
            </td>
            <td>
              <div className="text-sm leading-5">
                <p className="font-semibold text-[--color-foreground]">
                  {formatCurrency(investmentAmount)}
                </p>
                {income.investment?._id && (
                  <p className="text-xs text-[--color-mutedForeground]">
                    ID: {String(income.investment._id).slice(-8)}
                  </p>
                )}
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
          </tr>
        );
      }}
    />
  );
};

const SnapshotChip = ({ label, value }: { label: string; value: string }) => (
  <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-[--color-mutedForeground]">
    <span>{label}</span>
    <span className="text-[--color-foreground]">{value}</span>
  </div>
);

