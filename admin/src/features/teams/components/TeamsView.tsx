"use client";

import { useMemo, useState, useEffect } from 'react';
import { UsersRound, Trophy, GitBranch } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetUsersQuery } from '@/features/users/api';
import type { AdminUser } from '@/features/users/types';

type TeamNode = {
  user: AdminUser;
  depth: number;
  children: TeamNode[];
};

const MAX_DEPTH = 4;

const getReferredById = (user: AdminUser) => {
  if (!user.referredBy) return null;
  if (typeof user.referredBy === 'string') return user.referredBy;
  return user.referredBy?._id ?? null;
};

const buildReferralGraph = (users: AdminUser[]) => {
  const graph = new Map<string, AdminUser[]>();
  users.forEach((user) => {
    const refId = getReferredById(user);
    if (!refId) return;
    if (!graph.has(refId)) {
      graph.set(refId, []);
    }
    graph.get(refId)?.push(user);
  });
  return graph;
};

const buildTeamTree = (
  leader: AdminUser | undefined,
  graph: Map<string, AdminUser[]>,
  depth = 1
): TeamNode[] => {
  if (!leader) return [];
  const children = graph.get(leader._id) ?? [];
  if (depth > MAX_DEPTH) return [];

  return children.map((child) => ({
    user: child,
    depth,
    children: buildTeamTree(child, graph, depth + 1),
  }));
};

// Memoized team size calculation to avoid repeated computations
const teamSizeCache = new Map<string, number>();

const calculateTeamSize = (leaderId: string, graph: Map<string, AdminUser[]>) => {
  // Return cached value if available
  if (teamSizeCache.has(leaderId)) {
    return teamSizeCache.get(leaderId)!;
  }

  let size = 0;
  const visited = new Set<string>();
  const stack = [...(graph.get(leaderId) ?? [])];
  
  while (stack.length) {
    const node = stack.pop();
    if (!node || visited.has(node._id)) continue;
    visited.add(node._id);
    size += 1;
    const children = graph.get(node._id) ?? [];
    stack.push(...children.filter(child => !visited.has(child._id)));
  }
  
  // Cache the result
  teamSizeCache.set(leaderId, size);
  return size;
};

export const TeamsView = () => {
  const { data, isLoading } = useGetUsersQuery({ limit: 100 });
  const users = useMemo(() => data?.data.users ?? [], [data]);

  const graph = useMemo(() => {
    // Clear cache when users change (new graph is being built)
    teamSizeCache.clear();
    return buildReferralGraph(users);
  }, [users]);

  const leaders = useMemo(() => {
    const referralCounts: Record<string, number> = {};
    graph.forEach((children, leaderId) => {
      referralCounts[leaderId] = children.length;
    });

    // Calculate team sizes more efficiently - limit to top candidates first
    const topCandidates = Object.entries(referralCounts)
      .map(([leaderId, directs]) => ({
        leaderId,
        directs,
        profile: users.find((u) => u._id === leaderId),
      }))
      .filter(item => item.profile) // Only include users that exist
      .sort((a, b) => (b.profile?.totalInvested ?? 0) - (a.profile?.totalInvested ?? 0)) // Sort by investment first as proxy
      .slice(0, 20); // Calculate team size for top 20 candidates only

    const leadersWithTeamSize = topCandidates.map(({ leaderId, directs, profile }) => ({
      id: leaderId,
      name: profile?.name ?? 'Unknown',
      directs,
      totalTeam: calculateTeamSize(leaderId, graph),
      investment: profile?.totalInvested ?? 0,
      earnings: profile?.totalEarned ?? 0,
    }));

    return leadersWithTeamSize
      .sort((a, b) => b.totalTeam - a.totalTeam)
      .slice(0, 8);
  }, [graph, users]);

  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLeaderId && leaders.length) {
      setSelectedLeaderId(leaders[0]?.id ?? null);
    }
  }, [leaders, selectedLeaderId]);

  const selectedLeader = useMemo(
    () => users.find((user) => user._id === selectedLeaderId),
    [selectedLeaderId, users]
  );

  const teamTree = useMemo(
    () => buildTeamTree(selectedLeader, graph),
    [graph, selectedLeader]
  );

  const levelCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    const stack = [...teamTree];
    while (stack.length) {
      const node = stack.pop();
      if (!node) continue;
      counts[node.depth] = (counts[node.depth] || 0) + 1;
      stack.push(...node.children);
    }
    return counts;
  }, [teamTree]);

  const deepestLevel = useMemo(() => {
    const levels = Object.keys(levelCounts).map(Number);
    return levels.length ? Math.max(...levels) : 0;
  }, [levelCounts]);

  return (
    <div className="space-y-6">
      <Card
        title="Network strata"
        subtitle="Dig into the referral tree, level by level."
        actions={
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
            <UsersRound size={14} />
            {users.length} wallets
          </div>
        }
      >
        {isLoading && <Skeleton className="mb-4 h-48 w-full" />}
        {leaders.length ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {leaders.map((leader, index) => (
              <button
                key={leader.id}
                onClick={() => setSelectedLeaderId(leader.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  leader.id === selectedLeaderId
                    ? 'border-[--color-primary] bg-[--color-primary]/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
                      Rank #{index + 1}
                    </p>
                    <p className="text-lg font-semibold text-[--color-foreground]">{leader.name}</p>
                    <p className="text-xs text-[--color-mutedForeground]">{leader.id}</p>
                  </div>
                  <Trophy className="h-6 w-6 text-[--color-warning]" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[--color-mutedForeground]">Level 1</p>
                    <p className="text-lg font-semibold">{leader.directs}</p>
                  </div>
                  <div>
                    <p className="text-[--color-mutedForeground]">Team size</p>
                    <p className="text-lg font-semibold">{leader.totalTeam}</p>
                  </div>
                  <div>
                    <p className="text-[--color-mutedForeground]">Invested</p>
                    <p className="font-semibold">${leader.investment.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[--color-mutedForeground]">Earned</p>
                    <p className="font-semibold">${leader.earnings.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          !isLoading && (
            <p className="text-center text-sm text-[--color-mutedForeground]">
              No team hierarchy detected yet.
            </p>
          )
        )}
      </Card>

      <Card
        title="Team explorer"
        subtitle="Tap a leader to drill down into their levels (up to 4 layers)."
        actions={
          selectedLeader && (
            <div className="flex items-center gap-3 text-sm">
              {Object.entries(levelCounts).map(([level, count]) => (
                <span key={level} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                  L{level}: {count}
                </span>
              ))}
            </div>
          )
        }
      >
        {!selectedLeader && (
          <p className="text-sm text-[--color-mutedForeground]">
            Select a leader above to visualize their team structure.
          </p>
        )}
        {selectedLeader && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
                    Leader
                  </p>
                  <p className="text-xl font-semibold text-[--color-foreground]">
                    {selectedLeader.name}
                  </p>
                  <p className="text-xs text-[--color-mutedForeground]">{selectedLeader._id}</p>
                </div>
                <div className="rounded-full border border-white/10 px-4 py-2 text-sm">
                  Total referrals: {calculateTeamSize(selectedLeader._id, graph)}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <p className="text-[--color-mutedForeground]">Email</p>
                  <p className="font-semibold">{selectedLeader.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[--color-mutedForeground]">Referral code</p>
                  <p className="font-semibold">{selectedLeader.referralCode}</p>
                </div>
                <div>
                  <p className="text-[--color-mutedForeground]">Invested</p>
                  <p className="font-semibold">${selectedLeader.totalInvested.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[--color-mutedForeground]">Earned</p>
                  <p className="font-semibold">${selectedLeader.totalEarned.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-sm text-[--color-mutedForeground]">
                <GitBranch size={16} />
                Nested team view (Level 1 → Level {deepestLevel ? Math.min(MAX_DEPTH, deepestLevel) : 1})
              </div>
              <div className="mt-4">
                {teamTree.length ? (
                  <ul className="space-y-3">
                    {teamTree.map((node) => (
                      <TeamBranch key={node.user._id} node={node} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[--color-mutedForeground]">
                    No direct referrals found for this leader.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const TeamBranch = ({ node }: { node: TeamNode }) => {
  return (
    <li className="rounded-2xl border border-white/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[--color-foreground]">
            L{node.depth} · {node.user.name || 'Unknown'}
          </p>
          <p className="text-xs text-[--color-mutedForeground]">{node.user.email ?? node.user._id}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-white/10 px-3 py-1">
            Invested ${node.user.totalInvested.toLocaleString()}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1">
            Earned ${node.user.totalEarned.toLocaleString()}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1">
            Directs {(node.children?.length ?? 0) > 0 ? node.children.length : 0}
          </span>
        </div>
      </div>
      {node.children.length > 0 && (
        <ul className="mt-3 space-y-3 border-l border-white/10 pl-4">
          {node.children.map((child) => (
            <TeamBranch key={child.user._id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
};
