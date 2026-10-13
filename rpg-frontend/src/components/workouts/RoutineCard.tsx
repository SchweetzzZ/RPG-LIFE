import { Link } from '@tanstack/react-router';
import { Dumbbell, Clock, ChevronRight, Play, NotebookPen } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Routine } from '../../types/workout';
import { WEEK_DAYS } from '../../types/workout';

interface RoutineCardProps {
  routine: Routine;
  isToday: boolean;
  onLog: (routine: Routine) => void;
  onStartTimer: (routine: Routine) => void;
}

const formatDate = (iso: string) => iso.split('-').reverse().join('/');

export function RoutineCard({ routine, isToday, onLog, onStartTimer }: RoutineCardProps) {
  return (
    <div
      className={`rounded-lg border-2 bg-surface p-4 shadow-[0_4px_0_0_#0c0a08] ${
        isToday ? 'border-action' : 'border-line'
      }`}
    >
      <Link
        to="/workouts/$id"
        params={{ id: routine.id }}
        className="flex min-h-[44px] items-start justify-between gap-3"
        aria-label={`Abrir ${routine.title}`}
      >
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            {isToday && (
              <span className="rounded border-2 border-action px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-action">
                Treino do dia
              </span>
            )}
            <span>{routine.exercises.length} exercícios</span>
            {routine.scheduledDays.length > 0 && (
              <span>{[...routine.scheduledDays].sort().map((d) => WEEK_DAYS[d]).join(' ')}</span>
            )}
          </div>
          <h3 className="truncate font-pixel text-lg text-ink">{routine.title}</h3>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-ink-faint" />
      </Link>

      <div className="mt-3 flex flex-col gap-3 border-t-2 border-line pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-dim">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-ink-faint" />
            {routine.estimatedMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4 text-ink-faint" />
            {routine.completionCount}x feito
          </span>
          {routine.lastCompletedDate && <span>último: {formatDate(routine.lastCompletedDate)}</span>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => onLog(routine)}>
            <NotebookPen className="h-4 w-4" />
            <span>Registrar</span>
          </Button>
          <Button variant={isToday ? 'primary' : 'secondary'} onClick={() => onStartTimer(routine)}>
            <Play className="h-4 w-4" />
            <span>Com cronômetro</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
