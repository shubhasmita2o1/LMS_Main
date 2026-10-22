import type { ReactNode } from 'react';

export interface PageShellProps {
  children: ReactNode;
  maxWidth?: '5xl' | '6xl' | '7xl' | 'full';
  className?: string;
}

export function PageShell({
  children,
  maxWidth = '7xl',
  className = '',
}: PageShellProps) {
  const maxWidthClass = {
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'w-full',
  }[maxWidth];

  return (
    <div className={`mx-auto ${maxWidthClass} space-y-6 pb-14 ${className}`}>
      {children}
    </div>
  );
}
