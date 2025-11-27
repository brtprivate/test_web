"use client";

import { Layers, TrendingUp, DollarSign } from 'lucide-react';
import { IncomeBoardBase } from './shared/IncomeBoardBase';
import type { Income, IncomeStatus } from '@/features/income/types';

export const TeamLevelsBoard = () => {
  const renderRow = (
    income: Income,
    formatCurrency: (value: number) => string,
    formatDate: (date: string) => string,
    timeAgo: (date: string) => string,
    getStatusBadge: (status: IncomeStatus) => React.ReactNode
  ) => {
    const userName = income.user?.name || income.user?.email || 'Unknown';
    const userEmail = income.user?.email || 'No email';
    const userTelegram = income.user?.telegramUsername;
    const userChatId = income.user?.telegramChatId;

    // Source user (who invested) - from referenceId for team_income
    const sourceUserName = income.referredUser?.name || income.referredUser?.email || 'N/A';
    const sourceUserEmail = income.referredUser?.email || '';
    const sourceUserTelegram = income.referredUser?.telegramUsername;
    const sourceUserChatId = income.referredUser?.telegramChatId;
    const investmentAmount = income.referredUser?.totalInvested || 0;

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
            <span className="font-mono text-xs text-[--color-mutedForeground]">
              Chat ID: {userChatId ?? 'N/A'}
            </span>
          </div>
        </td>
        <td>
          {income.referredUser ? (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-2 text-sm">
                <span className="font-semibold text-[--color-foreground]">{sourceUserName}</span>
                {sourceUserTelegram && (
                  <span className="text-xs text-[--color-mutedForeground]">
                    @{sourceUserTelegram}
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-[--color-mutedForeground]">
                Chat ID: {sourceUserChatId ?? 'N/A'}
              </span>
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
            <p className="text-xs text-[--color-mutedForeground]">
              Total invested
            </p>
          </div>
        </td>
        <td>
          {income.level ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold">
              <Layers className="h-3 w-3" />
              Level {income.level}
            </span>
          ) : (
            <span className="text-xs text-[--color-mutedForeground]">N/A</span>
          )}
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
  };

  return (
    <IncomeBoardBase
      incomeType="team_income"
      title="Team Levels Management"
      subtitle="Track and manage all team income by levels (Level 1-9)."
      showLevelFilter={true}
      statsCard={(totals, totalRecords, formatCurrency) => (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-4 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                  Total Level Income
                </p>
                <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                  {formatCurrency(totals.totalAmount)}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                  <DollarSign className="h-3 w-3" />
                  <span>All levels</span>
                </div>
              </div>
              <div className="rounded-xl bg-purple-500/20 p-2.5">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                  Active Levels
                </p>
                <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                  {totals.levelStats.length}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-[--color-mutedForeground]">
                  <Layers className="h-3 w-3" />
                  <span>Level 1-9</span>
                </div>
              </div>
              <div className="rounded-xl bg-blue-500/20 p-2.5">
                <Layers className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-[--color-foreground] md:text-3xl">
                  {totalRecords}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/20 p-2.5">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      )}
      tableColumns={
        <>
          <th className="min-w-[200px]">User (Income Receiver)</th>
          <th className="min-w-[200px]">Source User (Investor)</th>
          <th className="min-w-[140px]">Investment Amount</th>
          <th className="min-w-[100px]">Level</th>
          <th className="min-w-[140px]">Team Income</th>
          <th className="min-w-[150px]">Description</th>
          <th className="min-w-[120px]">Status</th>
          <th className="min-w-[150px]">Income Date</th>
        </>
      }
      renderRow={renderRow}
    />
  );
};

