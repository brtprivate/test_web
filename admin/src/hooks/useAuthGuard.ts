"use client";

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { getStoredToken } from '@/lib/utils/token';
import { hydrateFromStorage } from '@/lib/slices/authSlice';

interface UseAuthGuardOptions {
  redirectTo?: string;
  allowWhenAuthenticated?: string;
}

export const useAuthGuard = (options?: UseAuthGuardOptions) => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.adminAuth);
  const target = options?.redirectTo || '/login';

  const isProtectedRoute = useMemo(() => pathname !== '/login', [pathname]);

  useEffect(() => {
    if (!token) {
      dispatch(hydrateFromStorage());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (!isProtectedRoute) return;
    const existingToken = token || getStoredToken();
    if (!existingToken) {
      router.replace(target);
    }
  }, [isProtectedRoute, router, target, token]);

  useEffect(() => {
    if (pathname === '/login' && token && options?.allowWhenAuthenticated) {
      router.replace(options.allowWhenAuthenticated);
    }
  }, [options?.allowWhenAuthenticated, pathname, router, token]);

  return { token };
};




