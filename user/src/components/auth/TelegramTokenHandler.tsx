'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { setAuthToken, syncAuthToken } from '@/lib/slices/authSlice';
import { getReferralCodeOrDefault, setReferralCode } from '@/lib/utils/referral';
import { setToken } from '@/lib/utils/cookies';

const TOKEN_PARAM_CANDIDATES = ['token', 'access_token', 'auth_token', 't'];
const REFERRAL_PARAM_CANDIDATES = ['start', 'ref', 'referral'];

/**
 * Watches the current URL for Telegram auth params and normalizes them
 * so any page can receive ?token=... links and automatically log users in.
 */
export default function TelegramTokenHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const storedToken = useAppSelector((state) => state.auth.token);
  const serializedParams = useMemo(() => searchParams?.toString() ?? '', [searchParams]);
  const lastProcessedParamsRef = useRef<string>('');
  const hasProcessedRef = useRef<boolean>(false);
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!searchParams || processingRef.current) return;

    // Avoid running twice for the same query string
    if (serializedParams === lastProcessedParamsRef.current) return;
    
    // Reset processed flag if params changed
    if (hasProcessedRef.current && serializedParams !== lastProcessedParamsRef.current) {
      hasProcessedRef.current = false;
    }
    
    lastProcessedParamsRef.current = serializedParams;

    // Handle referral code
    const referralValue =
      REFERRAL_PARAM_CANDIDATES.map((key) => searchParams.get(key)).find(Boolean) ??
      getReferralCodeOrDefault();

    if (referralValue) {
      setReferralCode(referralValue);
    }

    // Find token from URL parameters
    const tokenValue = TOKEN_PARAM_CANDIDATES.map((key) => searchParams.get(key)).find(Boolean);
    
    if (!tokenValue) {
      // No token in URL, nothing to do
      return;
    }

    // Check if this is a new token (different from stored one)
    const tokenChanged = tokenValue !== storedToken;
    
    // If token hasn't changed and we've already processed it, skip
    if (!tokenChanged && hasProcessedRef.current) {
      return;
    }

    processingRef.current = true;

    console.log('🔐 [TelegramTokenHandler] Processing token from URL', {
      hasToken: !!tokenValue,
      tokenChanged,
      tokenLength: tokenValue?.length,
      storedTokenExists: !!storedToken,
    });

    // First, ensure token is persisted to storage synchronously
    if (typeof window !== 'undefined' && tokenValue) {
      // Store in localStorage immediately
      try {
        window.localStorage.setItem('token', tokenValue);
        console.log('✅ [TelegramTokenHandler] Token stored in localStorage');
      } catch (error) {
        console.error('❌ [TelegramTokenHandler] Failed to store in localStorage:', error);
      }
      
      // Store in cookies
      setToken(tokenValue, 7); // 7 days expiry
      console.log('✅ [TelegramTokenHandler] Token stored in cookies');
    }

    // Then update Redux state (which will also persist, but we already did it above)
    dispatch(setAuthToken(tokenValue));
    console.log('✅ [TelegramTokenHandler] Token stored in Redux');

    // Mark as processed
    hasProcessedRef.current = true;

    // Clean URL so token isn't left visible in the bar or history
    if (typeof window !== 'undefined') {
      const updatedParams = new URLSearchParams(searchParams);
      let removedSomething = false;

      const removeKeys = (keys: string[]) => {
        keys.forEach((key) => {
          if (updatedParams.has(key)) {
            updatedParams.delete(key);
            removedSomething = true;
          }
        });
      };

      // Remove all auth-related parameters
      removeKeys(TOKEN_PARAM_CANDIDATES);
      removeKeys(REFERRAL_PARAM_CANDIDATES);
      removeKeys(['chatId', 'source', 'ts']);

      const nextQuery = updatedParams.toString();
      const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;

      // Update URL without reload (remove sensitive params)
      if (removedSomething) {
        window.history.replaceState(null, '', nextUrl);
        console.log('✅ [TelegramTokenHandler] URL cleaned, removed sensitive params');
      }
    }

    // Only reload if token actually changed (new login)
    // This ensures all hooks and components pick up the new auth state
    if (tokenChanged) {
      console.log('🔄 [TelegramTokenHandler] Token changed, preparing to reload...');
      
      // Verify token was stored before reloading
      const verifyStored = () => {
        if (typeof window === 'undefined') return false;
        try {
          const stored = window.localStorage.getItem('token');
          const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('token='));
          const hasStored = stored === tokenValue;
          const hasCookie = !!cookieToken;
          
          console.log('🔍 [TelegramTokenHandler] Token verification:', {
            localStorage: hasStored,
            cookie: hasCookie,
            tokenMatch: stored === tokenValue,
          });
          
          return hasStored;
        } catch (error) {
          console.error('❌ [TelegramTokenHandler] Error verifying token:', error);
          return false;
        }
      };

      // Wait longer and verify before reload
      setTimeout(() => {
        const isStored = verifyStored();
        if (isStored) {
          // Sync token one more time before reload to be absolutely sure
          dispatch(syncAuthToken());
          console.log('✅ [TelegramTokenHandler] Token verified, reloading now...');
          // Use window.location.href instead of reload() to ensure full page refresh
          window.location.href = window.location.pathname;
        } else {
          console.warn('⚠️ [TelegramTokenHandler] Token not properly stored, retrying...');
          // Retry storing
          if (typeof window !== 'undefined' && tokenValue) {
            window.localStorage.setItem('token', tokenValue);
            setToken(tokenValue, 7);
            dispatch(setAuthToken(tokenValue));
          }
          // Try reload anyway after another delay
          setTimeout(() => {
            dispatch(syncAuthToken());
            window.location.href = window.location.pathname;
          }, 200);
        }
      }, 500); // Increased delay to 500ms
    } else {
      console.log('✅ [TelegramTokenHandler] Token already set, no reload needed');
      processingRef.current = false;
    }
  }, [dispatch, searchParams, serializedParams, storedToken, router]);

  return null;
}


