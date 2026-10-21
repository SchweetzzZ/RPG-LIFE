import { useState } from 'react';
import { Coins, Flame, Footprints, Plus } from 'lucide-react';
import { formatNumber, percent } from '@/src/lib/format';
import { Card } from '../ui/Card';
import { SegmentedBar } from '../ui/SegmentedBar';

interface StepsProgressCardProps {
  initialSteps?: number;
  targetSteps?: number;
}

export function StepsProgressCard({ initialSteps = 8450, targetSteps = 10000 }: StepsProgressCardProps) {
  const [steps, setSteps] = useState(initialSteps);

  const pct = percent(steps, targetSteps);
  // Estimativa: ~0.04 kcal por passo, 1 moeda a cada 1000 passos
  const caloriesBurned = Math.round(steps * 0.04);
  const coinsEarned = Math.floor(steps / 1000);
  const done = steps >= targetSteps;

  return (
    <Card label="Passos de hoje" icon={Footprints} aside={done ? 'meta batida!' : `${pct}%`} highlight={done ? 'action' : undefined}>
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-num text-4xl leading-none text-action">{formatNumber(steps)}</p>
            <p className="mt-1 text-sm text-ink-dim">de {formatNumber(targetSteps)} passos</p>
          </div>
          <button
            type="button"
            onClick={() => setSteps((prev) => prev + 500)}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border-2 border-line bg-raised px-3 text-sm font-semibold text-ink shadow-[0_3px_0_0_#0c0a08] hover:border-ink-faint active:translate-y-[2px] active:shadow-[0_1px_0_0_#0c0a08]"
          >
            <Plus className="h-4 w-4" />
            500
          </button>
        </div>

        <SegmentedBar value={steps} max={targetSteps} segments={20} size="md" tone="action" label="Passos do dia" />

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border-2 border-line bg-raised px-3 py-2">
            <p className="flex items-center gap-1 text-xs text-ink-faint">
              <Flame className="h-3.5 w-3.5 text-kcal" />
              kcal gastas
            </p>
            <p className="font-num text-xl leading-tight text-kcal">+{formatNumber(caloriesBurned)}</p>
          </div>
          <div className="rounded-lg border-2 border-line bg-raised px-3 py-2">
            <p className="flex items-center gap-1 text-xs text-ink-faint">
              <Coins className="h-3.5 w-3.5 text-coin" />
              moedas
            </p>
            <p className="font-num text-xl leading-tight text-coin">+{formatNumber(coinsEarned)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
