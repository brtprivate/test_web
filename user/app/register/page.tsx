'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getReferralCode,
  getReferralCodeOrDefault,
  removeReferralCode,
  setReferralCode as storeReferralCode,
} from '@/lib/utils/referral';

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, isSigningUp, signupError } = useAuth();

  const [name, setName] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const queryReferral = useMemo(() => {
    return (
      searchParams.get('ref') ||
      searchParams.get('code') ||
      searchParams.get('start') ||
      ''
    );
  }, [searchParams]);

  useEffect(() => {
    const storedCode = queryReferral || getReferralCode();
    if (storedCode) {
      storeReferralCode(storedCode);
      setReferralInput(storedCode.toUpperCase());
    } else {
      const defaultCode = getReferralCodeOrDefault();
      storeReferralCode(defaultCode);
      setReferralInput(defaultCode);
    }
  }, [queryReferral]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const chatIdNumber = Number(telegramChatId.trim());
    if (!telegramChatId.trim() || Number.isNaN(chatIdNumber)) {
      setFormError('Please enter a valid Telegram Chat ID.');
      return;
    }

    if (!name.trim()) {
      setFormError('Full name is required.');
      return;
    }

    const codeToUse = referralInput?.trim() || getReferralCodeOrDefault();
    storeReferralCode(codeToUse);

    try {
      const result = await signup({
        name: name.trim(),
        telegramChatId: chatIdNumber,
        referralCode: codeToUse.toUpperCase(),
      });

      if (result?.data?.token) {
        removeReferralCode();
        router.push('/');
      }
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <MobileLayout showBottomNav={false} showHeaderContent={false}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Join AiEarnBot with your Telegram Chat ID and referral code.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <Input
              label="Telegram Chat ID"
              type="number"
              placeholder="e.g. 8014858167"
              value={telegramChatId}
              onChange={(event) => setTelegramChatId(event.target.value)}
              required
              helperText="Open our Telegram bot and send /myid to get this number."
            />

            <Input
              label="Referral Code"
              type="text"
              placeholder="Enter referral code"
              value={referralInput}
              onChange={(event) => setReferralInput(event.target.value.toUpperCase())}
              helperText="You can update the referral if a friend invited you."
            />

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {formError}
              </div>
            )}

            {signupError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  {(signupError as any)?.data?.message ||
                    'Unable to create account. Please try again.'}
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isSigningUp}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-gray-900">Need help?</span>
              <span>
                Telegram Chat ID is required to connect your AiEarnBot account with our bot.
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => router.push('/login')}
            >
              Already have an account? Login
            </Button>
          </div>
        </Card>

        <Card className="mt-4 bg-blue-50 border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Tips</h3>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Use /myid in Telegram to copy your Chat ID.</li>
            <li>Referral code unlocks extra rewards for you and your friend.</li>
            <li>You can always paste a new referral link and it will auto-fill here.</li>
          </ul>
        </Card>
      </div>
    </MobileLayout>
  );
}

function RegisterPageFallback() {
  return (
    <MobileLayout showBottomNav={false} showHeaderContent={false}>
      <div className="max-w-md mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    </MobileLayout>
  );
}
