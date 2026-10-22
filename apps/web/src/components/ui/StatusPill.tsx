import type { HTMLAttributes, ReactNode } from 'react';

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  label?: ReactNode;
  variant?: 'completed' | 'in_progress' | 'pending' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

const pillVariantStyles = {
  completed: 'bg-[#eaf5ee] text-[#165239] border-emerald-200/60 font-semibold',
  success: 'bg-[#eaf5ee] text-[#165239] border-emerald-200/60 font-semibold',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200/70 font-semibold',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/70 font-semibold',
  pending: 'bg-rose-50 text-rose-700 border-rose-200/70 font-semibold',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/70 font-semibold',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200/70 font-medium',
};

const pillSizeStyles = {
  sm: 'px-2.5 py-0.5 text-[11px]',
  md: 'px-3 py-1 text-xs',
};

export function StatusPill({
  children,
  label,
  variant = 'completed',
  size = 'sm',
  className = '',
  ...props
}: StatusPillProps) {
  const content = children ?? label;
  const style = pillVariantStyles[variant] || pillVariantStyles.neutral;
  const sizeStyle = pillSizeStyles[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border ${style} ${sizeStyle} transition-all duration-150 select-none ${className}`}
      {...props}
    >
      {content}
    </span>
  );
}
