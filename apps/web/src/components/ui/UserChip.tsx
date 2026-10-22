import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface UserChipProps {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  initials?: string;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
  children?: ReactNode;
}

export function UserChip({
  name,
  email,
  role,
  avatarUrl,
  initials,
  onClick,
  showChevron = true,
  className = '',
  children,
}: UserChipProps) {
  const displayInitials =
    initials ||
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    'U';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 py-1 px-1.5 sm:px-2 rounded-full hover:bg-slate-100 transition-all text-left select-none ${className}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-[#165239] text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-[#165239]/20 shrink-0">
          {displayInitials}
        </div>
      )}

      <div className="hidden lg:block text-left min-w-0">
        <div className="text-xs font-bold text-slate-900 leading-tight truncate">
          {name}
        </div>
        {(email || role) && (
          <div className="text-[10px] font-medium text-slate-400 truncate max-w-[160px]">
            {email || role}
          </div>
        )}
      </div>

      {showChevron && (
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block shrink-0" />
      )}
      {children}
    </button>
  );
}
