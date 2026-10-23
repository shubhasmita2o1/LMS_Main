import type { ReactNode } from 'react';

export interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className = '' }: AppShellProps) {
  return (
    <div className={`min-h-screen bg-[#F3F5F7] p-2 sm:p-4 lg:p-6 flex flex-col antialiased selection:bg-[#dcfce7] selection:text-[#165239] ${className}`}>
      <div className="flex-1 flex flex-col bg-white rounded-[24px] sm:rounded-[32px] border border-slate-200/60 shadow-shell overflow-hidden">
        {children}
      </div>
    </div>
  );
}
