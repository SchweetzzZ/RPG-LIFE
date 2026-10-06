import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CheckSquare, Plus, Sparkles, Trophy } from 'lucide-react';
import { WaterTrackerCard } from '../components/habits/WaterTrackerCard';
import { StepsProgressCard } from '../components/habits/StepsProgressCard';
import { HabitRow, type HabitItem } from '../components/habits/HabitRow';

export const Route = createFileRoute('/habits')({
  component: HabitsRouteComponent,
});

const initialHabits: HabitItem[] = [
  {
    id: 'h1',
    title: 'Leitura de Livro Técnico / Desenvolvimento (15 min)',
    category: 'STUDY',
    targetStat: 'intelligence',
    currentStreak: 8,
    completed: true,
    xpReward: 100,
    coinsReward: 10,
  },
  {
    id: 'h2',
    title: 'Meditação / Exercício Respiratório de Foco (10 min)',
    category: 'MEDITATION',
    targetStat: 'focus',
    currentStreak: 5,
    completed: false,
    xpReward: 80,
    coinsReward: 8,
  },
  {
    id: 'h3',
    title: 'Dormir antes das 23:30 (Mínimo 7h30 de sono)',
    category: 'SLEEP',
    targetStat: 'vitality',
    currentStreak: 12,
    completed: false,
    xpReward: 120,
    coinsReward: 12,
  },
  {
    id: 'h4',
    title: 'Zero Refrigerante / Açúcar Adicionado no dia',
    category: 'NUTRITION',
    targetStat: 'vitality',
    currentStreak: 15,
    completed: true,
    xpReward: 150,
    coinsReward: 15,
  },
];

function HabitsRouteComponent() {
  const [habits, setHabits] = useState<HabitItem[]>(initialHabits);

  const handleToggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== id) return habit;
        const nextCompleted = !habit.completed;
        return {
          ...habit,
          completed: nextCompleted,
          currentStreak: nextCompleted ? habit.currentStreak + 1 : Math.max(0, habit.currentStreak - 1),
        };
      })
    );
  };

  const completedCount = habits.filter((h) => h.completed).length;

  return (
    <main className="min-h-screen bg-[#08090a] text-zinc-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-5">
        {/* Header da Tela de Hábitos */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-400">
                <CheckSquare className="h-4 w-4 stroke-[2]" />
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-100">
                Hábitos & Quests
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Cada hábito cumprido regenera atributos do seu avatar e acumula moedas.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.1] px-3 py-2 font-mono text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] transition-all min-h-[40px]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Hábito</span>
          </button>
        </header>

        {/* 1. Hidratação Tática */}
        <WaterTrackerCard initialMl={1750} targetMl={2800} />

        {/* 2. Passos & Movimento */}
        <StepsProgressCard initialSteps={8450} targetSteps={10000} />

        {/* 3. Lista de Hábitos Diários */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Quests de Disciplina Diária
              </h2>
              <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                {completedCount}/{habits.length}
              </span>
            </div>

            <span className="font-mono text-[11px] text-zinc-500 flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-400" />
              Streak Ativo
            </span>
          </div>

          <div className="space-y-2.5">
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                onToggle={handleToggleHabit}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
