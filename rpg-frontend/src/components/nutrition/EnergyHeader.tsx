import { Info } from 'lucide-react';
import type { DayState } from '@/src/types/day';
import { formatNumber } from '@/src/lib/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SegmentedBar } from '../ui/SegmentedBar';

interface EnergyHeaderProps {
  consumedKcal: number;
  /** null quando o perfil está incompleto: sem meta, só o consumido. */
  day: DayState | null;
}

export function EnergyHeader({ consumedKcal, day }: EnergyHeaderProps) {
  if (!day) {
    return (
      <Card label="Hoje">
        <div className="space-y-3">
          <p className="font-num text-4xl leading-none tabular-nums text-kcal">{formatNumber(consumedKcal)}</p>
          <p className="text-sm text-ink-dim">kcal consumidas</p>
          <p className="flex items-start gap-2 text-xs text-ink-faint">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Complete seu perfil para ver quanto ainda pode comer hoje.
          </p>
          <Button to="/profile" variant="secondary">
            Completar perfil
          </Button>
        </div>
      </Card>
    );
  }

  const over = consumedKcal > day.targetKcal;
  return (
    <Card label="Hoje" aside={`Meta ${formatNumber(day.targetKcal)} kcal`}>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="font-num text-4xl leading-none tabular-nums text-kcal">
            {over ? `+${formatNumber(consumedKcal - day.targetKcal)}` : formatNumber(day.targetKcal - consumedKcal)}
          </p>
          <p className="text-sm text-ink-dim">{over ? 'kcal acima da meta' : 'kcal restantes'}</p>
        </div>
        <SegmentedBar value={consumedKcal} max={day.targetKcal} segments={20} tone="kcal" label="Calorias consumidas" />
        <p className="text-xs text-ink-faint">{formatNumber(consumedKcal)} consumidas</p>
      </div>
    </Card>
  );
}
