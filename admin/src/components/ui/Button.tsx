"use client";

import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[--color-primary] text-[--color-primaryForeground] shadow-[0_10px_30px_rgba(14,165,233,0.25)] hover:opacity-95',
  secondary: 'bg-[--color-accent] text-[--color-accentForeground] hover:opacity-95',
  ghost: 'bg-transparent border border-[--color-border] text-[--color-foreground] hover:bg-white/5',
  outline:
    'bg-transparent border-2 border-white/20 text-[--color-foreground] hover:border-white/40',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading, disabled, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'pill-button flex items-center justify-center gap-2 transition-all duration-150',
          variantClasses[variant],
          (disabled || loading) && 'opacity-60 cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/50 border-t-transparent" />
        )}
        {icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';




