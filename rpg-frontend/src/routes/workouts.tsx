import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Dumbbell, Plus, Flame, Sparkles, TrendingUp, History } from 'lucide-react';
import { RoutineCard, type WorkoutRoutine } from '../components/workouts/RoutineCard';
import { ActiveWorkoutSession } from '../components/workouts/ActiveWorkoutSession';

export const Route = createFileRoute('/workouts')({
  component: WorkoutsRouteComponent,
});

const mockRoutines: WorkoutRoutine[] = [
  {
    id: 'r1',
    name: 'Treino A: Peito, Ombros e Tríceps',
    description: 'Foco em força no supino reto e desenvolvimento com sobrecarga.',
    muscleGroups: ['Peitoral', 'Deltoides', 'Tríceps'],
    estimatedMinutes: 50,
    estimatedCalories: 380,
    coinsReward: 38,
    exercisesCount: 5,
  },
  {
    id: 'r2',
    name: 'Treino B: Costas, Trapézio e Bíceps',
    description: 'Puxadas pesadas e remadas para densidade de dorsais.',
    muscleGroups: ['Dorsais', 'Trapézio', 'Bíceps'],
    estimatedMinutes: 55,
    estimatedCalories: 420,
    coinsReward: 42,
    exercisesCount: 6,
  },
  {
    id: 'r3',
    name: 'Treino C: Pernas Completo e Abdômen',
    description: 'Agachamento livre, leg press e panturrilhas com alta intensidade.',
    muscleGroups: ['Quadríceps', 'Isquiotibiais', 'Panturrilhas'],
    estimatedMinutes: 60,
    estimatedCalories: 480,
    coinsReward: 48,
    exercisesCount: 6,
  },
];

function WorkoutsRouteComponent() {
  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | null>(null);
  const [completedNotification, setCompletedNotification] = useState<{
    calories: number;
    coins: number;
  } | null>(null);

  const handleStartWorkout = (routine: WorkoutRoutine) => {
    setActiveRoutine(routine);
    setCompletedNotification(null);
  };

  const handleFinishWorkout = (summary: {
    durationMinutes: number;
    calories: number;
    coins: number;
  }) => {
    setActiveRoutine(null);
    setCompletedNotification({
      calories: summary.calories,
      coins: summary.coins,
    });
  };

  return (
    <main className="min-h-screen bg-[#08090a] text-zinc-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* Banner de Treino Concluído com Sucesso */}
        {completedNotification && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <Sparkles className="h-3 w-3" />
                Treino Registrado!
              </span>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                Sua força aumentou no RPG!
              </h3>
              <p className="font-mono text-xs text-zinc-400">
                <span className="text-rose-400 font-semibold">+{completedNotification.calories} kcal queimadas</span> •{' '}
                <span className="text-amber-400 font-semibold">+{completedNotification.coins} moedas creditadas</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCompletedNotification(null)}
              className="rounded-lg border border-white/[0.1] px-3 py-1.5 font-mono text-xs text-zinc-400 hover:text-zinc-200"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Cabeçalho da Seção de Treinos */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-400">
                <Dumbbell className="h-4 w-4 stroke-[2]" />
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-100">
                Treinos & Sobrecarga
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Cada repetição gera calorias gastas e moedas para o seu cofre.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2 font-mono text-xs font-semibold text-zinc-300 hover:border-white/20 transition-all min-h-[40px]"
            >
              <History className="h-3.5 w-3.5 text-zinc-400" />
              <span>Histórico</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2 font-mono text-xs font-bold text-rose-300 hover:bg-rose-500/25 transition-all min-h-[40px]"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Nova Rotina</span>
            </button>
          </div>
        </header>

        {/* Lista de Rotinas Cadastradas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Suas Rotinas de Treino
            </h2>
            <span className="font-mono text-[11px] text-zinc-500">
              {mockRoutines.length} ativas
            </span>
          </div>

          <div className="space-y-3">
            {mockRoutines.map((routine, idx) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                isToday={idx === 0}
                onStart={handleStartWorkout}
              />
            ))}
          </div>
        </section>

        {/* Widget Tático de 1RM & Progressão de Carga */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rose-400 stroke-[2]" />
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Evolução de Carga (1RM Estimado)
              </h3>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">
              Supino Reto
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Carga Máxima Estimada
              </span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl sm:text-3xl font-black text-rose-400 tabular-nums">
                  108.5 kg
                </span>
                <span className="font-mono text-xs text-emerald-400 font-semibold">
                  +4.5 kg este mês
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Última Sessão
              </span>
              <p className="font-mono text-xs text-zinc-300">85 kg x 8 reps</p>
            </div>
          </div>
        </section>
      </div>

      {/* Modal/Overlay da Sessão de Treino Ativo */}
      {activeRoutine && (
        <ActiveWorkoutSession
          routine={activeRoutine}
          onFinish={handleFinishWorkout}
          onCancel={() => setActiveRoutine(null)}
        />
      )}
    </main>
  );
}
