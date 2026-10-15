import { useEffect, useState } from 'react';
import { Timer, Plus, SkipForward, Play, Pause } from 'lucide-react';
import { SegmentedBar } from '../ui/SegmentedBar';

interface RestTimerFloatingProps {
  initialSeconds?: number;
  onFinish?: () => void;
  onClose?: () => void;
}

const ghostBtn =
  'inline-flex h-11 min-w-[44px] items-center justify-center gap-1 rounded-lg border-2 border-line bg-raised px-2.5 text-sm font-semibold text-ink hover:border-ink-faint active:translate-y-[1px]';

export function RestTimerFloating({
  initialSeconds = 90,
  onFinish,
  onClose,
}: RestTimerFloatingProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

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

  return (
    <div
      role="timer"
      className="fixed bottom-24 left-3 right-3 z-[55] mx-auto max-w-sm space-y-2 rounded-lg border-2 border-line bg-surface p-3 shadow-[0_4px_0_0_#0c0a08]"
    >
      <SegmentedBar value={seconds} max={Math.max(initialSeconds, seconds)} tone="xp" label="Descanso restante" />

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised text-xp">
            <Timer className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs text-ink-faint">Descanso entre séries</span>
            <span className="font-num text-3xl leading-none text-xp">{formatTime(seconds)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => addTime(30)} className={ghostBtn}>
            <Plus className="h-4 w-4" />
            <span>30s</span>
          </button>

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={ghostBtn}
            aria-label={isActive ? 'Pausar descanso' : 'Retomar descanso'}
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          {onClose && (
            <button type="button" onClick={onClose} className={ghostBtn} title="Pular descanso" aria-label="Pular descanso">
              <SkipForward className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
