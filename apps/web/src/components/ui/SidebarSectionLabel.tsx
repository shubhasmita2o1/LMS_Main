export interface SidebarSectionLabelProps {
  label: string;
  className?: string;
}

export function SidebarSectionLabel({ label, className = '' }: SidebarSectionLabelProps) {
  return (
    <h3
      className={`px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 select-none ${className}`}
    >
      {label}
    </h3>
  );
}
