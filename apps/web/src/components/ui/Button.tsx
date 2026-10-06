import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white shadow-sm focus-visible:ring-primary-500 disabled:bg-primary-300',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-sm focus-visible:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-400',
  outline:
    'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm focus-visible:ring-primary-500 disabled:bg-white disabled:text-slate-300 disabled:border-slate-200',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400 disabled:text-slate-300',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-sm focus-visible:ring-red-500 disabled:bg-red-300',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-medium rounded-xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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

Button.displayName = 'Button';

export default Button;
