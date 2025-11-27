/**
 * useAuth Hook
 * Custom hook for authentication operations
 */

import { useCallback, useEffect } from 'react';
import { useSignupMutation, useLoginMutation, useVerifyTokenQuery } from '../api/authApi';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { setAuthToken, clearAuthToken, syncAuthToken } from '@/lib/slices/authSlice';

export const useAuth = () => {
  const [signup, { isLoading: isSigningUp, error: signupError }] = useSignupMutation();
  const [login, { isLoading: isLoggingIn, error: loginError }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const hasToken = !!token;
  
  // Update token state on mount and when window gains focus (handles cross-tab scenarios)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    dispatch(syncAuthToken());

    const handleFocus = () => dispatch(syncAuthToken());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'token') {
        dispatch(syncAuthToken());
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [dispatch]);
  
  const { data: verifyData, isLoading: isVerifying } = useVerifyTokenQuery(undefined, {
    skip: !hasToken, // Skip the query if there's no token
  });

  const handleSignup = useCallback(
    async (signupData: Parameters<typeof signup>[0]) => {
      try {
        const result = await signup(signupData).unwrap();
        if (result.data?.token) {
          dispatch(setAuthToken(result.data.token));
        }
        return result;
      } catch (error) {
        console.error('Signup error:', error);
        throw error;
      }
    },
    [dispatch, signup]
  );

  const handleLogin = useCallback(
    async (loginData: Parameters<typeof login>[0]) => {
      try {
        const result = await login(loginData).unwrap();
        if (result.data?.token) {
          dispatch(setAuthToken(result.data.token));
        }
        return result;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    [dispatch, login]
  );

  const logout = useCallback(() => {
    dispatch(clearAuthToken());
    window.location.href = '/login';
  }, [dispatch]);

  const isAuthenticated = verifyData?.data?.valid ?? false;
  const user = verifyData?.data?.decoded;

  return {
    signup: handleSignup,
    login: handleLogin,
    logout,
    isSigningUp,
    isLoggingIn,
    isVerifying,
    isAuthenticated,
    user,
    signupError,
    loginError,
  };
};

