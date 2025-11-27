/**
 * Stat Card Component
 * Beautiful stat card for displaying metrics
 */

'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  gradient?: 'green' | 'blue' | 'purple' | 'orange';
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient = 'green',
  className = '',
}: StatCardProps) {
  const gradientClasses = {
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-pink-600',
    orange: 'from-orange-500 to-red-600',
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-br ${gradientClasses[gradient]}
        p-4 sm:p-5 shadow-lg
        ${className}
      `}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs sm:text-sm font-medium text-white/90 uppercase tracking-wide">
            {title}
          </p>
          {icon && (
            <div className="text-white/80">{icon}</div>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs sm:text-sm text-white/80">{subtitle}</p>
        )}
      </div>
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>
      </div>
    </div>
  );
}








