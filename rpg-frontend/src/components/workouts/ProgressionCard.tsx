import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { ExerciseChart } from './ExerciseChart';
import type { ExercisePerformance } from '../../types/workout';

interface ProgressionCardProps {
  performance: ExercisePerformance[];
}

export function ProgressionCard({ performance }: ProgressionCardProps) {
  const [selected, setSelected] = useState(performance[0]?.exerciseName ?? '');

  if (performance.length === 0) {
    return (
      <Card label="Evolução de carga">
        <p className="text-sm text-ink-dim">
          Registre um treino para acompanhar a evolução de carga (1RM estimado) de cada exercício.
        </p>
      </Card>
    );
  }

  return (
    <Card label="Evolução de carga">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 shrink-0 text-action" />
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-lg border-2 border-line bg-raised px-2 text-base text-ink focus:border-action focus:outline-none"
            aria-label="Exercício"
          >
            {performance.map((p) => (
              <option key={p.exerciseName} value={p.exerciseName}>
                {p.exerciseName}
              </option>
            ))}
          </select>
        </div>

        <ExerciseChart name={selected} />
      </div>
    </Card>
  );
}
