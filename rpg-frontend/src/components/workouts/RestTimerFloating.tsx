import React, { useEffect, useState } from 'react';
import { Timer, Plus, SkipForward, Play, Pause } from 'lucide-react';

interface RestTimerFloatingProps {
  initialSeconds?: number;
  onFinish?: () => void;
  onClose?: () => void;
}

export function RestTimerFloating({
  initialSeconds = 90,
  onFinish,
  onClose,
}: RestTimerFloatingProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      if (onFinish) onFinish();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds, onFinish]);

  const addTime = (amount: number) => {
    setSeconds((prev) => prev + amount);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (seconds / initialSeconds) * 100));

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-sm rounded-2xl border border-rose-500/30 bg-[#0f1117]/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-200">
      {/* Barra de progresso do descanso */}
      <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-2xl bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-400">
            <Timer className="h-4 w-4 stroke-[2]" />
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Descanso entre Séries
            </span>
            <span className="font-mono text-2xl font-black tracking-tight text-rose-400 tabular-nums">
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => addTime(30)}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.05] px-2.5 font-mono text-xs font-semibold text-zinc-200 hover:bg-white/[0.1] active:scale-95 transition-all"
          >
            <Plus className="h-3 w-3" />
            <span>30s</span>
          </button>

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1] active:scale-95 transition-all"
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
              title="Pular descanso"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
