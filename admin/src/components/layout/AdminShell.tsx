"use client";

import { PropsWithChildren, useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useGetAdminProfileQuery } from '@/features/auth/api';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { updateProfile } from '@/lib/slices/authSlice';

export const AdminShell = ({ children }: PropsWithChildren) => {
  const { token } = useAuthGuard({ redirectTo: '/login' });
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: profile } = useGetAdminProfileQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (profile?.admin) {
      dispatch(updateProfile(profile.admin));
    }
  }, [dispatch, profile?.admin]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app text-[--color-mutedForeground]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[--color-primary]/20 border-t-[--color-primary]"></div>
          <p className="text-sm">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto flex h-screen max-w-[1600px] gap-3 overflow-hidden p-3 md:gap-4 md:p-4 lg:gap-6 lg:p-6">
        {/* Sidebar - Hidden on mobile, always visible on desktop */}
        <div className="hidden md:block md:w-72 md:flex-shrink-0">
          <Sidebar isOpen={true} />
        </div>
        
        {/* Mobile Sidebar */}
        <div className="md:hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden md:gap-4 lg:gap-6">
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="min-h-0 flex-1 overflow-y-auto scroll-area">{children}</main>
        </div>
      </div>
    </div>
  );
};


