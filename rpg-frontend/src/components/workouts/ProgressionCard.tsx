import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { ExerciseChart } from './ExerciseChart';
import type { ExercisePerformance } from '../../types/workout';

interface ProgressionCardProps {
  performance: ExercisePerformance[];
}

export function ProgressionCard({ performance }: ProgressionCardProps) {
  const [selected, setSelected] = useState(performance[0]?.exerciseName ?? '');

  // Sem treino registrado nao ha evolucao para mostrar
  if (performance.length === 0) return null;

  return (
    <Card label="Evolução de carga">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 shrink-0 text-action" />
          <Select
            className="flex-1"
            aria-label="Exercício"
            value={selected}
            onChange={setSelected}
            options={performance.map((p) => ({ value: p.exerciseName, label: p.exerciseName }))}
          />
        </div>

        <ExerciseChart name={selected} />
      </div>
    </Card>
  );
}
