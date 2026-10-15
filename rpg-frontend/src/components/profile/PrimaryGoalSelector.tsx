import type { ElementType } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card } from '../ui/Card';
import type { PrimaryGoal } from '../../types/profile';

interface PrimaryGoalSelectorProps {
  selectedGoal: PrimaryGoal | null;
  onChange: (goal: PrimaryGoal) => void;
}

const OPTIONS: {
  id: PrimaryGoal;
  title: string;
  description: string;
  badge: string;
  icon: ElementType;
}[] = [
  {
    id: 'lose_weight',
    title: 'Queima de gordura',
    description: 'Déficit calórico ativo com alta saciedade.',
    badge: '-400 kcal',
    icon: TrendingDown,
  },
  {
    id: 'gain_muscle',
    title: 'Ganho de massa',
    description: 'Superávit controlado para ganhar músculo limpo.',
    badge: '+300 kcal',
    icon: TrendingUp,
  },
  {
    id: 'maintain',
    title: 'Manutenção',
    description: 'Dieta normocalórica para manter o peso e render nos treinos.',
    badge: 'Normocalórica',
    icon: Minus,
  },
];

export function PrimaryGoalSelector({ selectedGoal, onChange }: PrimaryGoalSelectorProps) {
  return (
    <Card label="Seu objetivo">
      <div role="radiogroup" aria-label="Objetivo corporal" className="space-y-2">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedGoal === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.id)}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg border-2 p-2.5 text-left transition-colors ${
                isSelected ? 'border-action bg-raised' : 'border-line bg-raised hover:border-ink-faint'
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 bg-raised ${
                  isSelected ? 'border-action text-action' : 'border-line text-ink-dim'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{option.title}</span>
                <span className="block text-xs text-ink-faint">{option.description}</span>
              </span>
              <span className={`shrink-0 ${/\d/.test(option.badge) ? 'font-num' : 'font-pixel'} text-base ${isSelected ? 'text-kcal' : 'text-ink-faint'}`}>
                {option.badge}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
