import React, { useState, useEffect } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Clock,
  Flame,
  Coins,
  ChevronDown,
  X,
  Dumbbell,
  Award,
} from 'lucide-react';
import type { WorkoutRoutine } from './RoutineCard';
import { RestTimerFloating } from './RestTimerFloating';

export interface WorkoutSet {
  id: string;
  type: 'W' | 'N' | 'F' | 'D'; // Warmup, Normal, Failure, Dropset
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

interface ActiveWorkoutSessionProps {
  routine: WorkoutRoutine;
  onFinish: (summary: { durationMinutes: number; calories: number; coins: number }) => void;
  onCancel: () => void;
}

export function ActiveWorkoutSession({
  routine,
  onFinish,
  onCancel,
}: ActiveWorkoutSessionProps) {
  const [seconds, setSeconds] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);

  const [exercises, setExercises] = useState<WorkoutExercise[]>([
    {
      id: 'e1',
      name: 'Supino Reto com Barra',
      sets: [
        { id: 's1', type: 'W', weightKg: 40, reps: 15, completed: true },
        { id: 's2', type: 'N', weightKg: 80, reps: 10, completed: true },
        { id: 's3', type: 'N', weightKg: 85, reps: 8, completed: false },
        { id: 's4', type: 'F', weightKg: 90, reps: 6, completed: false },
      ],
    },
    {
      id: 'e2',
      name: 'Desenvolvimento Militar com Halteres',
      sets: [
        { id: 's5', type: 'N', weightKg: 24, reps: 10, completed: false },
        { id: 's6', type: 'N', weightKg: 26, reps: 8, completed: false },
        { id: 's7', type: 'D', weightKg: 20, reps: 12, completed: false },
      ],
    },
    {
      id: 'e3',
      name: 'Tríceps Corda na Polia',
      sets: [
        { id: 's8', type: 'N', weightKg: 35, reps: 12, completed: false },
        { id: 's9', type: 'N', weightKg: 40, reps: 10, completed: false },
      ],
    },
  ]);

  // Cronômetro da sessão
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set) => {
            if (set.id !== setId) return set;
            const nextCompleted = !set.completed;
            if (nextCompleted) {
              // Dispara o rest timer ao concluir a série
              setShowRestTimer(true);
            }
            return { ...set, completed: nextCompleted };
          }),
        };
      })
    );
  };

  const updateSetField = (
    exerciseId: string,
    setId: string,
    field: 'weightKg' | 'reps',
    value: number
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set) => {
            if (set.id !== setId) return set;
            return { ...set, [field]: value };
          }),
        };
      })
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `s_${Date.now()}`,
          type: 'N',
          weightKg: lastSet ? lastSet.weightKg : 20,
          reps: lastSet ? lastSet.reps : 10,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
      })
    );
  };

  const setTypeLabels: Record<string, { label: string; color: string }> = {
    W: { label: 'AQUECIMENTO', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    N: { label: 'NORMAL', color: 'text-zinc-400 bg-zinc-800/40 border-white/[0.08]' },
    F: { label: 'FALHA', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    D: { label: 'DROP-SET', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#08090a] text-zinc-100 pb-36">
      {/* Header Fixo da Sessão */}
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#0c0e12]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-zinc-100">
                {routine.name}
              </h2>
              <div className="flex items-center gap-2 font-mono text-xs text-rose-400">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-bold tabular-nums">{formatElapsed(seconds)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onFinish({
                durationMinutes: Math.max(1, Math.round(seconds / 60)),
                calories: routine.estimatedCalories,
                coins: routine.coinsReward,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 font-mono text-xs font-bold text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all min-h-[40px]"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>Concluir</span>
          </button>
        </div>
      </header>

      {/* Lista de Exercícios */}
      <main className="mx-auto max-w-2xl p-4 space-y-5">
        {exercises.map((exercise, exIndex) => (
          <div
            key={exercise.id}
            className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 font-mono text-xs font-bold text-zinc-300">
                  {exIndex + 1}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                  {exercise.name}
                </h3>
              </div>
            </div>

            {/* Cabeçalho da Tabela de Séries */}
            <div className="mt-3 grid grid-cols-12 gap-2 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-500 pb-1">
              <span className="col-span-2 text-left pl-1">Set</span>
              <span className="col-span-4">Carga (kg)</span>
              <span className="col-span-3">Reps</span>
              <span className="col-span-3 text-right pr-1">Status</span>
            </div>

            {/* Linhas de Séries */}
            <div className="space-y-2 mt-1">
              {exercise.sets.map((set, setIdx) => {
                const typeInfo = setTypeLabels[set.type] || setTypeLabels.N;
                return (
                  <div
                    key={set.id}
                    className={`grid grid-cols-12 gap-2 items-center rounded-xl border p-2 transition-all ${
                      set.completed
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : 'border-white/[0.06] bg-white/[0.02]'
                    }`}
                  >
                    {/* SET & Tipo */}
                    <div className="col-span-2 flex items-center gap-1.5 pl-1">
                      <span className="font-mono text-xs font-bold text-zinc-400">
                        {setIdx + 1}
                      </span>
                      <span
                        className={`rounded px-1 py-0.5 font-mono text-[9px] font-bold border ${typeInfo.color}`}
                      >
                        {set.type}
                      </span>
                    </div>

                    {/* Campo KG */}
                    <div className="col-span-4 flex items-center justify-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weightKg}
                        onChange={(e) =>
                          updateSetField(exercise.id, set.id, 'weightKg', Number(e.target.value))
                        }
                        className="w-full h-10 rounded-lg border border-white/[0.1] bg-[#08090a] text-center font-mono text-sm font-bold text-zinc-100 focus:border-rose-400/60 focus:outline-none"
                      />
                    </div>

                    {/* Campo Reps */}
                    <div className="col-span-3 flex items-center justify-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps}
                        onChange={(e) =>
                          updateSetField(exercise.id, set.id, 'reps', Number(e.target.value))
                        }
                        className="w-full h-10 rounded-lg border border-white/[0.1] bg-[#08090a] text-center font-mono text-sm font-bold text-zinc-100 focus:border-rose-400/60 focus:outline-none"
                      />
                    </div>

                    {/* Checkbox de Conclusão */}
                    <div className="col-span-3 flex items-center justify-end pr-1 gap-1">
                      <button
                        type="button"
                        onClick={() => toggleSetComplete(exercise.id, set.id)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-95 ${
                          set.completed
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                            : 'border border-white/20 bg-white/[0.05] text-zinc-500 hover:border-white/40'
                        }`}
                      >
                        <Check className="h-5 w-5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botão + Adicionar Série */}
            <button
              type="button"
              onClick={() => addSet(exercise.id)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.12] py-2 font-mono text-xs font-semibold text-zinc-400 hover:border-rose-400/40 hover:text-rose-300 transition-all min-h-[40px]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Série</span>
            </button>
          </div>
        ))}
      </main>

      {/* Timer de descanso flutuante se ativado */}
      {showRestTimer && (
        <RestTimerFloating
          initialSeconds={restSeconds}
          onClose={() => setShowRestTimer(false)}
        />
      )}
    </div>
  );
}
