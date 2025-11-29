/**
 * Bottom Navigation Bar
 * Mobile-first bottom navigation with 3 tabs
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'AiCrypto',
    path: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Friends',
    path: '/friends',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Intro',
    path: '/introduction',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'AiCrypto',
      path: '/',
      icon: (
        <div className="relative w-6 h-6">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#111827" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" fill="#111827" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" fill="#111827" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="1" fill="#4ADE80" />
            <circle cx="12" cy="17" r="1" fill="#4ADE80" />
            <circle cx="7" cy="9.5" r="1" fill="#4ADE80" />
            <circle cx="17" cy="9.5" r="1" fill="#4ADE80" />
            <circle cx="7" cy="14.5" r="1" fill="#4ADE80" />
            <circle cx="17" cy="14.5" r="1" fill="#4ADE80" />
            <circle cx="12" cy="12" r="1.5" fill="#4ADE80" />
          </svg>
        </div>
      ),
      activeColor: 'text-gray-900',
      inactiveColor: 'text-gray-900',
    },
    {
      label: 'Friends',
      path: '/friends',
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0 1 1 0 002 0zM16 9a1 1 0 10-2 0 1 1 0 002 0zM8 0a5 5 0 00-5 5v1h10V5a5 5 0 00-5-5z" />
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            <path d="M15 4h1a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V8h-1a1 1 0 110-2h1V5a1 1 0 011-1z" />
          </svg>
        </div>
      ),
      activeColor: 'text-red-500',
      inactiveColor: 'text-red-500',
    },
    {
      label: 'Introduction',
      path: '/introduction',
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#84CC16] flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v8m0-10v.01" />
          </svg>
        </div>
      ),
      activeColor: 'text-gray-900',
      inactiveColor: 'text-gray-900',
    },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50">
      <div className="bg-white rounded-full shadow-xl border border-gray-100 px-2 py-2">
        <div className="grid grid-cols-3 items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center justify-center gap-1"
              >
                <div className="transform transition-transform active:scale-95">
                  {item.icon}
                </div>
                <span className={`text-[11px] font-medium ${item.activeColor}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}






