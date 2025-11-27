/**
 * Theme Provider
 * Manages theme state and applies theme to document
 * Default theme: Light (White)
 */

'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme } from '@/lib/slices/themeSlice';
import { RootState } from '@/lib/store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);

  useEffect(() => {
    // Initialize theme on mount - default to light (white) theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const initialTheme = savedTheme || 'light'; // Default to light (white)
    
    // Apply theme to document immediately
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);
    
    // Set theme in Redux
    dispatch(setTheme(initialTheme));
  }, [dispatch]); // Run only on mount

  useEffect(() => {
    // Apply theme to document when theme changes
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}

