import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { CalendarCheck, Coins, Dumbbell, Flame, Scale, ShieldCheck, Trophy, UtensilsCrossed, X } from 'lucide-react';
import { useResource } from '@/src/hooks/useResource';
import { summaryService } from '@/src/services/summary.service';
import { celebrate } from '@/src/lib/celebrate';
import { formatDay, formatNumber, pluralize } from '@/src/lib/format';
import { deltaTone, formatDeltaKg, formatKg } from '@/src/lib/weight';
import type { WeekSummary } from '@/src/types/summary';
import { Button } from '../ui/Button';
import { SegmentedBar } from '../ui/SegmentedBar';
import { ErrorBlock, LoadingBlock } from '../common/StateBlocks';

interface WeeklySummaryModalProps {
  /** Segunda-feira da semana. */
  start: string;
  onClose: () => void;
}

const shortDate = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/');

/** Resultado da semana que acabou (o ciclo do cofre, de segunda a domingo). */
export function WeeklySummaryModal({ start, onClose }: WeeklySummaryModalProps) {
  const { data, loading, error, reload } = useResource(() => summaryService.getWeek(start));
  const marked = useRef(false);

  useEffect(() => {
    if (!data || marked.current) return;
    marked.current = true;
    // Visto assim que aparece: não abre sozinho de novo, mesmo se o app for fechado com a tela aberta
    if (!data.inProgress) void summaryService.markSeen(data.start).catch(() => undefined);
    if (data.days.withMeals >= 5) celebrate(data.days.withMeals === 7);
  }, [data]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Resumo da semana">
      <div className="flex max-h-[90dvh] w-full flex-col rounded-t-xl border-2 border-line bg-surface sm:max-w-lg sm:rounded-lg">
        <div className="flex items-start justify-between gap-3 p-4 pb-3">
          <div>
            <h2 className="font-pixel text-lg leading-tight text-ink">Resumo da semana</h2>
            <p className="text-xs text-ink-faint">
              {shortDate(start)} a {data ? shortDate(data.end) : '...'}
              {data?.inProgress && ' · semana em andamento'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line text-ink-dim hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-3">
          {loading && !data && <LoadingBlock label="Somando a semana..." />}
          {error && <ErrorBlock message={error} onRetry={reload} />}
          {data && <SummaryBody summary={data} />}
        </div>

        <div className="border-t-2 border-line bg-bg/40 p-4">
          <Button onClick={onClose}>Bora para a próxima semana</Button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, tone, title, children }: { icon: ElementType; tone: string; title: string; children: ReactNode }) {
  return (
    <section className="flex gap-3 rounded-lg border-2 border-line bg-raised p-3">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone}`} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-dim">{title}</h3>
        {children}
      </div>
    </section>
  );
}

function SummaryBody({ summary }: { summary: WeekSummary }) {
  const { days, vault, freeMeals, workouts, rewards, streak, weight } = summary;

  return (
    <div className="space-y-2">
      <Row icon={CalendarCheck} tone="text-action" title="Dias fechados">
        <p className="text-sm text-ink">
          <span className="font-num text-3xl">{days.closed}</span>
          <span className="text-ink-dim"> de {days.total}</span>
          {days.closed > days.withMeals && (
            <span className="text-xs text-ink-faint"> · {pluralize(days.closed - days.withMeals, 'sem refeição', 'sem refeição')}</span>
          )}
        </p>
        <SegmentedBar value={days.closed} max={7} segments={7} tone="action" label="Dias fechados na semana" />
      </Row>

      <Row icon={ShieldCheck} tone="text-kcal" title="Cofre">
        <p className="text-sm text-ink">
          <span className="font-num text-2xl text-kcal">+{formatNumber(vault.savedKcal)}</span> kcal guardadas
        </p>
        {vault.overflowKcal > 0 && <p className="text-xs text-ink-dim">{formatNumber(vault.overflowKcal)} kcal saíram por excesso</p>}
        {vault.redeemedKcal > 0 && <p className="text-xs text-ink-dim">{formatNumber(vault.redeemedKcal)} kcal usadas na refeição livre</p>}
        {vault.expiredKcal > 0 && <p className="text-xs text-ink-faint">{formatNumber(vault.expiredKcal)} kcal sobraram e zeraram na segunda</p>}
      </Row>

      <Row icon={UtensilsCrossed} tone="text-coin" title="Refeição livre">
        {freeMeals.length === 0 ? (
          <p className="text-sm text-ink-dim">Nenhuma resgatada nesta semana.</p>
        ) : (
          <ul className="space-y-0.5">
            {freeMeals.map((m) => (
              <li key={m.id} className="flex justify-between gap-2 text-sm text-ink">
                <span className="truncate">{m.title}</span>
                <span className="shrink-0 text-xs text-ink-faint">{formatDay(m.date)} · {formatNumber(m.kcal)} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </Row>

      <Row icon={Dumbbell} tone="text-xp" title="Treinos">
        <p className="text-sm text-ink">
          <span className="font-num text-2xl">{workouts.count}</span> {workouts.count === 1 ? 'treino feito' : 'treinos feitos'}
        </p>
        {workouts.records.length > 0 && (
          <ul className="space-y-0.5">
            {workouts.records.map((r) => (
              <li key={r.exerciseName} className="flex items-center justify-between gap-2 text-sm">
                <span className="inline-flex min-w-0 items-center gap-1 text-ink">
                  <Trophy className="h-3.5 w-3.5 shrink-0 text-coin" />
                  <span className="truncate">{r.exerciseName}</span>
                </span>
                <span className="shrink-0 font-num text-base text-ink-dim">
                  {formatKg(r.previousBestKg, false)} → <span className="text-action">{formatKg(r.bestKg)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Row>

      <div className="grid grid-cols-2 gap-2">
        <Row icon={Coins} tone="text-coin" title="Ganhos">
          <p className="font-num text-xl text-coin">{formatNumber(rewards.coins)} moedas</p>
          <p className="font-num text-base text-xp">+{formatNumber(rewards.xp)} XP</p>
        </Row>
        <Row icon={Flame} tone="text-xp" title="Sequência">
          <p className="font-num text-xl text-ink">{pluralize(streak.current, 'dia', 'dias')}</p>
          <p className="text-xs text-ink-faint">Melhor: {streak.best}</p>
        </Row>
      </div>

      {weight.entries > 0 && (
        <Row icon={Scale} tone="text-ink-dim" title="Peso">
          {weight.changeKg !== null ? (
            <p className="text-sm text-ink">
              <span className={`font-num text-2xl ${deltaTone(weight.changeKg, weight.primaryGoal)}`}>{formatDeltaKg(weight.changeKg)}</span>
              {weight.endKg !== null && <span className="text-ink-dim"> na semana · {formatKg(weight.endKg)}</span>}
            </p>
          ) : (
            weight.endKg !== null && <p className="text-sm text-ink">{formatKg(weight.endKg)} <span className="text-ink-dim">· primeira pesagem</span></p>
          )}
        </Row>
      )}
    </div>
  );
}
