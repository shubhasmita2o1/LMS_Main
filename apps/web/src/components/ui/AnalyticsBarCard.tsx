import { useState } from 'react';

export interface DayData {
  day: string;
  heightPercent: number;
  highlight?: boolean;
  tooltip?: string;
  striped?: boolean;
}

export interface AnalyticsBarCardProps {
  title?: string;
  subtitle?: string;
  data?: DayData[];
  className?: string;
}

const DEFAULT_DAYS: DayData[] = [
  { day: 'S', heightPercent: 45, striped: true },
  { day: 'M', heightPercent: 75, highlight: true },
  { day: 'T', heightPercent: 60, tooltip: '74%' },
  { day: 'W', heightPercent: 95, highlight: true },
  { day: 'T', heightPercent: 40, striped: true },
  { day: 'F', heightPercent: 50, striped: true },
  { day: 'S', heightPercent: 35, striped: true },
];

export function AnalyticsBarCard({
  title = 'Activity Analytics',
  subtitle,
  data = DEFAULT_DAYS,
  className = '',
}: AnalyticsBarCardProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className={`bg-white rounded-3xl p-6 border border-slate-200/70 shadow-card flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Pill Bars Container */}
      <div className="h-44 sm:h-48 flex items-end justify-between gap-2 px-2 pt-6">
        {data.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          const showTooltip = item.tooltip || isHovered;

          return (
            <div
              key={`${item.day}-${idx}`}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              <div className="h-6 flex items-center justify-center mb-1">
                {showTooltip && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shadow-xs animate-fadeIn whitespace-nowrap">
                    {item.tooltip || `${item.heightPercent}%`}
                  </span>
                )}
              </div>

              {/* Bar Pill */}
              <div className="w-full max-w-[36px] bg-slate-100 rounded-full h-full max-h-[140px] flex items-end p-0.5 overflow-hidden">
                <div
                  style={{ height: `${item.heightPercent}%` }}
                  className={`w-full rounded-full transition-all duration-300 ${
                    item.highlight
                      ? 'bg-[#165239] group-hover:bg-[#12422e]'
                      : item.tooltip
                      ? 'bg-[#34b27b] group-hover:bg-[#288f63]'
                      : item.striped
                      ? 'bg-slate-200/90 group-hover:bg-slate-300'
                      : 'bg-emerald-200 group-hover:bg-emerald-300'
                  }`}
                />
              </div>

              {/* Day Label */}
              <span className="mt-2 text-xs font-semibold text-slate-400 group-hover:text-slate-800 transition-colors">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
