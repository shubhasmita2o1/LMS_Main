import type { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'purple' | 'danger';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs sm:text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
