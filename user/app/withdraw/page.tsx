/**
 * Withdraw Page
 * Redesigned to match specific visual requirements
 */

'use client';

import { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useAlerts } from '@/hooks/useAlerts';
import AlertStack from '@/components/ui/AlertStack';
import { useCreateWithdrawalMutation } from '@/features/withdrawals/api/withdrawalsApi';
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

  const availableBalance = balance?.earningWallet || 0;
  const minWithdraw = 1;

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
      <div className="min-h-screen bg-[#F3E5F5] p-6 space-y-6">

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

