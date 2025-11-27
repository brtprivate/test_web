"use client";

import { forwardRef, InputHTMLAttributes } from 'react';
import clsx from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <label className="flex w-full flex-col gap-1.5 text-sm text-[--color-mutedForeground]">
        {label && <span className="font-semibold">{label}</span>}
        <input
          ref={ref}
          className={clsx(
            'w-full rounded-2xl border bg-transparent px-4 py-3 text-[--color-foreground] outline-none transition-all duration-150',
            'border-white/10 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/20',
            error && 'border-[--color-danger] focus:ring-[--color-danger]/30',
            className
          )}
          {...props}
        />
        {error ? (
          <span className="text-xs text-[--color-danger]">{error}</span>
        ) : (
          hint && <span className="text-xs text-[--color-mutedForeground]">{hint}</span>
        )}
      </label>
    );
  }
);

Input.displayName = 'Input';




