import { useState } from 'react';
import { CheckCircle2, Coins, Loader2, Lock, Trash2 } from 'lucide-react';
import type { FreeMealPlan, FreeMealTemplate } from '@/src/types/free-meal';
import { mealMacros } from '@/src/lib/meal-macros';
import { MacroChips, MissingMacrosNote } from './MealTotalsHud';
import type { DayState } from '@/src/types/day';
import { formatDay, formatNumber } from '@/src/lib/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SegmentedBar } from '../ui/SegmentedBar';
import { StackedBar } from '../ui/StackedBar';

interface FreeMealCardProps {
  plan: FreeMealPlan;
  coinBalance: number;
  /** Meta e consumido de hoje (só para a refeição do dia). */
  day: DayState | null;
  /** Catálogo carregado pela Loja: os macros são calculados na hora a partir do template (não são gravados). */
  templates: FreeMealTemplate[];
  /** Mais de uma refeição na lista: mostra a diferença entre "pronta sozinha" e "pronta junto com as anteriores". */
  hasEarlierPlans: boolean;
  cancelling: boolean;
  onRedeem: (plan: FreeMealPlan) => void;
  onCancel: (plan: FreeMealPlan) => void;
}

function Legend({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border-2 border-line bg-raised px-2 py-2">
      <p className="flex items-center gap-1.5 text-xs text-ink-faint">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${dot}`} />
        {label}
      </p>
      <p className="font-num text-lg leading-tight tabular-nums text-ink">{value}</p>
    </div>
  );
}

/** Refeição do dia: quanto já comi, quanto ela ocupa e quanto sobra da meta, sem precisar fazer conta. */
function DayBudget({ plan, day }: { plan: FreeMealPlan; day: DayState | null }) {
  const meal = plan.meal.estimatedKcal;
  const left = plan.availableKcal - meal;
  const fits = left >= 0;

  const headline = fits
    ? `Cabe na meta de hoje: depois dela ainda sobram ${formatNumber(left)} kcal.`
    : `Falta espaço: passa ${formatNumber(-left)} kcal do que sobra hoje.`;

  if (!day) {
    return (
      <div className="space-y-2">
        <p className={`text-sm font-semibold ${fits ? 'text-ink' : 'text-danger'}`}>{headline}</p>
        <p className="text-xs text-ink-faint">
          Hoje ainda dá para comer {formatNumber(plan.availableKcal)} kcal. A refeição usa ~{formatNumber(meal)}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className={`text-sm font-semibold ${fits ? 'text-ink' : 'text-danger'}`}>{headline}</p>
      <StackedBar
        label="Meta de hoje: já comido, refeição livre e sobra"
        max={day.targetKcal}
        parts={[
          { value: day.consumedKcal, tone: 'kcal' },
          { value: meal, tone: 'xp' },
        ]}
      />
      <div className="grid grid-cols-3 gap-2">
        <Legend dot="bg-kcal" label="Já comi" value={formatNumber(day.consumedKcal)} />
        <Legend dot="bg-xp" label="Refeição" value={`~${formatNumber(meal)}`} />
        <Legend dot="border-2 border-ink-faint" label="Sobra" value={fits ? formatNumber(left) : '0'} />
      </div>
      <p className="text-xs text-ink-faint">Meta de hoje: {formatNumber(day.targetKcal)} kcal</p>
    </div>
  );
}

function VaultProgress({ plan }: { plan: FreeMealPlan }) {
  const need = plan.meal.estimatedKcal;
  const missingKcal = Math.max(0, need - plan.availableKcal);
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-ink">
        {missingKcal > 0 ? `Faltam ${formatNumber(missingKcal)} kcal no cofre.` : 'O cofre já cobre a refeição.'}
      </p>
      <SegmentedBar value={plan.availableKcal} max={need} tone="kcal" label="Cofre da refeição" />
      <p className="text-xs text-ink-faint">
        Cofre: {formatNumber(plan.availableKcal)} de {formatNumber(need)} kcal
      </p>
    </div>
  );
}

export function FreeMealCard({ plan, coinBalance, day, templates, hasEarlierPlans, cancelling, onRedeem, onCancel }: FreeMealCardProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const { meal } = plan;
  const macros = mealMacros(meal, templates);
  const isDay = meal.scope === 'day';

  const statusLabel = plan.canBuy ? 'Pronta para resgatar' : plan.ready ? 'Kcal ok, faltam moedas' : 'Guardando';

  const missing = [
    plan.neededKcal > 0 ? `${formatNumber(plan.neededKcal)} kcal` : null,
    plan.neededCoins > 0 ? `${formatNumber(plan.neededCoins)} moedas` : null,
  ].filter((part): part is string => part !== null);

  const missingCoins = Math.max(0, meal.ticketCost - coinBalance);

  return (
    <Card highlight={plan.canBuy ? 'coin' : undefined}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded border-2 border-line bg-raised px-1.5 py-0.5 text-ink-dim">
                {isDay ? 'Hoje' : formatDay(meal.scheduledFor)}
              </span>
              <span className={`font-semibold ${plan.canBuy ? 'text-action' : 'text-ink-faint'}`}>{statusLabel}</span>
            </div>
            <h3 className="text-lg font-bold leading-tight text-ink">{meal.title}</h3>
            <p className="text-xs text-ink-faint">
              {meal.plannedItems.length} {meal.plannedItems.length === 1 ? 'item' : 'itens'} · ~{formatNumber(meal.estimatedKcal)} kcal
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <MacroChips macros={macros} kcal={meal.estimatedKcal} />
          <MissingMacrosNote count={macros.missing} />
        </div>

        {isDay ? <DayBudget plan={plan} day={day} /> : <VaultProgress plan={plan} />}

        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Coins className="h-4 w-4 text-coin" />
            {missingCoins > 0 ? `Faltam ${formatNumber(missingCoins)} moedas para o ticket.` : 'Você tem as moedas do ticket.'}
          </p>
          <SegmentedBar value={coinBalance} max={meal.ticketCost} tone="coin" label="Moedas do ticket" />
          <p className="text-xs text-ink-faint">
            {formatNumber(coinBalance)} de {formatNumber(meal.ticketCost)} moedas{isDay ? ' · não mexe no cofre da semana' : ''}
          </p>
        </div>

        {(!isDay && (plan.perDayKcal !== null || plan.projectedKcal !== null)) || hasEarlierPlans ? (
          <div className="space-y-1 border-t-2 border-line pt-3 text-xs text-ink-dim">
            {!isDay && plan.perDayKcal !== null && (
              <p>
                Guarde {formatNumber(plan.perDayKcal)} kcal por dia ·{' '}
                {plan.daysLeft > 0 ? `${plan.daysLeft} ${plan.daysLeft === 1 ? 'dia' : 'dias'}` : 'é hoje'}
              </p>
            )}
            {!isDay && plan.projectedKcal !== null && (
              <p>Previsão no dia, seguindo a meta: ~{formatNumber(plan.projectedKcal)} kcal</p>
            )}
            {hasEarlierPlans && (
              <p>
                Somando as anteriores até esta ({formatNumber(plan.accumulatedEstimatedKcal)} kcal):{' '}
                {plan.accumulatedNeededKcal > 0
                  ? `faltam ${formatNumber(plan.accumulatedNeededKcal)} kcal${plan.ready ? ' (pronta sozinha, mas não junto com as outras)' : ''}`
                  : 'o saldo cobre todas'}
              </p>
            )}
          </div>
        ) : null}

        {plan.recommendPostpone && plan.postponeReason && <p className="text-xs text-ink-dim">{plan.postponeReason}</p>}

        <div className="flex items-center gap-2">
          {plan.canBuy ? (
            <Button variant="coin" onClick={() => onRedeem(plan)}>
              <CheckCircle2 className="h-4 w-4" />
              Resgatar refeição livre
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              <Lock className="h-4 w-4" />
              {missing.length > 0 ? `Faltam ${missing.join(' e ')}` : 'Indisponível'}
            </Button>
          )}

          {confirmingCancel ? (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => onCancel(plan)}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border-2 border-danger/60 px-3 text-sm font-semibold text-danger"
              >
                {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                Cancelar
              </button>
              <button type="button" onClick={() => setConfirmingCancel(false)} className="min-h-[44px] px-2 text-sm text-ink-dim hover:text-ink">
                Voltar
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label={`Cancelar ${meal.title}`}
              onClick={() => setConfirmingCancel(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line text-ink-faint hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
