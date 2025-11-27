"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Minus, Wallet, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateWalletAdjustmentMutation } from '@/features/wallet-adjustments/api';
import { useGetUsersQuery } from '@/features/users/api';

interface WalletAdjustmentFormProps {
  onSuccess?: () => void;
}

export const WalletAdjustmentForm = ({ onSuccess }: WalletAdjustmentFormProps) => {
  const [userId, setUserId] = useState('');
  const [walletType, setWalletType] = useState<'investment' | 'earning'>('investment');
  const [action, setAction] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [createAdjustment, { isLoading }] = useCreateWalletAdjustmentMutation();
  const { data: usersData } = useGetUsersQuery({ search: userSearch, limit: 10, page: 1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error('Please select a user');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      await createAdjustment({
        userId,
        walletType,
        action,
        amount: parseFloat(amount),
        description: description.trim(),
      }).unwrap();

      toast.success(
        `Successfully ${action === 'add' ? 'added' : 'deducted'} ${amount} from ${walletType} wallet`
      );

      // Reset form
      setUserId('');
      setAmount('');
      setDescription('');
      setUserSearch('');

      onSuccess?.();
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Failed to adjust wallet';
      toast.error(message);
    }
  };

  const users = usersData?.data?.users || [];

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[--color-primary]/20 to-[--color-accent]/20">
          <Wallet className="h-5 w-5 text-[--color-primary]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[--color-foreground]">Wallet Adjustment</h2>
          <p className="text-sm text-[--color-mutedForeground]">Add or deduct funds from user wallets</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Selection */}
        <div className="space-y-2">
          <Input
            label="Search User"
            placeholder="Search by name, email, or Telegram username"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            hint="Type to search for users"
          />
          {userSearch && users.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[--color-muted]/30">
              {users.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => {
                    setUserId(user._id);
                    setUserSearch(user.name || user.email || '');
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                    userId === user._id ? 'bg-[--color-primary]/20 text-[--color-primary]' : ''
                  }`}
                >
                  <div className="font-medium">{user.name || 'No name'}</div>
                  <div className="text-xs text-[--color-mutedForeground]">
                    {user.email} {user.telegramUsername && `• @${user.telegramUsername}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Wallet Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[--color-foreground]">Wallet Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setWalletType('investment')}
              className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                walletType === 'investment'
                  ? 'border-[--color-primary] bg-[--color-primary]/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Investment</span>
            </button>
            <button
              type="button"
              onClick={() => setWalletType('earning')}
              className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                walletType === 'earning'
                  ? 'border-[--color-primary] bg-[--color-primary]/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Earning</span>
            </button>
          </div>
        </div>

        {/* Action Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[--color-foreground]">Action</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('add')}
              className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                action === 'add'
                  ? 'border-[--color-success] bg-[--color-success]/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add Money</span>
            </button>
            <button
              type="button"
              onClick={() => setAction('deduct')}
              className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                action === 'deduct'
                  ? 'border-[--color-danger] bg-[--color-danger]/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <Minus className="h-4 w-4" />
              <span className="text-sm font-medium">Deduct Money</span>
            </button>
          </div>
        </div>

        {/* Amount */}
        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          hint="Enter the amount to add or deduct"
        />

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[--color-foreground]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Reason for this adjustment..."
            className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-[--color-foreground] outline-none transition-all duration-150 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/20"
            rows={3}
            required
          />
          <p className="text-xs text-[--color-mutedForeground]">
            Provide a clear description for this wallet adjustment
          </p>
        </div>

        {/* Submit Button */}
        <Button type="submit" loading={isLoading} className="w-full">
          {action === 'add' ? 'Add Money' : 'Deduct Money'}
        </Button>
      </form>
    </Card>
  );
};



