import { useState } from 'react';
import { CheckCircle2, Coins, Flame, Info, Loader2, PartyPopper, Utensils } from 'lucide-react';
import type { DayCloseResult, DayState } from '@/src/types/day';
import { dayService } from '@/src/services/day.service';
import { errorMessage } from '@/src/services/http';
import { formatNumber } from '@/src/lib/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SegmentedBar } from '../ui/SegmentedBar';

interface TodayCardProps {
  day: DayState;
  /** Chamado depois de fechar para o Hub reler cofre, moedas e refeições do servidor. */
  onClosed: () => Promise<void>;
}

export function TodayCard({ day, onClosed }: TodayCardProps) {
  const [closing, setClosing] = useState(false);
  const [result, setResult] = useState<DayCloseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    setClosing(true);
    setError(null);
    try {
      const closed = await dayService.closeDay(day.date);
      setResult(closed);
      await onClosed();
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível fechar o dia'));
    } finally {
      setClosing(false);
    }
  }

  const isClosed = day.status === 'closed';
  const over = day.consumedKcal > day.targetKcal;

  return (
    <Card label="Hoje">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="font-pixel text-4xl font-bold leading-none tabular-nums text-kcal">
            {over ? `+${formatNumber(day.consumedKcal - day.targetKcal)}` : formatNumber(day.remainingKcal)}
          </p>
          <p className="text-sm text-ink-dim">{over ? 'kcal acima da meta' : 'kcal restantes'}</p>
        </div>

        <div className="space-y-1.5">
          <SegmentedBar value={day.consumedKcal} max={day.targetKcal} segments={20} tone="kcal" label="Calorias consumidas" />
          <p className="text-xs text-ink-faint">
            {formatNumber(day.consumedKcal)} consumidas • {day.foodLogsCount} {day.foodLogsCount === 1 ? 'registro' : 'registros'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Tile label="Base" value={day.baseKcal} />
          <Tile label="Treino" value={day.workoutKcal} plus />
          <Tile label="Passos" value={day.stepsKcal} plus />
        </div>

        <p className="text-xs text-ink-faint">
          {isClosed ? 'Guardado no cofre' : 'Sobra prevista para o cofre'}: {formatNumber(day.savedKcal)} kcal
        </p>

        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}

        {isClosed ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-action">
              <CheckCircle2 className="h-4 w-4" />
              Dia fechado
            </p>
            {result && <RewardSummary result={result} />}
          </div>
        ) : !day.canClose ? (
          <div className="space-y-2">
            <Button to="/nutrition">
              <Utensils className="h-4 w-4" />
              Registrar refeição
            </Button>
            {day.closeBlockedReason && <p className="text-xs text-ink-faint">{day.closeBlockedReason}</p>}
          </div>
        ) : day.foodLogsCount === 0 ? (
          <div className="space-y-2">
            <Button to="/nutrition">
              <Utensils className="h-4 w-4" />
              Registrar refeição
            </Button>
            <p className="flex items-start gap-2 text-xs text-ink-faint">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Fechar sem refeições não guarda kcal, não rende moedas e interrompe a sequência.
            </p>
            <div className="flex justify-center">
              <Button variant="link" onClick={handleClose} disabled={closing}>
                Fechar o dia mesmo assim
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button onClick={handleClose} disabled={closing}>
              {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Fechar o dia
            </Button>
            <Button to="/nutrition" variant="secondary">
              <Utensils className="h-4 w-4" />
              Registrar refeição
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function Tile({ label, value, plus = false }: { label: string; value: number; plus?: boolean }) {
  return (
    <div className="rounded-lg border-2 border-line bg-raised px-2 py-2">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="font-pixel text-lg font-bold leading-tight tabular-nums text-ink">
        {plus ? '+' : ''}
        {formatNumber(value)}
      </p>
    </div>
  );
}

/** O momento mais "jogo" do app: a recompensa recebida ao fechar o dia. */
function RewardSummary({ result }: { result: DayCloseResult }) {
  return (
    <div className="space-y-2 rounded-lg border-2 border-line bg-raised p-3 text-sm">
      {result.alreadyClosed ? (
        <p className="text-ink">Esse dia já estava fechado.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-semibold">
          <span className="inline-flex items-center gap-1 text-coin">
            <Coins className="h-4 w-4" />+{formatNumber(result.rewards.coins)} moedas
          </span>
          <span className="text-xp">+{formatNumber(result.rewards.xp)} XP</span>
        </div>
      )}
      <p className="inline-flex items-center gap-1 text-xs text-xp">
        <Flame className="h-3.5 w-3.5" />
        Sequência: {result.streak.current} (melhor {result.streak.best})
      </p>
      {result.rewards.leveledUp && (
        <p className="flex items-center gap-1 text-sm font-bold text-xp">
          <PartyPopper className="h-4 w-4" />
          Subiu de nível!
        </p>
      )}
      {result.alert && (
        <p className="flex items-start gap-2 text-xs text-ink-dim">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {result.alert}
        </p>
      )}
      {result.notice && <p className="text-xs text-ink-faint">{result.notice}</p>}
    </div>
  );
}
