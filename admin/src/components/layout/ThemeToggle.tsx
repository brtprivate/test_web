"use client";

import { Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { setMode } from '@/lib/slices/themeSlice';

export const ThemeToggle = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  const toggleMode = () => {
    dispatch(setMode(mode === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      onClick={toggleMode}
      className={clsx(
        'group flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent px-4 py-2.5 text-sm font-medium text-[--color-foreground] transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:shadow-md'
      )}
    >
      {mode === 'dark' ? (
        <>
          <Sun size={16} className="transition-transform duration-200 group-hover:rotate-12" />
          <span>Light mode</span>
        </>
      ) : (
        <>
          <Moon size={16} className="transition-transform duration-200 group-hover:-rotate-12" />
          <span>Dark mode</span>
        </>
      )}
    </button>
  );
};


