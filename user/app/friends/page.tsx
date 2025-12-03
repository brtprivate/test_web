/**
 * Friends Page (Referrals)
 * Shows referral statistics, referral link, and team level structure
 */

'use client';

import { Fragment, useState, KeyboardEvent } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useReferrals, useReferralsList, useLevelWiseStats } from '@/features/referrals/hooks/useReferrals';
import { useUser } from '@/features/users/hooks/useUser';
import { LevelUser, LevelWiseStat, useLazyGetLevelUsersQuery } from '@/features/referrals/api/referralsApi';

type TeamLevel = Pick<LevelWiseStat, 'level' | 'commission' | 'userCount' | 'purchaseAmount' | 'reward'>;

const LEVEL_USERS_FETCH_LIMIT = 100;

export default function FriendsPage() {
  const { stats, isLoading: isStatsLoading } = useReferrals();
  const { referrals, total, isLoading: isListLoading } = useReferralsList({ limit: 20 });
  const { levels: levelWiseStats, isLoading: isLevelWiseLoading } = useLevelWiseStats({ maxLevels: 10 });
  const { user } = useUser();
  const [fetchLevelUsers, { isFetching: isLevelUsersFetching }] = useLazyGetLevelUsersQuery();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [levelUsersCache, setLevelUsersCache] = useState<Record<number, { users: LevelUser[]; total: number }>>({});
  const [levelUsersError, setLevelUsersError] = useState<{ level: number; message: string } | null>(null);

  // Generate referral link
  const botUrl = process.env.NEXT_PUBLIC_BOT_URL || 'https://t.me/testing_new_ai_bot';
  const referralLink = user?.referralCode
    ? `${botUrl}?start=${user.referralCode}`
    : '';

  // Copy referral link
  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Share referral link
  const handleShare = async () => {
    if (referralLink) {
      const shareText = referralLink;
      if (navigator.share) {
        try {
          await navigator.share({ text: shareText });
          setShared(true);
          setTimeout(() => setShared(false), 2000);
        } catch (err) {
          // User cancelled or error
        }
      } else {
        navigator.clipboard.writeText(shareText);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    }
  };

  const handleLevelSelect = async (levelData: TeamLevel) => {
    if (selectedLevel === levelData.level) {
      setSelectedLevel(null);
      if (levelUsersError?.level === levelData.level) {
        setLevelUsersError(null);
      }
      return;
    }

    setSelectedLevel(levelData.level);
    setLevelUsersError(null);

    if (levelUsersCache[levelData.level]) {
      return;
    }

    if (levelData.userCount === 0) {
      setLevelUsersCache((prev) => ({
        ...prev,
        [levelData.level]: { users: [], total: 0 },
      }));
      return;
    }

    try {
      const response = await fetchLevelUsers({ level: levelData.level, limit: LEVEL_USERS_FETCH_LIMIT }).unwrap();
      const users = response.data?.users ?? [];
      const totalCount = response.total ?? response.data?.users?.length ?? levelData.userCount;

      setLevelUsersCache((prev) => ({
        ...prev,
        [levelData.level]: {
          users,
          total: totalCount,
        },
      }));
    } catch (error: any) {
      const message = error?.data?.message || 'Unable to load level members. Please try again.';
      setLevelUsersError({
        level: levelData.level,
        message,
      });
    }
  };

  const handleCloseLevelDetails = () => {
    if (selectedLevel === null) {
      return;
    }

    const closingLevel = selectedLevel;
    setSelectedLevel(null);
    setLevelUsersError((prev) => (prev?.level === closingLevel ? null : prev));
  };

  const handleLevelKeyPress = (
    event: KeyboardEvent<HTMLTableRowElement | HTMLDivElement>,
    levelData: TeamLevel
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLevelSelect(levelData);
    }
  };

  const getUserInitial = (member: LevelUser): string => {
    const source = member.name || member.telegramFirstName || member.telegramUsername || member.telegramLastName || 'F';
    return source.charAt(0).toUpperCase();
  };

  const renderLevelMembersContent = (levelNumber: number, fallbackCount: number) => {
    const cached = levelUsersCache[levelNumber];
    const errorMessage = levelUsersError?.level === levelNumber ? levelUsersError.message : null;
    const isLoadingSelectedLevel = isLevelUsersFetching && selectedLevel === levelNumber && !cached && !errorMessage;

    if (isLoadingSelectedLevel) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      );
    }

    if (cached) {
      if (cached.total === 0) {
        return (
          <div className="text-center py-6 text-sm text-gray-500">
            No members in this level yet. Invite more friends to grow your network!
          </div>
        );
      }

      return (
        <>
          <div className="space-y-3">
            {cached.users.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-purple-100 bg-white shadow-sm"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {getUserInitial(member)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {member.name ||
                        [member.telegramFirstName, member.telegramLastName].filter(Boolean).join(' ').trim() ||
                        member.telegramUsername ||
                        'Friend'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      {member.referralCode && (
                        <span className="font-mono text-purple-600 bg-purple-100/60 px-2 py-0.5 rounded-full">
                          {member.referralCode}
                        </span>
                      )}
                      <span className="text-gray-400">
                        Joined: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-purple-600">
                    ${Number(member.totalInvested ?? 0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-gray-500">Total Invested</p>
                </div>
              </div>
            ))}
          </div>
          {cached.total > cached.users.length && (
            <p className="text-xs text-gray-500 text-center mt-3">
              Showing first {cached.users.length} of {cached.total.toLocaleString()} members
            </p>
          )}
        </>
      );
    }

    return (
      <div className="text-center py-6 text-sm text-gray-500">
        {fallbackCount === 0
          ? 'No members in this level yet. Invite more friends to grow your network!'
          : 'Loading level members...'}
      </div>
    );
  };

  // Calculate total potential earnings
  const totalPotentialEarnings = stats?.totalEarnings ?? stats?.totalEarned ?? 0;
  const pendingBonus = 0; // Will be populated from API

  // Team levels data - use API data if available, otherwise use defaults
  const teamLevels: TeamLevel[] = levelWiseStats.length > 0
    ? levelWiseStats.map(level => ({
      level: level.level,
      commission: level.commission,
      userCount: level.userCount,
      purchaseAmount: level.purchaseAmount,
      reward: level.reward,
    }))
    : Array.from({ length: 10 }, (_, i) => ({
      level: i + 1,
      commission: 1,
      userCount: 0,
      purchaseAmount: 0,
      reward: 0,
    }));

  // Calculate total team stats
  const totalTeamUsers = teamLevels.reduce((sum, level) => sum + level.userCount, 0);
  const totalTeamPurchase = teamLevels.reduce((sum, level) => sum + level.purchaseAmount, 0);
  const totalTeamReward = teamLevels.reduce((sum, level) => sum + level.reward, 0);

  // Selected level derived data for the detail card
  const selectedLevelData = selectedLevel !== null ? teamLevels.find((level) => level.level === selectedLevel) : null;
  const levelUsersList = selectedLevel !== null ? levelUsersCache[selectedLevel]?.users ?? [] : [];
  const levelUsersTotal =
    selectedLevel !== null
      ? levelUsersCache[selectedLevel]?.total ?? selectedLevelData?.userCount ?? 0
      : 0;

  return (
    <MobileLayout showBottomNav={true}>
      <div className="space-y-4 sm:space-y-6">
        {/* New Referral and Earn Banner */}
        <div className="bg-[#6200EA] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg">
          {/* Badge */}
          <div className="absolute top-0 right-0">
            <div className="bg-[#5E5CE6] rounded-bl-3xl px-4 py-2 flex flex-col items-center justify-center shadow-md border-b border-l border-white/10">
              <span className="text-2xl mb-1">📢</span>
              <span className="text-[10px] font-bold leading-none text-center">LIMITED<br />OFFER</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-6 mt-2">Referral and Earn</h1>

          {/* Content */}
          <div className="space-y-6">
            <p className="font-bold text-lg leading-snug">
              Direct Bonus: Earn $15 instantly when your invitee invests $50-$1,000. For $1,001 and above you get 5% of their deposit. Plus, every new investment flowing through your network pays you a one-time 2% level income for 10 levels.
            </p>

            <p className="text-sm leading-relaxed opacity-90">
              Example: You invite Jamie → Jamie invests $600 → you receive $15. When Jamie later invests $1,200, you receive $60 (5%). As Jamie’s team grows, each new investment across 10 levels auto-rewards you with 2% of that amount.
            </p>
          </div>
        </div>

        {/* Quick Stats Summary - New */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">👥</span>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                  <p className="text-xs opacity-90">Referrals</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">💰</span>
                <div className="text-right">
                  <p className="text-2xl font-bold">${totalPotentialEarnings.toFixed(0)}</p>
                  <p className="text-xs opacity-90">Earned</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">⭐</span>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.activeReferrals}</p>
                  <p className="text-xs opacity-90">Active</p>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Referral Link Card - New Design */}
        {user?.referralCode && (
          <div className="space-y-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-white">Your Referral Link</h2>
            <div className="border-2 border-dashed border-white/80 rounded-xl p-4 relative bg-white/10 backdrop-blur-sm">
              <div className="flex flex-col gap-2 pr-16">
                <p className="text-xs text-white/90 font-mono break-all">
                  {referralLink}
                </p>
              </div>

              {/* Copy Button */}
              <div className="absolute right-0 top-0 bottom-0 w-16 flex flex-col items-center justify-center border-l-2 border-dashed border-white/80">
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-1 text-white hover:opacity-80 transition-opacity"
                >
                  {copied ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[10px] font-bold">COPIED</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px] font-bold">COPY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Stats Card */}
        {isStatsLoading ? (
          <Card>
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 rounded-lg w-2/3"></div>
              <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
            </div>
          </Card>
        ) : stats ? (
          <Card>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Referral Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {stats.totalReferrals}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Referrals</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  ${(stats.totalEarnings ?? stats.totalEarned ?? 0).toFixed(2)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Earnings</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Active Referrals:</span>
                <Badge variant="success">{stats.activeReferrals}</Badge>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Team Levels Summary - New */}
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-medium text-white/90 mb-2">Total Team Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold">{totalTeamUsers.toLocaleString()}</p>
                  <p className="text-xs text-white/80">Total Users</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalTeamPurchase.toFixed(2)}</p>
                  <p className="text-xs text-white/80">Total Purchase</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalTeamReward.toFixed(2)}</p>
                  <p className="text-xs text-white/80">Total Reward</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Team Levels Table - All 10 Levels - Enhanced */}
        {/* Team Levels Table - New Design */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Team Level Income
            </h2>
            <div className="px-3 py-1 bg-purple-100 rounded-full">
              <span className="text-xs font-bold text-purple-600">10 Levels</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-4 mb-6 text-sm font-medium text-gray-400 border-b border-gray-200/60 pb-4">
              <div className="text-center">Sub-Level</div>
              <div className="text-center">User count</div>
              <div className="text-center">Purchase amount</div>
              <div className="text-center">Your Reward</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-4">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((levelNum) => {
                // Find stats for this level from the teamLevels array
                const levelData = teamLevels.find(l => l.level === levelNum);
                const stats = {
                  count: levelData?.userCount || 0,
                  volume: levelData?.purchaseAmount || 0,
                  reward: levelData?.reward || 0
                };
                const isExpanded = selectedLevel === levelNum;

                return (
                  <div key={levelNum} className="border-b border-gray-200/60 last:border-0 pb-4 last:pb-0">
                    <div
                      onClick={() => handleLevelSelect(levelData || { level: levelNum, userCount: 0, purchaseAmount: 0, reward: 0, commission: 0 })}
                      className="grid grid-cols-4 items-center cursor-pointer hover:bg-purple-200/30 rounded-lg transition-colors py-1"
                    >
                      <div className="text-center font-medium text-gray-800">{levelNum}</div>
                      <div className="flex items-center justify-center gap-1 text-gray-800 font-medium">
                        {stats.count}
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-gray-800 font-medium">
                        {stats.volume}
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-center font-medium text-[#00BFA5]">
                        ${stats.reward}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-2 pl-4 pr-2 py-2 bg-white/50 rounded-lg">
                        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                          <span>Members in Level {levelNum}</span>
                          <span>{levelUsersCache[levelNum]?.total ?? stats.count} total</span>
                        </div>
                        {renderLevelMembersContent(levelNum, stats.count)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selectedLevel !== null && (
          <Card className="shadow-lg border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">🧑‍🤝‍🧑</span>
                  Level {selectedLevel} Members
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {levelUsersTotal.toLocaleString()} member{levelUsersTotal === 1 ? '' : 's'} in this level
                </p>
              </div>
              <button
                onClick={handleCloseLevelDetails}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Close
              </button>
            </div>

            {levelUsersError?.level === selectedLevel && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                {levelUsersError.message}
              </div>
            )}

            {isLevelUsersFetching ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse"></div>
                ))}
              </div>
            ) : levelUsersTotal === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No members in this level yet. Invite more friends to grow your network!
              </div>
            ) : levelUsersList.length > 0 ? (
              <div className="space-y-3">
                {levelUsersList.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gradient-to-r from-white via-purple-50/40 to-white shadow-sm"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {getUserInitial(member)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                          {member.name ||
                            [member.telegramFirstName, member.telegramLastName].filter(Boolean).join(' ').trim() ||
                            member.telegramUsername ||
                            'Friend'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          {member.referralCode && (
                            <span className="font-mono text-purple-600 bg-purple-100/60 px-2 py-0.5 rounded-full">
                              {member.referralCode}
                            </span>
                          )}
                          <span className="text-gray-400">
                            Joined: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-purple-600">
                        ${Number(member.totalInvested ?? 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Total Invested</p>
                    </div>
                  </div>
                ))}
                {levelUsersTotal > levelUsersList.length && (
                  <p className="text-xs text-gray-500 text-center">
                    Showing first {levelUsersList.length} of {levelUsersTotal.toLocaleString()} members
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                Members could not be loaded. Please try again.
              </div>
            )}
          </Card>
        )}

        {/* Referrals List - Enhanced */}
        <Card className="shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Your Direct Referrals
            </h2>
            {total > 0 && (
              <Badge variant="primary" className="text-sm font-bold">
                {total} {total === 1 ? 'Friend' : 'Friends'}
              </Badge>
            )}
          </div>

          {isListLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral: any, index: number) => (
                <div
                  key={referral.id || referral._id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-white via-purple-50/50 to-white rounded-xl border-2 border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(referral.name || referral.user?.name || 'F')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {referral.name || referral.user?.name || 'Friend'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                        <span>📅</span>
                        Joined: {new Date(referral.createdAt || referral.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm" className="font-semibold">
                    ✓ Active
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">👥</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Referrals Yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-sm mx-auto">
                Start inviting friends and earn rewards! Share your referral link to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleShare}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
                >
                  <span className="mr-2">🚀</span>
                  Share Referral Link
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCopyLink}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <span className="mr-2">📋</span>
                  Copy Link
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div >
    </MobileLayout >
  );
}




