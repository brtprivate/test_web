/**
 * Mobile-First Layout Component
 * Responsive layout optimized for mobile devices
 */

'use client';

import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import AppHeader from './AppHeader';

interface MobileLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  showBottomNav?: boolean;
  showHeaderContent?: boolean;
}

export default function MobileLayout({
  children,
  header,
  footer,
  showBottomNav = true,
  showHeaderContent = true
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Mobile First */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            <div className="flex items-center min-w-0 flex-1">
              {header || <AppHeader />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First Padding with bottom nav spacing */}
      <main className={`
        w-full max-w-7xl mx-auto 
        px-3 sm:px-4 md:px-6 lg:px-8 
        py-4 sm:py-6 md:py-8
        flex-1
        ${showBottomNav ? 'pb-20 sm:pb-24' : ''}
      `}>
        {children}
      </main>

      {/* Footer */}
      {footer && !showBottomNav && (
        <footer className="border-t border-gray-200 bg-white mt-auto">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
            {footer}
          </div>
        </footer>
      )}

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNav />}
    </div>
  );
}

