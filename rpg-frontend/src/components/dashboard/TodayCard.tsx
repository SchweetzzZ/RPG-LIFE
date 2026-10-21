import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { CalendarCheck, CheckCircle2, Coins, Flame, Info, Loader2, Sparkles, Utensils } from 'lucide-react';
import { useCountUp } from '@/src/hooks/useCountUp';
import { celebrate } from '@/src/lib/celebrate';
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
  // A meta já vem com o déficit/superávit do objetivo aplicado: mostra a diferença para a conta fechar.
  const goalAdjust = day.targetKcal - (day.baseKcal + day.workoutKcal + day.stepsKcal);

  return (
    <Card label="Hoje" icon={CalendarCheck} highlight={isClosed ? 'action' : undefined}>
      <div className="space-y-4">
        <div className="space-y-1">
          <p className={`font-num text-5xl leading-none tabular-nums ${over ? 'text-danger' : 'text-kcal'}`}>
            {over ? `+${formatNumber(day.consumedKcal - day.targetKcal)}` : formatNumber(day.remainingKcal)}
          </p>
          <p className="text-sm text-ink-dim">{over ? 'kcal acima da meta' : 'kcal restantes'}</p>
        </div>

        <div className="space-y-1.5">
          <SegmentedBar value={day.consumedKcal} max={day.targetKcal} segments={20} size="md" tone="kcal" showOverflow label="Calorias consumidas" />
          <p className="text-xs text-ink-faint">
            {formatNumber(day.consumedKcal)} consumidas • {day.foodLogsCount} {day.foodLogsCount === 1 ? 'registro' : 'registros'}
          </p>
        </div>

        {/* A meta como conta: de onde vem cada kcal que dá para comer hoje. */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 text-center">
            <Tile label="Base" value={day.baseKcal} />
            <Op>+</Op>
            <Tile label="Treino" value={day.workoutKcal} plus />
            <Op>+</Op>
            <Tile label="Passos" value={day.stepsKcal} plus />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border-2 border-kcal/40 bg-raised px-3 py-1.5">
            <span className="min-w-0">
              <span className="block font-pixel text-xs uppercase leading-tight text-ink-dim">= Meta de hoje</span>
              {Math.abs(goalAdjust) > 1 && (
                <span className="block text-[11px] leading-tight text-ink-faint">
                  {goalAdjust < 0 ? '−' : '+'}
                  {formatNumber(Math.abs(goalAdjust))} kcal do seu objetivo
                </span>
              )}
            </span>
            <span className="shrink-0 font-num text-xl leading-none text-kcal">{formatNumber(day.targetKcal)} kcal</span>
          </div>
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
  const empty = plus && value === 0;
  return (
    <div className="min-w-0 rounded-lg border-2 border-line bg-raised px-1.5 py-1.5">
      <p className="truncate text-xs text-ink-faint">{label}</p>
      <p className={`font-num text-lg leading-tight tabular-nums ${empty ? 'text-ink-faint' : 'text-ink'}`}>{formatNumber(value)}</p>
    </div>
  );
}

function Op({ children }: { children: string }) {
  return (
    <span className="font-num text-xl leading-none text-ink-faint" aria-hidden>
      {children}
    </span>
  );
}

/** O momento mais "jogo" do app: a recompensa recebida ao fechar o dia. Números contando, confete e aviso de nível. */
function RewardSummary({ result }: { result: DayCloseResult }) {
  const coins = useCountUp(result.alreadyClosed ? 0 : result.rewards.coins, 900, 150);
  const xp = useCountUp(result.alreadyClosed ? 0 : result.rewards.xp, 900, 350);

  useEffect(() => {
    if (!result.alreadyClosed) celebrate(result.rewards.leveledUp);
  }, [result]);

  if (result.alreadyClosed) {
    return <p className="rounded-lg border-2 border-line bg-raised p-3 text-sm text-ink">Esse dia já estava fechado.</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className="space-y-3 rounded-lg border-2 border-coin/60 bg-raised p-3"
    >
      <p className="text-center font-pixel text-sm uppercase text-coin">Recompensa do dia</p>

      <div className="grid grid-cols-3 gap-2 text-center">
        <RewardTile tone="text-coin" icon={<Coins className="h-4 w-4" />} value={`+${formatNumber(coins)}`} label="moedas" />
        <RewardTile tone="text-xp" icon={<Sparkles className="h-4 w-4" />} value={`+${formatNumber(xp)}`} label="XP" />
        <RewardTile
          tone="text-xp"
          icon={<Flame className={`h-4 w-4 ${result.streak.current >= 7 ? 'fill-current' : ''}`} />}
          value={String(result.streak.current)}
          label={`dias · melhor ${result.streak.best}`}
        />
      </div>

      {result.rewards.leveledUp && (
        <motion.p
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: [0.9, 1.08, 1] }}
          transition={{ delay: 0.9, duration: 0.45 }}
          className="rounded-md border-2 border-[#0c0a08] bg-xp py-1.5 text-center font-pixel text-lg text-[#0c0a08] shadow-[0_3px_0_0_#0c0a08]"
        >
          Subiu de nível!
        </motion.p>
      )}

      {result.alert && (
        <p className="flex items-start gap-2 text-xs text-ink-dim">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {result.alert}
        </p>
      )}
      {result.notice && <p className="text-xs text-ink-faint">{result.notice}</p>}
    </motion.div>
  );
}

function RewardTile({ tone, icon, value, label }: { tone: string; icon: ReactNode; value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-lg border-2 border-line bg-surface px-1 py-2">
      <span className={`mx-auto flex w-fit ${tone}`}>{icon}</span>
      <p className={`font-num text-2xl leading-tight tabular-nums ${tone}`}>{value}</p>
      <p className="truncate text-[11px] text-ink-faint">{label}</p>
    </div>
  );
}
