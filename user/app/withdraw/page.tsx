/**
 * Withdraw Page
 * Redesigned to match specific visual requirements
 */

'use client';

import { useMemo, useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useAlerts } from '@/hooks/useAlerts';
import AlertStack from '@/components/ui/AlertStack';
import { useCreateWithdrawalMutation, useGetWithdrawalsQuery } from '@/features/withdrawals/api/withdrawalsApi';
import { useInvestmentPlans } from '@/features/investment-plans/hooks/useInvestmentPlans';
import { useCreateInvestmentMutation } from '@/features/investments/api/investmentsApi';

export default function WithdrawPage() {
  const { balance } = useWallet();
  const [createWithdrawal, { isLoading: isWithdrawing }] = useCreateWithdrawalMutation();
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [showBuyTPModal, setShowBuyTPModal] = useState(false);

  // Buy TP Modal State
  const { plans } = useInvestmentPlans();
  const [createInvestment, { isLoading: isCreatingInvestment }] = useCreateInvestmentMutation();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [tpAmount, setTpAmount] = useState('');
  const {
    data: withdrawalsData,
    isLoading: isWithdrawalsLoading,
    isFetching: isWithdrawalsFetching,
  } = useGetWithdrawalsQuery({ limit: 50 });
  const withdrawals = withdrawalsData?.data?.withdrawals ?? [];

  const withdrawalStats = useMemo(() => {
    const totalRequested = withdrawals.reduce((sum, w) => sum + (w?.amount || 0), 0);
    const totalCompleted = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + (w?.amount || 0), 0);
    const totalPending = withdrawals
      .filter(w => w.status === 'pending' || w.status === 'approved')
      .reduce((sum, w) => sum + (w?.amount || 0), 0);
    return {
      totalRequested,
      totalCompleted,
      totalPending,
    };
  }, [withdrawals]);

  const availableBalance = balance?.earningWallet || 0;
  const minWithdraw = 1;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusPillStyles = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100 text-yellow-700', text: 'Pending', label: 'Pending review' },
      approved: { bg: 'bg-blue-100 text-blue-700', text: 'Approved', label: 'Approved' },
      completed: { bg: 'bg-emerald-100 text-emerald-700', text: 'Completed', label: 'Completed' },
      rejected: { bg: 'bg-rose-100 text-rose-700', text: 'Rejected', label: 'Rejected' },
      cancelled: { bg: 'bg-gray-100 text-gray-600', text: 'Cancelled', label: 'Cancelled' },
    };
    return map[status] ?? { bg: 'bg-gray-100 text-gray-700', text: status, label: status };
  };

  const handleAllAmount = () => {
    setAmount(availableBalance.toFixed(4));
  };

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      addAlert({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    if (amountNum < minWithdraw) {
      addAlert({ type: 'error', message: `Minimum withdrawal is $${minWithdraw}` });
      return;
    }

    if (amountNum > availableBalance) {
      addAlert({ type: 'error', message: 'Insufficient balance' });
      return;
    }

    const trimmedAddress = walletAddress.trim();
    if (!trimmedAddress) {
      addAlert({ type: 'error', message: 'Wallet address is required' });
      return;
    }

    if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
      addAlert({ type: 'error', message: 'Invalid BEP20 wallet address' });
      return;
    }

    try {
      const result = await createWithdrawal({
        amount: amountNum,
        walletAddress: trimmedAddress,
        currency: 'USDT',
        network: 'BEP20',
      }).unwrap();

      if (result.status === 'success') {
        addAlert({
          type: 'success',
          message: 'Withdrawal request submitted successfully!',
        });
        setAmount('');
        setWalletAddress('');
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Withdrawal failed. Please try again.';
      addAlert({ type: 'error', message: errorMessage });
    }
  };

  const handleBuyTP = async () => {
    if (!selectedPlan) {
      addAlert({ type: 'error', message: 'Please select a plan' });
      return;
    }

    const amount = parseFloat(tpAmount);
    if (!tpAmount || isNaN(amount) || amount < selectedPlan.minInvestment) {
      addAlert({ type: 'error', message: `Minimum investment is $${selectedPlan.minInvestment}` });
      return;
    }

    if (amount > selectedPlan.maxInvestment) {
      addAlert({ type: 'error', message: `Maximum investment is $${selectedPlan.maxInvestment}` });
      return;
    }

    if (amount > availableBalance) {
      addAlert({ type: 'error', message: 'Insufficient balance' });
      return;
    }

    try {
      const result = await createInvestment({
        planId: selectedPlan.id,
        amount: amount,
      }).unwrap();

      addAlert({ type: 'success', message: 'TP purchased successfully!' });
      setShowBuyTPModal(false);
      setTpAmount('');
      setSelectedPlan(null);
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Purchase failed. Please try again.';
      addAlert({ type: 'error', message: errorMessage });
    }
  };

  return (
    <MobileLayout showBottomNav={true} showHeaderContent={true}>
      <AlertStack alerts={alerts} onClose={removeAlert} />
      <div className="min-h-screen bg-[#F3E5F5] p-6 space-y-6 pb-24">

        {/* Available Balance Section */}
        <div className="text-center space-y-2">
          <p className="text-gray-600 text-base">Available balance :</p>
          <p className="text-4xl font-bold text-gray-800">
            $ {availableBalance.toFixed(4)}
          </p>
        </div>

        {/* Exchange to TP Button */}
        <button
          onClick={() => setShowBuyTPModal(true)}
          className="w-full bg-[#4FC3F7] hover:bg-[#29B6F6] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          <span className="text-2xl">📦</span>
          <span className="text-lg">Exchange to TP</span>
        </button>

        {/* Withdraw Amount Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-700 font-medium">Withdraw amount</label>
            <button
              onClick={handleAllAmount}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm"
            >
              All Amount
            </button>
          </div>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Min 1 USDT"
            className="w-full text-center text-2xl font-bold text-gray-800 py-4 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
          />

          {/* BSC-USDT Receiving Address */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <span className="text-xl">💰</span>
              <span>BSC-USDT Receiving address:</span>
            </div>

            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Eg. 0x4df...3das"
              className="w-full text-center text-gray-400 py-4 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Continue Button */}
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || !amount || !walletAddress}
            className="w-full bg-[#66BB6A] hover:bg-[#4CAF50] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-xl py-4 rounded-xl shadow-md transition-colors mt-6"
          >
            {isWithdrawing ? 'Processing...' : 'Continue'}
          </button>
        </div>

        {/* Withdrawal History */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-white/40 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-gray-400">History</p>
              <h2 className="text-2xl font-extrabold text-[#322751]">Withdrawal Timeline</h2>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-semibold tracking-wide text-purple-600 hover:text-purple-800 uppercase"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-4">
              <p className="text-xs font-semibold text-purple-500 uppercase">Total Requested</p>
              <p className="text-2xl font-bold text-[#271845]">${withdrawalStats.totalRequested.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4">
              <p className="text-xs font-semibold text-emerald-500 uppercase">Completed</p>
              <p className="text-2xl font-bold text-[#0f3c2f]">${withdrawalStats.totalCompleted.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-4">
              <p className="text-xs font-semibold text-amber-500 uppercase">In Progress</p>
              <p className="text-2xl font-bold text-[#513c19]">${withdrawalStats.totalPending.toFixed(2)}</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-purple-100 to-transparent pointer-events-none" />
            <div className="space-y-4 pl-8">
              {isWithdrawalsLoading || isWithdrawalsFetching ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-4 animate-pulse border border-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-32 mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-48" />
                  </div>
                ))
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-10 bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-xl font-semibold text-gray-500">No withdrawals yet</p>
                  <p className="text-sm text-gray-400 mt-1">Your requests will appear here once created.</p>
                </div>
              ) : (
                withdrawals.map(withdrawal => {
                  const pill = getStatusPillStyles(withdrawal.status);
                  return (
                    <div
                      key={withdrawal._id}
                      className="relative bg-gradient-to-br from-white to-purple-50/40 rounded-3xl p-4 border border-purple-50 shadow-sm"
                    >
                      <div className="absolute -left-8 top-6 w-4 h-4 rounded-full border-[3px] border-white bg-purple-500 shadow" />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="text-2xl font-extrabold text-gray-900">${withdrawal.amount.toFixed(2)}</p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${pill.bg}`}>
                          {pill.text}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-gray-500 space-y-1">
                        <p className="font-semibold text-gray-700">{formatDate(withdrawal.createdAt)}</p>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Wallet</p>
                        <p className="font-mono text-gray-700 text-sm break-all">
                          {withdrawal.walletAddress?.slice(0, 10)}...{withdrawal.walletAddress?.slice(-6)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Buy TP Modal */}
      {showBuyTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Buy TP</h2>
              <button
                onClick={() => setShowBuyTPModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Available Balance */}
              <div className="bg-[#F3E5F5] p-4 rounded-xl">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-800">${availableBalance.toFixed(2)}</p>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Select Plan</label>
                <div className="space-y-2">
                  {plans?.map((plan: any) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${selectedPlan?.id === plan.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800">{plan.name}</p>
                          <p className="text-sm text-gray-600">
                            {plan.dailyReturn}% daily for {plan.duration} days
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Min: ${plan.minInvestment}</p>
                          <p className="text-sm text-gray-600">Max: ${plan.maxInvestment}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Amount (USDT)</label>
                <input
                  type="number"
                  value={tpAmount}
                  onChange={(e) => setTpAmount(e.target.value)}
                  placeholder={selectedPlan ? `Min ${selectedPlan.minInvestment} USDT` : 'Select a plan first'}
                  disabled={!selectedPlan}
                  className="w-full text-center text-xl font-bold text-gray-800 py-3 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 transition-colors disabled:bg-gray-100"
                />
              </div>

              {/* Buy Button */}
              <button
                onClick={handleBuyTP}
                disabled={isCreatingInvestment || !selectedPlan || !tpAmount}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl shadow-md transition-colors"
              >
                {isCreatingInvestment ? 'Processing...' : 'Buy TP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}

