import { OverviewStats } from "@/features/dashboard/components/OverviewStats";
import { PerformanceTrends } from "@/features/dashboard/components/PerformanceTrends";
import { RecentDeposits } from "@/features/dashboard/components/RecentDeposits";
import { RiskAlerts } from "@/features/dashboard/components/RiskAlerts";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <OverviewStats />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <PerformanceTrends />
        <RiskAlerts />
      </div>
      <RecentDeposits />
    </div>
  );
}




