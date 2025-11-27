'use client';

import { useCallback, useRef, useState } from 'react';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AlertItem {
  id: string;
  type: AlertType;
  message: string;
  details?: string;
  createdAt: number;
}

interface UseAlertsOptions {
  autoDismissMs?: number | null;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useAlerts = (options?: UseAlertsOptions) => {
  const { autoDismissMs = 6000 } = options || {};
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    const timeoutId = timeoutRefs.current[id];
    if (timeoutId) {
      clearTimeout(timeoutId);
      delete timeoutRefs.current[id];
    }
  }, []);

  const addAlert = useCallback(
    (alert: Omit<AlertItem, 'id' | 'createdAt'>) => {
      const id = generateId();
      const createdAt = Date.now();
      const alertWithId: AlertItem = { ...alert, id, createdAt };

      setAlerts((prev) => [alertWithId, ...prev]);

      if (autoDismissMs && autoDismissMs > 0) {
        const timeoutId = setTimeout(() => removeAlert(id), autoDismissMs);
        timeoutRefs.current[id] = timeoutId;
      }
      return id;
    },
    [autoDismissMs, removeAlert]
  );

  const clearAlerts = useCallback(() => {
    Object.values(timeoutRefs.current).forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutRefs.current = {};
    setAlerts([]);
  }, []);

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
  };
};


