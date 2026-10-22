import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  description,
  actions,
  badge,
  className = '',
}: SectionHeaderProps) {
  const displaySubtitle = description || subtitle;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 ${className}`}
    >
      <div>
        {badge && <div className="mb-1.5">{badge}</div>}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        {displaySubtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            {displaySubtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
