import type { HTMLAttributes, ReactNode } from 'react';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  label?: ReactNode;
  status?: string;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/70',
  danger: 'bg-rose-50 text-rose-800 border-rose-200/70',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200/70',
  primary: 'bg-[#eaf5ee] text-[#165239] border-emerald-200/70',
  info: 'bg-blue-50 text-blue-700 border-blue-200/70',
};

const dotColors = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-slate-400',
  primary: 'bg-[#165239]',
  info: 'bg-blue-500',
};

const sizeStyles = {
  sm: 'px-2.5 py-0.5 text-[11px]',
  md: 'px-3 py-1 text-xs',
};

export function StatusBadge({
  children,
  label,
  status,
  variant,
  size = 'sm',
  dot = false,
  className = '',
  ...props
}: StatusBadgeProps) {
  let computedVariant: 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info' = variant || 'neutral';
  if (!variant && status) {
    const s = status.toLowerCase();
    if (['active', 'published', 'graded', 'approved', 'success', 'open', 'completed'].includes(s)) {
      computedVariant = 'success';
    } else if (['pending', 'warning', 'locked', 'trialing', 'past_due', 'review'].includes(s)) {
      computedVariant = 'warning';
    } else if (['danger', 'rejected', 'suspended', 'error', 'failed', 'inactive', 'canceled'].includes(s)) {
      computedVariant = 'danger';
    } else if (['info', 'primary', 'submitted', 'in_progress'].includes(s)) {
      computedVariant = 'primary';
    } else {
      computedVariant = 'neutral';
    }
  }

  const content = children ?? label ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles[computedVariant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[computedVariant]}`}
        />
      )}
      <span className="capitalize">{content}</span>
    </span>
  );
}
