import { Link } from 'react-router-dom';
import { Video, Calendar } from 'lucide-react';

export interface ReminderCardProps {
  label?: string;
  title: string;
  time: string;
  actionLabel?: string;
  onAction?: () => void;
  to?: string;
  className?: string;
}

export function ReminderCard({
  label = 'Reminders',
  title = 'Faculty Senate & Board Review',
  time = 'Time : 02.00 pm - 04.00 pm',
  actionLabel = 'Start Meeting',
  onAction,
  to,
  className = '',
}: ReminderCardProps) {
  const buttonContent = (
    <>
      <Video className="w-4 h-4 fill-white" />
      <span>{actionLabel}</span>
    </>
  );

  return (
    <div
      className={`bg-white rounded-3xl p-6 border border-slate-200/70 shadow-card flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">{time}</p>
      </div>

      <div className="mt-6">
        {to ? (
          <Link
            to={to}
            className="w-full py-3 px-5 rounded-full bg-[#165239] hover:bg-[#12422e] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-pill active:scale-[0.98]"
          >
            {buttonContent}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="w-full py-3 px-5 rounded-full bg-[#165239] hover:bg-[#12422e] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-pill active:scale-[0.98]"
          >
            {buttonContent}
          </button>
        )}
      </div>
    </div>
  );
}
