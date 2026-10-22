export interface ProgressRingProps {
  percent: number;
  label?: string;
  completedPercent?: number;
  inProgressPercent?: number;
  pendingPercent?: number;
  completedLabel?: string;
  inProgressLabel?: string;
  pendingLabel?: string;
  className?: string;
}

export function ProgressRing({
  percent,
  label = 'Completed',
  inProgressPercent,
  completedLabel = 'Completed',
  inProgressLabel = 'In Progress',
  pendingLabel = 'Pending',
  className = '',
}: ProgressRingProps) {
  // SVG semi-circle gauge configuration
  const radius = 70;
  const strokeWidth = 18;
  const circumference = Math.PI * radius; // Half-circle circumference

  const clampedPercent = Math.min(100, Math.max(0, percent));
  const activeStroke = (clampedPercent / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
        <svg
          viewBox="0 0 160 90"
          className="w-full h-full transform"
        >
          {/* Background track (Pending/Remaining) */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Mint track for In Progress (if present) */}
          {inProgressPercent !== undefined && inProgressPercent > 0 && (
            <path
              d="M 10 80 A 70 70 0 0 1 150 80"
              fill="none"
              stroke="#6ee7b7"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - ((clampedPercent + inProgressPercent) / 100) * circumference}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )}
          {/* Dark Forest Green main arc */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="#165239"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - activeStroke}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute bottom-1 text-center select-none">
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
            {clampedPercent}%
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            {label}
          </div>
        </div>
      </div>

      {/* Legend below the gauge */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#165239]" />
          <span className="text-slate-700 font-medium">{completedLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6ee7b7]" />
          <span className="text-slate-700 font-medium">{inProgressLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="text-slate-500 font-medium">{pendingLabel}</span>
        </div>
      </div>
    </div>
  );
}
