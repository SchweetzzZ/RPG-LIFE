import { useState } from 'react';
import { CheckCircle2, Coins, Flame, Info, Loader2, Lock, Moon } from 'lucide-react';
import type { DayCloseResult, DayState } from '@/src/types/day';
import { dayService } from '@/src/services/day.service';
import { errorMessage } from '@/src/services/http';
import { formatNumber } from '@/src/lib/format';

interface CloseDayPanelProps {
  day: DayState;
  /** Chamado depois de fechar para o Hub reler cofre, moedas e refeições do servidor. */
  onClosed: () => Promise<void>;
}

export function CloseDayPanel({ day, onClosed }: CloseDayPanelProps) {
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
  const hasNoLogs = day.foodLogsCount === 0;

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
            <Moon className="h-3.5 w-3.5 text-indigo-300" />
            Fechar o dia
          </h2>
          <p className="text-xs text-zinc-500">
            {isClosed
              ? `Dia fechado. Guardou ${formatNumber(day.savedKcal)} kcal no cofre.`
              : `Se hoje terminar abaixo da meta, a sobra vai para o cofre (prévia: ${formatNumber(day.savedKcal)} kcal).`}
          </p>
        </div>

        {isClosed ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 font-mono text-xs font-bold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Fechado
          </span>
        ) : (
          <button
            type="button"
            onClick={handleClose}
            disabled={closing || !day.canClose}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : !day.canClose ? <Lock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>Fechar o dia</span>
          </button>
        )}
      </div>

      {!isClosed && !day.canClose && day.closeBlockedReason && (
        <p className="text-xs text-zinc-400">{day.closeBlockedReason}</p>
      )}

      {!isClosed && day.canClose && hasNoLogs && (
        <p className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Nenhuma refeição registrada hoje. Fechar assim não guarda kcal, não rende moedas e interrompe a sequência.
        </p>
      )}

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {result && (
        <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-zinc-300">
            <span className="inline-flex items-center gap-1">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              {result.alreadyClosed ? 'Já estava fechado' : `+${result.rewards.coins} moedas • +${result.rewards.xp} XP`}
            </span>
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              Sequência: {result.streak.current} (melhor {result.streak.best})
            </span>
            {result.rewards.leveledUp && <span className="text-emerald-300">Subiu de nível!</span>}
          </div>
          {result.alert && <p className="text-zinc-300">{result.alert}</p>}
          {result.notice && <p className="text-zinc-400">{result.notice}</p>}
        </div>
      )}
    </section>
  );
}
