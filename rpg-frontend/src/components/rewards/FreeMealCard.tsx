import { useState } from 'react';
import { CheckCircle2, Coins, Flame, Loader2, Lock, Trash2 } from 'lucide-react';
import type { FreeMealPlan } from '@/src/types/free-meal';
import { formatDay, formatNumber, percent } from '@/src/lib/format';

interface FreeMealCardProps {
  plan: FreeMealPlan;
  coinBalance: number;
  /** Mais de uma refeição na lista: mostra a diferença entre "pronta sozinha" e "pronta junto com as anteriores". */
  hasEarlierPlans: boolean;
  cancelling: boolean;
  onRedeem: (plan: FreeMealPlan) => void;
  onCancel: (plan: FreeMealPlan) => void;
}

function Bar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
      <div className={`h-full rounded-full transition-all duration-300 ${tone}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function FreeMealCard({ plan, coinBalance, hasEarlierPlans, cancelling, onRedeem, onCancel }: FreeMealCardProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const { meal } = plan;
  const isDay = meal.scope === 'day';

  const statusLabel = plan.canBuy
    ? 'Pronta para resgatar'
    : plan.ready
      ? 'Kcal garantidas • faltam moedas'
      : 'Guardando';

  const missing = [
    plan.neededKcal > 0 ? `${formatNumber(plan.neededKcal)} kcal` : null,
    plan.neededCoins > 0 ? `${formatNumber(plan.neededCoins)} moedas` : null,
  ].filter((part): part is string => part !== null);

  // Impacto do resgate: dia usa a sobra de hoje (não mexe no cofre); semana usa o cofre.
  const balanceAfter = plan.availableKcal - meal.estimatedKcal;

  return (
    <div
      className={`overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
        plan.canBuy
          ? 'border-amber-500/30 bg-gradient-to-b from-amber-950/15 via-[#0c0e12] to-[#0c0e12] shadow-xl'
          : 'border-white/[0.08] bg-[#0c0e12]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-white/[0.1] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-400">
              {isDay ? 'Hoje' : formatDay(meal.scheduledFor)}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                plan.canBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-zinc-400'
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">{meal.title}</h3>
          <p className="font-mono text-[11px] text-zinc-500">
            {meal.plannedItems.length} {meal.plannedItems.length === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 font-mono text-xs text-zinc-400">
          <Flame className="h-3.5 w-3.5 text-rose-400" />~{formatNumber(meal.estimatedKcal)} kcal
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-[11px] text-zinc-400">
            <span>{isDay ? 'Sobra de hoje' : 'Cofre'}</span>
            <span>{formatNumber(plan.availableKcal)} / {formatNumber(meal.estimatedKcal)} kcal</span>
          </div>
          <Bar value={percent(plan.availableKcal, meal.estimatedKcal)} tone="bg-cyan-400/70" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-amber-400" />Ticket</span>
            <span>{formatNumber(coinBalance)} / {formatNumber(meal.ticketCost)} moedas</span>
          </div>
          <Bar value={percent(coinBalance, meal.ticketCost)} tone="bg-amber-400/70" />
        </div>
      </div>

      {/* Prévia do impacto */}
      <div className="mt-3 space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 font-mono text-[11px] text-zinc-400">
        <p>
          {isDay ? 'Sobra de hoje' : 'Cofre'}: {formatNumber(plan.availableKcal)} kcal • esta refeição: ~{formatNumber(meal.estimatedKcal)} kcal •{' '}
          {balanceAfter >= 0 ? `sobram ${formatNumber(balanceAfter)} kcal` : `faltam ${formatNumber(-balanceAfter)} kcal`}
        </p>
        <p>Ticket: -{formatNumber(meal.ticketCost)} moedas{isDay ? ' • não mexe no cofre da semana' : ''}</p>
        {!isDay && plan.perDayKcal !== null && (
          <p className="text-amber-200/90">
            Guarde {formatNumber(plan.perDayKcal)} kcal/dia • {plan.daysLeft > 0 ? `${plan.daysLeft} ${plan.daysLeft === 1 ? 'dia' : 'dias'}` : 'é hoje'}
          </p>
        )}
        {!isDay && plan.projectedKcal !== null && (
          <p>Previsão no dia, seguindo a meta: ~{formatNumber(plan.projectedKcal)} kcal</p>
        )}
        {hasEarlierPlans && (
          <p className="text-zinc-300">
            Somando as anteriores até esta ({formatNumber(plan.accumulatedEstimatedKcal)} kcal):{' '}
            {plan.accumulatedNeededKcal > 0
              ? `faltam ${formatNumber(plan.accumulatedNeededKcal)} kcal${plan.ready ? ' (pronta sozinha, mas não junto com as outras)' : ''}`
              : 'o saldo cobre todas'}
          </p>
        )}
      </div>

      {plan.recommendPostpone && plan.postponeReason && (
        <p className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-300">
          {plan.postponeReason}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        {plan.canBuy ? (
          <button
            type="button"
            onClick={() => onRedeem(plan)}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Resgatar refeição livre
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-[44px] flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-2 font-mono text-xs font-semibold text-zinc-500"
          >
            <Lock className="h-3.5 w-3.5" />
            {missing.length > 0 ? `Faltam ${missing.join(' e ')}` : 'Indisponível'}
          </button>
        )}

        {confirmingCancel ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={cancelling}
              onClick={() => onCancel(plan)}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-rose-400/30 px-3 font-mono text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
            >
              {cancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Cancelar mesmo
            </button>
            <button
              type="button"
              onClick={() => setConfirmingCancel(false)}
              className="min-h-[44px] rounded-xl px-2 font-mono text-xs text-zinc-400 hover:text-zinc-200"
            >
              Voltar
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Cancelar ${meal.title}`}
            onClick={() => setConfirmingCancel(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] text-zinc-500 hover:text-rose-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
