import { Trophy } from 'lucide-react';
import type { WeightSummary } from '@/src/types/weight';
import { ALMOST_THERE_KG, formatKg } from '@/src/lib/weight';
import { SegmentedBar } from '../ui/SegmentedBar';

/** Barra de progresso até o peso-meta + quanto falta. Igual no Hub e no Perfil. Sem meta, não mostra nada. */
export function TargetProgress({ summary }: { summary: WeightSummary }) {
  const { targetWeightKg, remainingKg, reachedTarget, targetProgress } = summary;
  if (targetWeightKg === null || targetProgress === null) return null;

  const almost = !reachedTarget && remainingKg !== null && remainingKg < ALMOST_THERE_KG;

  return (
    <div className="space-y-1.5">
      <SegmentedBar value={targetProgress} max={100} tone="action" label={`Progresso até a meta: ${targetProgress}%`} />
      {reachedTarget ? (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-coin">
          <Trophy className="h-4 w-4" />
          Meta alcançada <span className="font-normal text-ink-dim">· {formatKg(targetWeightKg)}</span>
        </p>
      ) : almost ? (
        <p className="text-sm text-ink-dim">
          <span className="font-semibold text-action">
            Falta pouco! <span className="whitespace-nowrap font-num text-base">{formatKg(remainingKg)}</span>
          </span>{' '}
          · meta <span className="whitespace-nowrap font-num text-base text-ink">{formatKg(targetWeightKg)}</span>
        </p>
      ) : (
        remainingKg !== null && (
          <p className="text-sm text-ink-dim">
            faltam <span className="whitespace-nowrap font-num text-base text-ink">{formatKg(remainingKg)}</span> · meta{' '}
            <span className="whitespace-nowrap font-num text-base text-ink">{formatKg(targetWeightKg)}</span>
          </p>
        )
      )}
    </div>
  );
}
