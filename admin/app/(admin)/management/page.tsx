import { ColorManager } from "@/features/management/components/ColorManager";
import { SystemSettingsPanel } from "@/features/management/components/SystemSettingsPanel";
import { ManualCronTrigger } from "@/features/management/components/ManualCronTrigger";
import { Card } from "@/components/ui/Card";

export default function ManagementPage() {
  return (
    <div className="space-y-6">
      <ColorManager />
      <SystemSettingsPanel />
      <ManualCronTrigger />
      <Card title="Automation policies" subtitle="Define SLAs and fallback actions.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Daily ROI cron", detail: "Runs 00:00 UTC" },
            { label: "Wallet monitor", detail: "Manual trigger with OWN-PAY" },
            { label: "Telegram bot", detail: "Live status: connected" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-[--color-foreground]">{item.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


