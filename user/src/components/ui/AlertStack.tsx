'use client';

import type { JSX } from 'react';
import { AlertItem } from '@/hooks/useAlerts';

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

interface AlertStackProps {
  alerts: AlertItem[];
  onClose?: (id: string) => void;
  position?: 'top' | 'bottom';
}

const COLORS: Record<AlertItem['type'], string> = {
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
};

const ICONS: Record<AlertItem['type'], JSX.Element> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a1 1 0 00.86 1.5h18.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.72 0z" />
    </svg>
  ),
};

export default function AlertStack({ alerts, onClose, position = 'top' }: AlertStackProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none',
        position === 'top' ? 'top-4 sm:top-6' : 'bottom-4 sm:bottom-6'
      )}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-3 pointer-events-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm',
              COLORS[alert.type]
            )}
          >
            <div className="mt-0.5">{ICONS[alert.type]}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{alert.message}</p>
              {alert.details && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-200">{alert.details}</p>
              )}
            </div>
            {onClose && (
              <button
                onClick={() => onClose(alert.id)}
                className="rounded-full p-1 text-xs text-gray-500 hover:bg-black/5"
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


