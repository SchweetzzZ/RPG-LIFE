import React from 'react';
import { Check, Flame, Sparkles } from 'lucide-react';

export interface HabitItem {
  id: string;
  title: string;
  category: string;
  targetStat: 'strength' | 'vitality' | 'focus' | 'intelligence';
  currentStreak: number;
  completed: boolean;
  xpReward: number;
  coinsReward: number;
}

interface HabitRowProps {
  habit: HabitItem;
  onToggle: (id: string) => void;
}

const statLabels: Record<
  string,
  { label: string; color: string; border: string; bg: string }
> = {
  strength: { label: '+Força', color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10' },
  vitality: { label: '+Vitalidade', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  focus: { label: '+Foco', color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/10' },
  intelligence: { label: '+Inteligência', color: 'text-violet-400', border: 'border-violet-500/20', bg: 'bg-violet-500/10' },
};

export function HabitRow({ habit, onToggle }: HabitRowProps) {
  const stat = statLabels[habit.targetStat] || statLabels.vitality;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-3.5 sm:p-4 transition-all duration-150 ${
        habit.completed
          ? 'border-emerald-500/30 bg-emerald-950/10'
          : 'border-white/[0.08] bg-[#0c0e12] hover:border-white/[0.15]'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox Tátil Grande no Alcance do Polegar */}
        <button
          type="button"
          onClick={() => onToggle(habit.id)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 ${
            habit.completed
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'border border-white/20 bg-white/[0.04] text-zinc-600 hover:border-white/40'
          }`}
        >
          <Check className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="space-y-1">
          <h4
            className={`text-sm font-semibold transition-colors ${
              habit.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
            }`}
          >
            {habit.title}
          </h4>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${stat.border} ${stat.bg} ${stat.color}`}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {stat.label}
            </span>

            {habit.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-amber-400">
                <Flame className="h-3 w-3 fill-amber-400 text-amber-400" />
                {habit.currentStreak} dias seguidos
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        <span className="font-mono text-[11px] font-bold text-amber-400">
          +{habit.coinsReward} moedas
        </span>
        <span className="block font-mono text-[10px] text-zinc-500">
          +{habit.xpReward} XP
        </span>
      </div>
    </div>
  );
}
