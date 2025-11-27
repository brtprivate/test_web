"use client";

import { PropsWithChildren, useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { initStore } from '@/lib/store';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { hydrateTheme } from '@/lib/slices/themeSlice';

const ThemeBridge = ({ children }: PropsWithChildren) => {
  const dispatch = useAppDispatch();
  useThemeSync();
  useEffect(() => {
    dispatch(hydrateTheme());
  }, [dispatch]);
  return children;
};

export const AppProviders = ({ children }: PropsWithChildren) => {
  const store = initStore();

  return (
    <Provider store={store}>
      <ThemeBridge>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: 'font-medium',
          }}
        />
      </ThemeBridge>
    </Provider>
  );
};


