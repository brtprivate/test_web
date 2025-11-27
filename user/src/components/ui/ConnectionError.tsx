/**
 * Connection Error Component
 * Shows user-friendly error message when API connection fails
 */

'use client';

import { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';

interface ConnectionErrorProps {
  onRetry?: () => void;
}

export default function ConnectionError({ onRetry }: ConnectionErrorProps) {
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');
    }
  }, []);

  return (
    <Card className="border-red-200 bg-red-50">
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-red-900 mb-1">
            Connection Error
          </h3>
          <p className="text-xs sm:text-sm text-red-700 mb-3">
            Unable to connect to the server. Please make sure:
          </p>
          <ul className="text-xs sm:text-sm text-red-700 space-y-1 mb-3 list-disc list-inside">
            <li>Server is running (check server terminal)</li>
            <li>Server port matches API URL in .env.local</li>
            <li>Check NEXT_PUBLIC_API_URL in .env.local file</li>
            <li>Verify server is accessible at the configured URL</li>
            <li>No firewall is blocking the connection</li>
          </ul>
          <div className="mt-3 p-2 bg-white rounded border border-red-200">
            <p className="text-xs font-semibold text-red-900 mb-1">Current API URL:</p>
            <p className="text-xs font-mono text-red-800 break-all">
              {apiUrl || 'Not configured'}
            </p>
            <p className="text-xs text-red-600 mt-2">
              💡 Make sure server is running on the same port!
            </p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              Retry Connection
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

