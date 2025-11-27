"use client";

import { useState } from 'react';
import { Bell, LogOut, ShieldCheck, Search, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { clearSession } from '@/lib/slices/authSlice';

interface TopbarProps {
  onMenuClick?: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const admin = useAppSelector((state) => state.adminAuth.admin);
  const [searchValue, setSearchValue] = useState('');

  const handleLogout = () => {
    dispatch(clearSession());
    router.push('/login');
  };

  return (
    <header className="glass-panel sticky top-0 z-20 flex w-full flex-shrink-0 items-center justify-between gap-4 rounded-2xl px-4 py-3 backdrop-blur-xl md:px-6 md:py-4">
      {/* Left Section - Mobile Menu & Title */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-[--color-mutedForeground] transition-all hover:border-white/20 hover:bg-white/5 hover:text-[--color-foreground] md:hidden"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:block">
          <p className="text-xs uppercase tracking-[0.25em] text-[--color-mutedForeground]">
            Dashboard
          </p>
          <h1 className="text-xl font-semibold text-[--color-foreground] md:text-2xl">
            Welcome back, {admin?.username ?? 'Admin'}
          </h1>
        </div>
        <div className="md:hidden">
          <h1 className="text-lg font-semibold text-[--color-foreground]">
            {admin?.username ?? 'Admin'}
          </h1>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="hidden flex-1 max-w-md items-center gap-3 md:flex">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-mutedForeground]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-10 py-2.5 text-sm text-[--color-foreground] placeholder:text-[--color-mutedForeground] transition-all focus:border-[--color-primary]/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
          />
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Role Badge */}
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-[--color-primary]/10 to-[--color-accent]/10 px-3 py-2 text-xs font-medium text-[--color-foreground] lg:flex">
          <ShieldCheck size={14} className="text-[--color-primary]" />
          <span>{admin?.role?.toUpperCase() ?? 'ADMIN'}</span>
        </div>

        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-[--color-mutedForeground] transition-all hover:border-white/20 hover:bg-white/5 hover:text-[--color-foreground]">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[--color-danger] ring-2 ring-[--color-muted]"></span>
        </button>

        {/* Logout Button */}
        <Button
          variant="ghost"
          className="hidden px-3 py-2 text-sm md:flex"
          onClick={handleLogout}
          icon={<LogOut size={16} />}
        >
          Logout
        </Button>
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-[--color-mutedForeground] transition-all hover:border-white/20 hover:bg-white/5 hover:text-[--color-foreground] md:hidden"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};


