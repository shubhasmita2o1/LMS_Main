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
