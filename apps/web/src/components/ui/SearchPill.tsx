import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

export interface SearchPillProps extends InputHTMLAttributes<HTMLInputElement> {
  onShortcutClick?: () => void;
  className?: string;
}

export function SearchPill({
  placeholder = 'Search task, course, or student...',
  onShortcutClick,
  className = '',
  ...props
}: SearchPillProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
      <input
        type="search"
        placeholder={placeholder}
        className="w-full sm:w-64 md:w-80 pl-10 pr-12 py-2 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all shadow-sm"
        {...props}
      />
      <button
        type="button"
        onClick={onShortcutClick}
        className="absolute right-3 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200 hover:bg-slate-200"
      >
        ⌘K
      </button>
    </div>
  );
}
