import { useState, useEffect } from 'react';
import { Pause, Play, Square } from 'lucide-react';

export interface TimeTrackerCardProps {
  label?: string;
  initialSeconds?: number;
  className?: string;
}

export function TimeTrackerCard({
  label = 'Time Tracker',
  initialSeconds = 5048, // 01:24:08
  className = '',
}: TimeTrackerCardProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      className={`rounded-3xl p-6 bg-gradient-to-br from-[#165239] via-[#0f3d2a] to-[#0a261a] text-white shadow-pill relative overflow-hidden flex flex-col justify-between ${className}`}
    >
      {/* Decorative subtle texture wave */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#6ee7b7_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs font-semibold text-emerald-200/90">{label}</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-emerald-300 backdrop-blur-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          {isRunning ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="relative z-10 my-4 text-center">
        <div className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-white drop-shadow-sm select-none">
          {formatTime(seconds)}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className="w-10 h-10 rounded-full bg-white text-[#165239] hover:bg-emerald-50 flex items-center justify-center transition shadow-xs active:scale-95"
          title={isRunning ? 'Pause' : 'Resume'}
        >
          {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRunning(false);
            setSeconds(0);
          }}
          className="w-10 h-10 rounded-full bg-rose-500/90 hover:bg-rose-600 text-white flex items-center justify-center transition shadow-xs active:scale-95"
          title="Reset"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
}
