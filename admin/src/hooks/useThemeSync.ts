"use client";

import { useEffect } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import type { ThemePalette } from '@/lib/slices/themeSlice';

const applyPalette = (palette: ThemePalette, mode: string) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.themeMode = mode;

  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
};

export const useThemeSync = () => {
  const { palette, mode } = useAppSelector((state) => state.theme);

  useEffect(() => {
    applyPalette(palette, mode);
  }, [palette, mode]);
};




