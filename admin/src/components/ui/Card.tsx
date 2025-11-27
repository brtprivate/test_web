import { PropsWithChildren } from 'react';
import clsx from 'clsx';

interface CardProps extends PropsWithChildren {
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Card = ({ className, title, subtitle, actions, children }: CardProps) => {
  return (
    <section className={clsx('card-surface flex flex-col gap-4', className)}>
      {(title || subtitle || actions) && (
        <header className="flex w-full items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-[--color-foreground]">{title}</h3>}
            {subtitle && (
              <p className="text-sm text-[--color-mutedForeground]">{subtitle}</p>
            )}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
};


