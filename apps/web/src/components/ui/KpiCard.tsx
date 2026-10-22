import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export interface KpiCardProps {
  label?: string;
  title?: string;
  value: string | number;
  hint?: ReactNode;
  change?: ReactNode;
  trend?: 'up' | 'down' | 'neutral' | string;
  subtitle?: string;
  variant?: 'primary' | 'default';
  icon?: any;
  to?: string;
  badge?: ReactNode;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info' | string;
  className?: string;
}

export function KpiCard({
  label,
  title,
  value,
  hint,
  change,
  trend,
  subtitle,
  variant = 'default',
  icon,
  to,
  badge,
  badgeVariant = 'warning',
  className = '',
}: KpiCardProps) {
  const isPrimary = variant === 'primary';
  const displayTitle = label || title || '';
  const resolvedHint =
    hint ||
    (change ? (
      <span className="inline-flex items-center gap-1">
        {trend === 'up' && <span className="text-emerald-500 font-bold">↑</span>}
        {trend === 'down' && <span className="text-rose-500 font-bold">↓</span>}
        <span>{change}</span>
      </span>
    ) : (
      subtitle
    ));
  const IconComponent = icon;

  const content = (
    <div
      className={`rounded-3xl p-6 transition-all duration-200 h-full flex flex-col justify-between ${
        isPrimary
          ? 'bg-[#165239] text-white shadow-pill border border-[#165239]/60 hover:bg-[#1f6b4c]'
          : 'bg-white text-slate-900 border border-slate-200/70 shadow-card hover:shadow-cardHover hover:border-slate-300/80'
      } ${to ? 'card-interactive cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {IconComponent && (
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                isPrimary ? 'bg-white/15 text-emerald-200' : 'bg-[#eaf5ee] text-[#165239]'
              }`}
            >
              <IconComponent className="w-4 h-4" />
            </div>
          )}
          <span
            className={`text-sm font-semibold tracking-tight ${
              isPrimary ? 'text-emerald-100' : 'text-slate-500'
            }`}
          >
            {displayTitle}
          </span>
        </div>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
            isPrimary
              ? 'bg-white/15 text-white backdrop-blur-sm'
              : 'border border-slate-200 text-slate-500 bg-slate-50/50'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      <div className="my-3">
        <div
          className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
            isPrimary ? 'text-white' : 'text-slate-900'
          }`}
        >
          {value}
        </div>
      </div>

      {(resolvedHint || badge) && (
        <div className="mt-1 flex items-center justify-between gap-1.5 text-xs flex-wrap">
          {resolvedHint && (
            typeof resolvedHint === 'string' ? (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${
                  isPrimary
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {resolvedHint}
              </span>
            ) : (
              resolvedHint
            )
          )}
          {badge && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                badgeVariant === 'success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : badgeVariant === 'warning'
                  ? 'bg-amber-100 text-amber-800'
                  : badgeVariant === 'danger'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block group h-full">
        {content}
      </Link>
    );
  }

  return content;
}
