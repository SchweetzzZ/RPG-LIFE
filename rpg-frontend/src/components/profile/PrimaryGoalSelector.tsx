import React from 'react';
import { Target, TrendingDown, TrendingUp, Minus } from 'lucide-react';

export type GoalType = 'lose_weight' | 'gain_muscle' | 'maintain';

interface PrimaryGoalSelectorProps {
  selectedGoal: GoalType;
  onChange: (goal: GoalType) => void;
}

export function PrimaryGoalSelector({ selectedGoal, onChange }: PrimaryGoalSelectorProps) {
  const options: {
    id: GoalType;
    title: string;
    description: string;
    badge: string;
    icon: React.ElementType;
    color: string;
    borderColor: string;
  }[] = [
    {
      id: 'lose_weight',
      title: 'Queima de Gordura',
      description: 'Déficit calórico ativo (-400 kcal/dia) com alta saciedade e queima contínua.',
      badge: '-400 kcal',
      icon: TrendingDown,
      color: 'text-amber-400',
      borderColor: 'border-amber-400/40 bg-amber-400/10',
    },
    {
      id: 'gain_muscle',
      title: 'Hipertrofia / Ganho de Massa',
      description: 'Superávit calórico controlado (+300 kcal/dia) para suporte a ganho muscular limpo.',
      badge: '+300 kcal',
      icon: TrendingUp,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-400/40 bg-emerald-400/10',
    },
    {
      id: 'maintain',
      title: 'Manutenção / Performance',
      description: 'Dieta normocalórica para manter o peso corporal e maximizar o rendimento nos treinos.',
      badge: 'Normocalórica',
      icon: Minus,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-400/40 bg-cyan-400/10',
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-zinc-400 stroke-[2]" />
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Meta Corporal Primária
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedGoal === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-150 active:scale-[0.98] min-h-[96px] ${
                isSelected
                  ? `${option.borderColor} shadow-lg`
                  : 'border-white/[0.08] bg-[#0c0e12] hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${option.color}`} />
                  <span className="text-xs sm:text-sm font-bold text-zinc-100">
                    {option.title}
                  </span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                    isSelected ? 'bg-white/10 text-zinc-100' : 'text-zinc-500'
                  }`}
                >
                  {option.badge}
                </span>
              </div>

              <p className="mt-2 text-[11px] text-zinc-400 leading-snug line-clamp-2">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
