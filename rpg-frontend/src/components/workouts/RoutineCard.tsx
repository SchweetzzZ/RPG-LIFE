import React from 'react';
import { Dumbbell, Flame, Coins, Clock, ChevronRight, Play } from 'lucide-react';

export interface WorkoutRoutine {
  id: string;
  name: string;
  description?: string;
  muscleGroups: string[];
  estimatedMinutes: number;
  estimatedCalories: number;
  coinsReward: number;
  exercisesCount: number;
}

interface RoutineCardProps {
  routine: WorkoutRoutine;
  isToday?: boolean;
  onStart: (routine: WorkoutRoutine) => void;
}

export function RoutineCard({ routine, isToday = false, onStart }: RoutineCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
        isToday
          ? 'border-rose-500/30 bg-gradient-to-b from-rose-950/15 via-[#0c0e12] to-[#0c0e12] shadow-xl'
          : 'border-white/[0.08] bg-[#0c0e12] hover:border-white/[0.15]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {isToday && (
              <span className="inline-flex items-center gap-1 rounded border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400">
                Treino do Dia
              </span>
            )}
            <span className="font-mono text-[11px] text-zinc-500">
              {routine.exercisesCount} exercícios
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
            {routine.name}
          </h3>

          {routine.description && (
            <p className="text-xs text-zinc-400 line-clamp-1">
              {routine.description}
            </p>
          )}

          {/* Tags de Grupos Musculares */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {routine.muscleGroups.map((group) => (
              <span
                key={group}
                className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-zinc-400"
              >
                {group}
              </span>
            ))}
          </div>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-400">
          <Dumbbell className="h-5 w-5 stroke-[1.75]" />
        </div>
      </div>

      {/* Métricas e Botão de Ação */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            {routine.estimatedMinutes} min
          </span>
          <span className="flex items-center gap-1 text-rose-400/90 font-semibold">
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            +{routine.estimatedCalories} kcal
          </span>
          <span className="flex items-center gap-1 text-amber-400/90 font-semibold">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            +{routine.coinsReward} moedas
          </span>
        </div>

        <button
          type="button"
          onClick={() => onStart(routine)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 font-mono text-xs font-bold text-black shadow-lg shadow-rose-500/20 hover:bg-rose-400 active:scale-[0.98] transition-all min-h-[44px]"
        >
          <Play className="h-3.5 w-3.5 fill-black" />
          <span>Iniciar Treino</span>
        </button>
      </div>
    </div>
  );
}
