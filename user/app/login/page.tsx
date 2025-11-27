/**
 * Login Page
 * Demo login page for testing
 */

'use client';

import { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [telegramChatId, setTelegramChatId] = useState('');
  const { login, isLoggingIn, loginError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await login({
        telegramChatId: parseInt(telegramChatId),
      });
      if (result?.data?.token) {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
    }
  };

  return (
    <MobileLayout showBottomNav={false} showHeaderContent={false}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Login
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Welcome back! Login to continue
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Telegram Chat ID"
              type="number"
              placeholder="Enter Telegram Chat ID"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              required
              helperText="Get your Chat ID from Telegram bot using /myid command"
            />

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  {(loginError as any)?.data?.message ||
                    'Authentication failed. Please try again.'}
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoggingIn}
            >
              Login
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => router.push('/register')}
              className="text-sm text-blue-600 hover:text-blue-700 w-full text-center"
            >
              Don't have an account? Create one
            </button>
          </div>
        </Card>

        {/* Demo Accounts Info */}
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Testing:</h3>
          <p className="text-xs text-blue-800 mb-2">
            Use any Telegram Chat ID (e.g., 123456789) to test the app.
          </p>
          <p className="text-xs text-blue-800">
            If user doesn't exist, it will create a new account. Otherwise, it will login.
          </p>
        </Card>
      </div>
    </MobileLayout>
  );
}




