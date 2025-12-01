/**
 * Buy TP Modal Component
 * Modal for buying Trade Power (TP)
 */

'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { useInvestmentPlans } from '@/features/investment-plans/hooks/useInvestmentPlans';
import type { InvestmentPlan } from '@/features/investment-plans/api/investmentPlansApi';
import { useGenerateWalletMutation, useStartMonitoringMutation } from '@/features/payment/api/paymentApi';
import { QRCodeSVG } from 'qrcode.react';
import { useUser } from '@/features/users/hooks/useUser';
import { useWallet } from '@/features/wallet/hooks/useWallet';

const formatAmountRange = (plan: InvestmentPlan) => {
  if (typeof plan.maxAmount === 'number') {
    return `$${plan.minAmount.toLocaleString()} - $${plan.maxAmount.toLocaleString()}`;
  }
  return `$${plan.minAmount.toLocaleString()} +`;
};

// Format wallet amounts for display:
// - Never show long floating noise like 0.9999989999
// - Clamp to max 3 decimal places
// - Trim trailing zeros (e.g. 1.230 -> 1.23, 1.000 -> 1)
const formatDisplayAmount = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  const truncated = Math.floor(value * 1000 + 0.0000001) / 1000; // floor at 3 decimals
  return truncated
    .toFixed(3)
    .replace(/0+$/, '') // remove trailing zeros
    .replace(/\.$/, ''); // remove trailing dot
};

interface BuyTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, planId: string, options?: { source?: 'wallet' | 'deposit' }) => void;
  isInvesting?: boolean;
  initialPlanId?: string;
}

export default function BuyTPModal({
  isOpen,
  onClose,
  onConfirm,
  isInvesting = false,
  initialPlanId,
}: BuyTPModalProps) {
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletPrivateKey, setWalletPrivateKey] = useState<string | null>(null);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { plans, isLoading } = useInvestmentPlans();
  const { balance, isLoading: isWalletLoading } = useWallet();
  const { user } = useUser();
  const [generateWallet, { isLoading: isGeneratingWallet }] = useGenerateWalletMutation();
  const [startMonitoring, { isLoading: isStartingMonitor }] = useStartMonitoringMutation();

  // Raw balance from backend (used for display so user sees the real stored value)
  const investmentWalletBalanceRaw = Number(balance?.investmentWallet ?? 0);

  // Internal normalized value for safety checks:
  // - Convert to cents and floor so we never allow spending more than backend balance
  const investmentWalletBalanceCents = Math.floor(
    investmentWalletBalanceRaw * 100 + 0.000001
  );
  const investmentWalletBalanceForChecks = investmentWalletBalanceCents / 100;
  const getPlanKey = (plan: InvestmentPlan) => String(plan.id || plan._id || plan.name);
  const selectedPlanId = selectedPlan ? getPlanKey(selectedPlan) : '';

  // Effect to set initial plan when modal opens or initialPlanId changes
  useEffect(() => {
    if (isOpen && initialPlanId && plans.length > 0) {
      const plan = plans.find(p => getPlanKey(p) === initialPlanId);
      if (plan) {
        setSelectedPlan(plan);
      }
    } else if (isOpen && !initialPlanId) {
      setSelectedPlan(null);
    }
  }, [isOpen, initialPlanId, plans]);

  const availablePlans = useMemo(
    () => plans.filter((plan) =>
      // If initialPlanId is provided, include it regardless of type
      (initialPlanId && getPlanKey(plan) === initialPlanId) ||
      // Otherwise exclude weekly unless visible
      (plan.planType !== 'weekly' || plan.isVisibleNow)
    ),
    [plans, initialPlanId]
  );

  const botPlans = useMemo(
    () => availablePlans.filter((plan) => plan.planType !== 'weekly'),
    [availablePlans]
  );

  const minAmount = selectedPlan
    ? selectedPlan.minAmount
    : botPlans.length > 0
      ? Math.min(...botPlans.map((p) => p.minAmount))
      : availablePlans.length > 0
        ? Math.min(...availablePlans.map((p) => p.minAmount))
        : 10;

  const planMaxAmounts = botPlans
    .map((p) => (typeof p.maxAmount === 'number' ? p.maxAmount : undefined))
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

  const fallbackMaxCandidates = botPlans.map((p) =>
    typeof p.maxAmount === 'number' ? p.maxAmount : p.minAmount + 1000
  );
  const fallbackMax =
    fallbackMaxCandidates.length > 0 ? Math.max(...fallbackMaxCandidates) : 10000;

  const maxAmount = selectedPlan && typeof selectedPlan.maxAmount === 'number'
    ? selectedPlan.maxAmount
    : planMaxAmounts.length > 0 ? Math.max(...planMaxAmounts) : fallbackMax;

  const amountNum = parseFloat(amount);
  const hasAmount = !Number.isNaN(amountNum);

  const matchingPlans = useMemo(() => {
    if (!hasAmount) return [];

    // If we have a selected plan (e.g. from initialPlanId), check if amount fits it
    if (selectedPlan) {
      const fits = amountNum >= selectedPlan.minAmount &&
        (typeof selectedPlan.maxAmount !== 'number' || amountNum <= selectedPlan.maxAmount);
      if (fits) return [selectedPlan];
    }

    return availablePlans.filter(
      (plan) =>
        amountNum >= plan.minAmount &&
        (typeof plan.maxAmount !== 'number' || amountNum <= plan.maxAmount)
    );
  }, [availablePlans, amountNum, hasAmount, selectedPlan]);

  useEffect(() => {
    if (!hasAmount) {
      // Don't reset if we have an initial plan
      if (!initialPlanId) {
        setSelectedPlan(null);
      }
      return;
    }

    if (matchingPlans.length > 0) {
      setSelectedPlan((prev) => {
        // If we have an initial plan and it matches, keep it
        if (initialPlanId && prev && getPlanKey(prev) === initialPlanId) {
          return prev;
        }

        if (!prev) return matchingPlans[0];
        const prevId = prev.id || prev._id;
        const stillValid = matchingPlans.some(
          (plan) => (plan.id || plan._id) === prevId
        );
        return stillValid ? prev : matchingPlans[0];
      });
    } else if (!initialPlanId) {
      // Only reset if not enforced by initialPlanId
      setSelectedPlan(null);
    }
  }, [hasAmount, matchingPlans, initialPlanId]);

  // Generate or get wallet address when payment section should be shown
  useEffect(() => {
    const fetchWallet = async () => {
      if (showPaymentSection && amount && !walletAddress && !isGeneratingWallet) {
        const amountNum = parseFloat(amount);
        if (!isNaN(amountNum) && amountNum >= minAmount && amountNum <= maxAmount && selectedPlan) {
          try {
            const result = await generateWallet().unwrap();
            if (result.status && result.wallet) {
              setWalletAddress(result.wallet.address);
              setWalletPrivateKey(result.wallet.privateKey);
            }
          } catch (error: any) {
            console.error('Error generating wallet:', error);
            setErrors({ amount: 'Failed to generate wallet. Please try again.' });
          }
        }
      }
    };
    if (showPaymentSection) {
      fetchWallet();
    }
  }, [showPaymentSection, amount, minAmount, maxAmount, selectedPlan, isGeneratingWallet]);

  const validateAmount = () => {
    const newErrors: { amount?: string } = {};
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amountNum < minAmount) {
      newErrors.amount = `Minimum amount is $${minAmount}`;
    } else if (amountNum > maxAmount) {
      newErrors.amount = `Maximum amount is $${maxAmount}`;
    } else if (selectedPlan) {
      if (
        amountNum < selectedPlan.minAmount ||
        (typeof selectedPlan.maxAmount === 'number' && amountNum > selectedPlan.maxAmount)
      ) {
        newErrors.amount = `Amount must be within ${formatAmountRange(selectedPlan)}`;
      }
    } else if (matchingPlans.length === 0) {
      newErrors.amount = 'Enter an amount that fits an active plan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetFormState = () => {
    setAmount('');
    setErrors({});
    setSelectedPlan(null);
    setWalletAddress(null);
    setWalletPrivateKey(null);
    setShowPaymentSection(false);
  };

  const handleStartMonitor = async () => {
    if (!validateAmount() || !selectedPlan || !walletAddress || !walletPrivateKey) {
      return;
    }

    const planId = selectedPlan.id || selectedPlan._id;
    if (!planId) {
      setErrors({ amount: 'Unable to detect investment plan. Please try again.' });
      return;
    }

    setIsMonitoring(true);
    try {
      // Start monitoring the wallet - backend will automatically create investment if payment is detected
      const monitorResult = await startMonitoring({
        walletAddress,
        walletPrivateKey,
        amount: parseFloat(amount),
        planId,
      }).unwrap();

      if (monitorResult.status && monitorResult.result?.found) {
        if (monitorResult.result.investmentCreated) {
          onConfirm(parseFloat(amount), planId, { source: 'deposit' });
          resetFormState();
          return;
        } else if (monitorResult.result.investmentError) {
          setErrors({
            amount: `Payment detected but investment creation failed: ${monitorResult.result.investmentError}. Please contact support.`,
          });
        } else {
          setErrors({
            amount: 'Payment detected and added to investment wallet. Please try creating investment again or contact support.',
          });
        }
      } else {
        setErrors({
          amount: 'No payment detected. Please send the payment to the wallet address and try again.',
        });
      }
    } catch (error: any) {
      console.error('Error monitoring wallet:', error);
      const errorMessage = error?.data?.message || 'Failed to monitor wallet. Please try again.';
      setErrors({ amount: errorMessage });
    } finally {
      setIsMonitoring(false);
    }
  };

  const setQuickAmount = (value: number) => {
    setAmount(value.toString());
    setErrors({ ...errors, amount: undefined });
  };

  const handlePayFromWallet = () => {
    if (!validateAmount() || !selectedPlan) {
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      setErrors({ amount: 'Please enter a valid amount' });
      return;
    }

    // Work in cents to avoid floating point issues and NEVER allow spending
    // more than what the backend wallet actually has.
    const amountCents = Math.round(amountNum * 100);
    if (amountCents > investmentWalletBalanceCents) {
      setErrors({ amount: 'Insufficient investment wallet balance' });
      return;
    }

    const planId = selectedPlan.id || selectedPlan._id;
    if (!planId) {
      setErrors({ amount: 'Unable to detect investment plan. Please try again.' });
      return;
    }

    onConfirm(amountNum, planId, { source: 'wallet' });
  };

  const parsedAmount = parseFloat(amount);
  const hasValidAmount = !isNaN(parsedAmount) && parsedAmount >= minAmount;
  const canInvestFromWallet =
    hasValidAmount &&
    investmentWalletBalanceForChecks > 0 &&
    Math.round(parsedAmount * 100) <= investmentWalletBalanceCents;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy Trade Power (TP)" size="md">
      <div className="space-y-4">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Enter the amount you want to invest in Trade Power. Your investment will start earning daily returns.
          </p>
        </div>

        {/* Investment Wallet Balance */}
        {user && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between text-sm text-purple-900">
            <span>Investment Wallet</span>
            <span className="font-semibold">
              {isWalletLoading ? 'Loading...' : `$${formatDisplayAmount(investmentWalletBalanceRaw)}`}
            </span>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <Input
            label="Investment Amount (USDT)"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setErrors({ ...errors, amount: undefined });
            }}
            error={errors.amount}
            helperText={`Min: $${minAmount} | Max: $${maxAmount}`}
          />
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Quick Select:</p>
          <div className="grid grid-cols-4 gap-2">
            {[50, 100, 500, 1000].map((value) => (
              <button
                key={value}
                onClick={() => setQuickAmount(value)}
                className="px-3 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 
                         active:bg-gray-300 rounded-lg text-gray-700 font-medium 
                         transition-colors touch-manipulation"
              >
                ${value}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Selector */}
        {matchingPlans.length > 1 && (
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Matching Plans
            </label>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
              <select
                className="w-full bg-transparent text-sm font-semibold text-gray-700 outline-none"
                value={selectedPlanId}
                onChange={(e) => {
                  const plan = matchingPlans.find((p) => getPlanKey(p) === e.target.value);
                  if (plan) {
                    setSelectedPlan(plan);
                  }
                }}
              >
                {matchingPlans.map((plan) => (
                  <option key={getPlanKey(plan)} value={getPlanKey(plan)}>
                    {plan.name} ({formatAmountRange(plan)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Selected Plan Info */}
        {selectedPlan && amount && !errors.amount && parseFloat(amount) >= minAmount && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
            <p className="text-xs sm:text-sm text-green-800">
              <span className="font-semibold">Selected Plan:</span> {selectedPlan.name}
            </p>
            {selectedPlan.planType === 'weekly' ? (
              <>
                <p className="text-xs sm:text-sm text-green-800">
                  <span className="font-semibold">Payout:</span>{' '}
                  {selectedPlan.lumpSumROI ?? 0}% in{' '}
                  {selectedPlan.payoutDelayHours ?? 72} hrs
                </p>
                <p className="text-xs sm:text-sm text-green-800">
                  <span className="font-semibold">Amount window:</span>{' '}
                  {formatAmountRange(selectedPlan)}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-green-800">
                  <span className="font-semibold">ROI:</span>{' '}
                  {(selectedPlan.dailyROI ?? 0).toFixed(1)}%
                </p>
                <p className="text-xs sm:text-sm text-green-800">
                  <span className="font-semibold">Estimated Daily Return:</span>{' '}
                  {(parseFloat(amount) * ((selectedPlan.dailyROI ?? 0) / 100)).toFixed(3)}
                </p>
              </>
            )}
          </div>
        )}

        {/* Payment Section - Show wallet address and QR code */}
        {showPaymentSection && walletAddress && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Send Payment</p>
              <p className="text-xs text-gray-600 mb-3">
                Send exactly <span className="font-bold">${parseFloat(amount).toFixed(2)} USDT</span> to the address below using BEP20 network
              </p>
            </div>

            {/* Wallet Address */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Your Wallet Address:
              </label>
              <div className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg">
                <code className="text-xs font-mono text-gray-800 flex-1 break-all">
                  {walletAddress}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(walletAddress);
                  }}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  title="Copy address"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center space-y-2">
              <p className="text-xs font-medium text-gray-700">Scan QR Code to Add Funds</p>
              <div className="bg-white p-3 rounded-lg border border-gray-300">
                <QRCodeSVG
                  value={walletAddress}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Scan with any wallet app to send {parseFloat(amount).toFixed(2)} USDT.
                This amount will be added to your Investment Wallet. After it arrives,
                you can invest from your Investment Wallet.
              </p>
            </div>

            {/* Network Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <p className="text-xs text-yellow-800">
                <span className="font-semibold">⚠️ Important:</span> Use BEP20 (Binance Smart Chain) network only.
                Sending via other networks may result in loss of funds.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          {canInvestFromWallet && (
            <Button
              variant="primary"
              fullWidth
              onClick={handlePayFromWallet}
              disabled={
                isInvesting ||
                isMonitoring ||
                isStartingMonitor ||
                isGeneratingWallet ||
                !!errors.amount
              }
              isLoading={isInvesting}
            >
              {isInvesting ? 'Processing...' : 'Invest from Investment Wallet'}
            </Button>
          )}

          {showPaymentSection && walletAddress ? (
            <Button
              variant="primary"
              fullWidth
              onClick={handleStartMonitor}
              disabled={
                !amount ||
                !!errors.amount ||
                !selectedPlan ||
                isMonitoring ||
                isStartingMonitor ||
                isGeneratingWallet
              }
              isLoading={isMonitoring || isStartingMonitor}
            >
              {isMonitoring || isStartingMonitor ? 'Adding...' : 'Add to Investment Wallet'}
            </Button>
          ) : (
            <Button
              variant={canInvestFromWallet ? 'secondary' : 'primary'}
              fullWidth
              onClick={() => {
                if (validateAmount() && selectedPlan) {
                  setShowPaymentSection(true);
                }
              }}
              disabled={
                !amount ||
                !!errors.amount ||
                !selectedPlan ||
                isLoading ||
                isGeneratingWallet
              }
              isLoading={isGeneratingWallet}
            >
              {isGeneratingWallet ? 'Generating Wallet...' : 'Add Funds to Investment Wallet'}
            </Button>
          )}

          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              resetFormState();
              onClose();
            }}
            disabled={isMonitoring || isStartingMonitor || isGeneratingWallet}
          >
            Cancel
          </Button>
          <div className="pt-1">
            <p className="text-[11px] text-center text-gray-500">
              Want to see your previous top-ups?{' '}
              <Link href="/deposits" className="text-blue-600 hover:text-blue-700 underline font-medium">
                View deposit history
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

