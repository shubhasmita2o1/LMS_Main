import type { HTMLAttributes, ReactNode } from 'react';

export interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
}

export function SurfaceCard({
  children,
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}: SurfaceCardProps) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4 sm:p-5',
    md: 'p-6 sm:p-7',
    lg: 'p-8 sm:p-9',
  }[padding];

  const interactiveStyles = interactive
    ? 'card-interactive cursor-pointer hover:border-slate-300/80'
    : '';

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/70 shadow-card transition-all duration-200 overflow-hidden ${paddingStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
