import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantStyles = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-900',
    icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}: AlertProps) {
  const config = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-4 rounded-xl border text-sm transition-all ${config.container} ${className}`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div className="text-slate-700 leading-relaxed text-xs sm:text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-lg focus:outline-none"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Alert;
