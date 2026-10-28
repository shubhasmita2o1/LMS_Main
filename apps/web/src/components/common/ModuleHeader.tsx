import React from 'react';
import { Plus, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface StatPill {
  label: string;
  value: string | number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  stats?: StatPill[];
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  actions?: React.ReactNode;
  backUrl?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ModuleHeader({
  title,
  subtitle,
  breadcrumbs,
  stats,
  primaryAction,
  secondaryAction,
  actions,
  backUrl,
  onRefresh,
  isRefreshing = false,
}: ModuleHeaderProps) {
  const navigate = useNavigate();

  const getPillClasses = (variant: StatPill['variant'] = 'default') => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-50 text-primary-700 border-primary-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <span className="text-slate-300">/</span>}
              {crumb.href ? (
                <button
                  type="button"
                  onClick={() => navigate(crumb.href!)}
                  className="hover:text-primary-600 transition"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="font-semibold text-slate-800">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {backUrl && (
            <button
              type="button"
              onClick={() => navigate(backUrl)}
              className="mt-1 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#165239]' : ''}`} />
                </button>
              )}
            </div>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {actions}
          {stats && stats.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 mr-2">
              {stats.map((st) => (
                <div
                  key={st.label}
                  className={`px-3.5 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${getPillClasses(
                    st.variant
                  )}`}
                >
                  <span className="opacity-75">{st.label}:</span>
                  <span className="font-bold">{st.value}</span>
                </div>
              ))}
            </div>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-5 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-2xs"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="px-5 py-2.5 rounded-full bg-[#165239] hover:bg-[#11402c] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition"
            >
              {primaryAction.icon || <Plus className="w-4 h-4" />}
              <span>{primaryAction.label}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default ModuleHeader;
