/**
 * Card Component
 * Reusable card component with mobile-first design
 */

'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`
        bg-white
        rounded-xl
        shadow-sm border border-gray-200
        p-4 sm:p-5 md:p-6
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 active:scale-[0.98]' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

