"use client";

import { useRef } from 'react';
import { WalletAdjustmentForm } from '@/features/wallet-adjustments/components/WalletAdjustmentForm';
import { WalletAdjustmentHistory } from '@/features/wallet-adjustments/components/WalletAdjustmentHistory';

export default function WalletAdjustmentsPage() {
  const historyRef = useRef<{ refetch: () => void }>(null);

  const handleAdjustmentSuccess = () => {
    // Trigger history refresh
    if (historyRef.current) {
      historyRef.current.refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[--color-foreground]">Wallet Adjustments</h1>
        <p className="mt-1 text-sm text-[--color-mutedForeground]">
          Manage user wallets by adding or deducting funds from investment or earning wallets
        </p>
      </div>

      <WalletAdjustmentForm onSuccess={handleAdjustmentSuccess} />
      <WalletAdjustmentHistory ref={historyRef} />
    </div>
  );
}

