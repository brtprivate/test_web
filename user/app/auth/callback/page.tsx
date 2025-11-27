/**
 * Auth Callback Page
 * Handles token from Telegram URL and stores it in cookies
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { setToken } from '@/lib/utils/cookies';
import { setReferralCode, getReferralCodeOrDefault } from '@/lib/utils/referral';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Extract referral code from 'start' parameter (Telegram sends /start=8014858167 as ?start=8014858167)
    // This could be a referral code or telegramChatId
    const startParam = searchParams.get('start');
    if (startParam) {
      // Store as referral code (could be referral code or telegram chat ID)
      setReferralCode(startParam);
      console.log('📝 Referral code stored:', startParam);
    } else {
      // If no referral code, set default
      const defaultCode = getReferralCodeOrDefault();
      setReferralCode(defaultCode);
      console.log('📝 Using default referral code:', defaultCode);
    }

    // Try multiple possible parameter names for token
    const token = 
      searchParams.get('token') || 
      searchParams.get('access_token') || 
      searchParams.get('auth_token') ||
      searchParams.get('t');
    
    if (token) {
      try {
        // Store token in cookies (expires in 7 days)
        setToken(token, 7);
        setStatus('success');
        setMessage('Token successfully stored! Redirecting...');
        
        // Force a page reload to refresh auth state
        // Redirect to home page after a short delay
        setTimeout(() => {
          // Reload to ensure all hooks pick up the new token
          window.location.href = '/';
        }, 1500);
      } catch (error) {
        setStatus('error');
        setMessage('Failed to store token. Please try again.');
        console.error('Token storage error:', error);
      }
    } else {
      // If no token but has referral code, still redirect to login/signup
      if (startParam) {
        setStatus('success');
        setMessage('Referral code saved! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        setStatus('error');
        setMessage('No token or referral code provided in URL. Please check the link.');
      }
    }
  }, [searchParams, router]);

  return (
    <MobileLayout showBottomNav={false} showHeaderContent={false}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Processing token...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Success!</h2>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Error</h2>
              <p className="text-gray-600">{message}</p>
              <Button
                variant="primary"
                onClick={() => router.push('/login')}
                fullWidth
              >
                Go to Login...
              </Button>
            </div>
          )}
        </Card>
      </div>
    </MobileLayout>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <MobileLayout showBottomNav={false} showHeaderContent={false}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="max-w-md w-full text-center">
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </Card>
          </div>
        </MobileLayout>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

