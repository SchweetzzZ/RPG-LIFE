import { Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import type { LogSessionResult } from '../../types/workout';

interface SessionResultBannerProps {
  result: LogSessionResult;
  onClose: () => void;
}

export function SessionResultBanner({ result, onClose }: SessionResultBannerProps) {
  const { workoutLog } = result;
  return (
    <section
      role="status"
      className="space-y-2 rounded-lg border-2 border-action bg-surface p-4 shadow-[0_4px_0_0_#0c0a08]"
    >
      <div className="flex items-center gap-2 text-action">
        <Sparkles className="h-4 w-4" />
        <h2 className="font-pixel text-lg">Treino registrado</h2>
      </div>
      <p className="text-sm text-ink-dim">
        {workoutLog.totalSets} séries · {Math.round(workoutLog.totalVolumeKg)} kg de volume · {workoutLog.durationMinutes} min
      </p>
      <p className="text-sm">
        <span className="font-semibold text-kcal">+{result.caloriesBurned} kcal na meta do dia</span>
        <span className="text-ink-faint">{' · '}</span>
        {result.coinsEarned > 0 ? (
          <span className="font-semibold text-coin">
            +{result.coinsEarned} moedas
            <span className="text-xp"> · +{result.xpEarned} XP</span>
          </span>
        ) : (
          <span className="text-ink-dim">moedas do treino deste dia já recebidas</span>
        )}
      </p>
      {result.leveledUp && <p className="font-pixel text-lg text-xp">Subiu de nível!</p>}
      <Button variant="secondary" onClick={onClose}>
        Fechar
      </Button>
    </section>
  );
}
