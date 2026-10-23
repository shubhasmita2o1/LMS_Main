import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from './Spinner';

export interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  icon?: any;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  to?: string;
  href?: string;
}

const variantStyles = {
  primary:
    'bg-[#165239] hover:bg-[#1f6b4c] text-white shadow-pill border border-transparent font-bold active:scale-[0.98]',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-sm font-semibold hover:border-slate-300 active:scale-[0.98]',
  outline:
    'bg-transparent hover:bg-[#eaf5ee] text-[#165239] border border-[#165239]/40 font-semibold active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 border border-transparent font-medium active:scale-[0.98]',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-transparent font-semibold active:scale-[0.98]',
};

const sizeStyles = {
  sm: 'px-3.5 py-1.5 text-xs rounded-full gap-1.5',
  md: 'px-5 py-2.5 text-xs sm:text-sm rounded-full gap-2',
  lg: 'px-6 py-3 text-sm sm:text-base rounded-full gap-2.5',
};

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      icon,
      leftIcon,
      rightIcon,
      to,
      href,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const activeLoading = isLoading || loading;
    const IconComponent = icon;
    const resolvedLeftIcon = leftIcon || (IconComponent ? <IconComponent className="w-4 h-4 shrink-0" /> : null);
    const targetUrl = to || href;
    const baseClass = `inline-flex items-center justify-center transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    if (targetUrl && !disabled && !activeLoading) {
      return (
        <Link to={targetUrl} className={baseClass}>
          {resolvedLeftIcon && <span className="inline-flex shrink-0">{resolvedLeftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={baseClass}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size={size === 'lg' ? 'md' : 'sm'} className="mr-2" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

PillButton.displayName = 'PillButton';
