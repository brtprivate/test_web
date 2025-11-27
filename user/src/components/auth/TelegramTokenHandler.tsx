'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { setAuthToken } from '@/lib/slices/authSlice';
import { getReferralCodeOrDefault, setReferralCode } from '@/lib/utils/referral';

const TOKEN_PARAM_CANDIDATES = ['token', 'access_token', 'auth_token', 't'];
const REFERRAL_PARAM_CANDIDATES = ['start', 'ref', 'referral'];

/**
 * Watches the current URL for Telegram auth params and normalizes them
 * so any page can receive ?token=... links and automatically log users in.
 */
export default function TelegramTokenHandler() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const storedToken = useAppSelector((state) => state.auth.token);
  const serializedParams = useMemo(() => searchParams?.toString() ?? '', [searchParams]);
  const lastProcessedParamsRef = useRef<string>('');

  useEffect(() => {
    if (!searchParams) return;

    // Avoid running twice for the same query string
    if (serializedParams === lastProcessedParamsRef.current) return;
    lastProcessedParamsRef.current = serializedParams;

    const referralValue =
      REFERRAL_PARAM_CANDIDATES.map((key) => searchParams.get(key)).find(Boolean) ??
      getReferralCodeOrDefault();

    if (referralValue) {
      setReferralCode(referralValue);
    }

    const tokenValue = TOKEN_PARAM_CANDIDATES.map((key) => searchParams.get(key)).find(Boolean);
    if (!tokenValue) return;

    const tokenChanged = tokenValue !== storedToken;
    dispatch(setAuthToken(tokenValue));

    // Clean URL so token isn't left visible in the bar or history
    if (typeof window === 'undefined') return;

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

    removeKeys(TOKEN_PARAM_CANDIDATES);
    removeKeys(REFERRAL_PARAM_CANDIDATES);
    removeKeys(['chatId', 'source', 'ts']);

    const nextQuery = updatedParams.toString();
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;

    if (removedSomething) {
      window.history.replaceState(null, '', nextUrl);
    }

    // Only reload once per token (if token changed) to avoid loops
    if (tokenChanged) {
      window.location.reload();
    }
  }, [dispatch, searchParams, serializedParams, storedToken]);

  return null;
}


