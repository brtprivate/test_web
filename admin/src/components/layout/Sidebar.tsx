"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { NAV_ITEMS } from '@/components/layout/navLinks';
import { useAppSelector } from '@/hooks/useAppSelector';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const admin = useAppSelector((state) => state.adminAuth.admin);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={clsx(
          'glass-panel fixed left-0 top-0 z-50 flex h-screen w-72 flex-col transition-transform duration-300 md:sticky md:top-0 md:z-10 md:h-[calc(100vh-1.5rem)] md:translate-x-0',
          'border-r border-white/10',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo/Brand Section - Fixed */}
        <div className="flex-shrink-0 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent px-5 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 shadow-xl shadow-[--color-primary]/20">
              <Image
                src="/logo.png"
                alt="AI Earn"
                fill
                sizes="40px"
                className="object-contain p-1.5"
                priority
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[--color-primary] drop-shadow-sm">
                AIEARN
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[--color-foreground]">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="scroll-area flex-1 space-y-1 overflow-y-auto px-3 py-3">
          <div className="mb-1.5 px-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[--color-mutedForeground]">
              Navigation
            </p>
          </div>
          {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
            const isActive = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={clsx(
                  'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-300',
                  'hover:translate-x-1 hover:shadow-lg',
                  isActive
                    ? 'bg-gradient-to-r from-[--color-primary]/25 via-[--color-primary]/15 to-[--color-accent]/10 text-[--color-foreground] shadow-xl shadow-[--color-primary]/10 before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[--color-primary] before:via-[--color-accent] before:to-[--color-primary] before:shadow-lg before:shadow-[--color-primary]/50'
                    : 'text-[--color-mutedForeground] hover:bg-gradient-to-r hover:from-white/5 hover:to-white/0 hover:text-[--color-foreground]'
                )}
              >
                {/* Animated background effect */}
                {isActive && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[--color-primary]/10 to-transparent opacity-50 animate-pulse"></div>
                )}
                
                <div
                  className={clsx(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-br from-[--color-primary]/40 via-[--color-accent]/30 to-[--color-primary]/40 shadow-lg shadow-[--color-primary]/30 ring-2 ring-[--color-primary]/20'
                      : 'bg-gradient-to-br from-white/5 to-white/0 group-hover:from-white/10 group-hover:to-white/5 group-hover:shadow-md'
                  )}
                >
                  <Icon
                    className={clsx(
                      'h-4 w-4 transition-all duration-300 relative z-10',
                      isActive
                        ? 'scale-110 text-[--color-primary] drop-shadow-sm'
                        : 'text-[--color-mutedForeground] group-hover:text-[--color-foreground] group-hover:scale-110'
                    )}
                  />
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-white/20 to-transparent"></div>
                  )}
                </div>
                <span className={clsx(
                  'relative z-10 flex-1 font-medium transition-all duration-200',
                  isActive && 'drop-shadow-sm'
                )}>
                  {label}
                </span>
                {badge && (
                  <span className="badge relative z-10 animate-pulse text-[9px]" data-tone="danger">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section - Fixed */}
        <div className="flex-shrink-0 space-y-2 border-t border-white/5 bg-gradient-to-t from-white/5 to-transparent px-4 pt-3 pb-4"></div>
      </aside>
    </>
  );
};


