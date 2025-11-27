/**
 * Redux Provider
 * Wraps the app with Redux store provider
 */

'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '@/lib/store';

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  const store = storeRef.current;

  return <Provider store={store}>{children}</Provider>;
}




