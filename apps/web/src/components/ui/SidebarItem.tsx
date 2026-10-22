import { Link } from 'react-router-dom';

export interface SidebarItemProps {
  to?: string;
  label: string;
  icon?: any;
  active?: boolean;
  collapsed?: boolean;
  badge?: string | number;
  badgeVariant?: 'primary' | 'warning' | 'danger' | 'success';
  onClick?: () => void;
  className?: string;
}

export function SidebarItem({
  to,
  label,
  icon: Icon,
  active = false,
  collapsed = false,
  badge,
  badgeVariant = 'primary',
  onClick,
  className = '',
}: SidebarItemProps) {
  const content = (
    <div
      className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-150 select-none ${
        active
          ? 'bg-[#eaf5ee] text-[#165239] font-bold shadow-2xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
      } ${collapsed ? 'justify-center px-0 py-2.5' : ''} ${className}`}
      title={collapsed ? label : undefined}
      onClick={onClick}
    >
      {/* Active Indicator bar on left */}
      {active && !collapsed && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#165239] rounded-full" />
      )}
      {Icon && (
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            active ? 'text-[#165239]' : 'text-slate-400 group-hover:text-slate-600'
          }`}
        />
      )}
      {!collapsed && (
        <div className="flex-1 flex items-center justify-between min-w-0">
          <span className="truncate">{label}</span>
          {badge !== undefined && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1.5 shrink-0 ${
                badgeVariant === 'danger'
                  ? 'bg-rose-100 text-rose-700'
                  : badgeVariant === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : badgeVariant === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-[#165239] text-white'
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
      <Link to={to} className="block group">
        {content}
      </Link>
    );
  }

  return <div className="group cursor-pointer">{content}</div>;
}
