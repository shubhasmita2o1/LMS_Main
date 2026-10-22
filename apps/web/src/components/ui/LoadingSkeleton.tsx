export interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'line' | 'circle' | 'pill';
  count?: number;
}

export function LoadingSkeleton({
  className = '',
  variant = 'line',
  count = 1,
}: LoadingSkeletonProps) {
  const variantClass = {
    card: 'h-36 rounded-3xl bg-slate-100/80 animate-pulse border border-slate-100',
    line: 'h-4 rounded-full bg-slate-100/90 animate-pulse',
    circle: 'w-10 h-10 rounded-full bg-slate-100/90 animate-pulse',
    pill: 'h-8 rounded-full bg-slate-100/90 animate-pulse',
  }[variant];

  if (count === 1) {
    return <div className={`${variantClass} ${className}`} />;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${variantClass} ${className}`} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-3xl p-6 bg-white border border-slate-200/60 shadow-card animate-pulse space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="h-4 w-28 bg-slate-100 rounded-full" />
        <div className="w-8 h-8 rounded-full bg-slate-100" />
      </div>
      <div className="h-9 w-20 bg-slate-100 rounded-full" />
      <div className="h-4 w-36 bg-slate-100 rounded-full" />
    </div>
  );
}
