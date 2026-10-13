import { useState } from 'react';
import { CalendarPlus, ChevronDown, Coins, Info, Lock, ShieldCheck, Unlock } from 'lucide-react';
import type { FreeMealPlan, NextFreeMeals } from '@/src/types/free-meal';
import type { Vault } from '@/src/types/vault';
import { formatDay, formatNumber } from '@/src/lib/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SegmentedBar } from '../ui/SegmentedBar';

interface QuestCardProps {
  next: NextFreeMeals;
  vault: Vault;
}

/** Hub: uma missão da semana e uma do dia. Com mais de uma agendada no escopo, dá para trocar qual aparece. */
export function QuestCard({ next, vault }: QuestCardProps) {
  if (next.week.length === 0 && next.day.length === 0) {
    return (
      <Card label="Missão">
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink">Nenhuma refeição livre agendada</h3>
            <p className="text-sm text-ink-dim">
              Escolha o que quer comer e veja quanto guardar por dia para chegar lá sem culpa.
            </p>
          </div>
          <Button to="/rewards" variant="secondary">
            <CalendarPlus className="h-4 w-4" />
            Agendar refeição livre
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {next.week.length > 0 && <Quest plans={next.week} next={next} vault={vault} label="Missão da semana" />}
      {next.day.length > 0 && <Quest plans={next.day} next={next} vault={vault} label="Missão de hoje" />}
    </div>
  );
}

interface QuestProps {
  plans: FreeMealPlan[];
  next: NextFreeMeals;
  vault: Vault;
  label: string;
}

function Quest({ plans, next, vault, label }: QuestProps) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  // Se a escolhida foi cancelada ou resgatada, volta para a primeira da lista.
  const plan = plans.find((p) => p.meal.id === pickedId) ?? plans[0];
  const { cycle, previousCycle } = vault;

  const { meal } = plan;
  const isDay = meal.scope === 'day';
  const scope = isDay ? next.totals.day : next.totals.week;

  let status: string;
  if (isDay) {
    status = 'Paga com a sobra da meta de hoje.';
  } else if (plan.canBuy) {
    status = 'Cofre cheio! Só falta resgatar.';
  } else if (plan.perDayKcal !== null) {
    status =
      plan.daysLeft > 1
        ? `Guarde ${formatNumber(plan.perDayKcal)} kcal por dia nos próximos ${plan.daysLeft} dias.`
        : `Guarde ${formatNumber(plan.perDayKcal)} kcal hoje.`;
  } else if (plan.accumulatedNeededKcal <= 0) {
    status = `O cofre já cobre a refeição. Faltam ${formatNumber(plan.neededCoins)} moedas.`;
  } else {
    status = `É hoje e o cofre ainda não cobre: faltam ${formatNumber(plan.accumulatedNeededKcal)} kcal.`;
  }

  return (
    <Card label={label} aside={isDay ? 'hoje' : formatDay(meal.scheduledFor)}>
      <div className="space-y-4">
        {plans.length > 1 && (
          <label className="relative block">
            <span className="sr-only">Trocar a refeição exibida</span>
            <select
              value={plan.meal.id}
              onChange={(e) => setPickedId(e.target.value)}
              className="h-9 w-full appearance-none rounded-lg border-2 border-line bg-raised pl-3 pr-9 text-xs text-ink-dim focus:border-action focus:outline-none"
            >
              {plans.map((p, index) => (
                <option key={p.meal.id} value={p.meal.id}>
                  {index + 1}/{plans.length} · {p.meal.title}
                  {p.meal.scope === 'week' ? ` · ${formatDay(p.meal.scheduledFor)}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          </label>
        )}

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-lg font-bold leading-tight text-ink">
              {meal.title} <span className="text-sm font-normal text-ink-faint">~{formatNumber(meal.estimatedKcal)} kcal</span>
            </h3>
            <p className="text-sm text-ink">{status}</p>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 bg-raised ${plan.canBuy ? 'border-coin text-coin' : 'border-line text-ink-faint'}`}
            title={plan.canBuy ? 'Liberada' : 'Bloqueada'}
          >
            {plan.canBuy ? <Unlock className="h-5 w-5" aria-label="Liberada" /> : <Lock className="h-5 w-5" aria-label="Bloqueada" />}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-dim">
              <span className="inline-flex items-center gap-1 text-kcal">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isDay ? 'Sobra de hoje' : 'Cofre'}
              </span>
              <span className="tabular-nums">
                {formatNumber(plan.availableKcal)} / {formatNumber(meal.estimatedKcal)} kcal
              </span>
            </div>
            <SegmentedBar value={plan.availableKcal} max={meal.estimatedKcal} tone="kcal" label="Cofre da refeição" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-dim">
              <span className="inline-flex items-center gap-1 text-coin">
                <Coins className="h-3.5 w-3.5" />
                Ticket
              </span>
              <span className="tabular-nums">
                {formatNumber(next.coinBalance)} / {formatNumber(meal.ticketCost)} moedas
              </span>
            </div>
            <SegmentedBar value={next.coinBalance} max={meal.ticketCost} tone="coin" label="Moedas do ticket" />
          </div>
        </div>

        {plan.recommendPostpone && plan.postponeReason && (
          <p className="flex items-start gap-2 text-xs text-ink-dim">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {plan.postponeReason}
          </p>
        )}

        {plans.length > 1 && (
          <p className="text-xs text-ink-faint">
            Todas as {plans.length} agendadas: faltam {formatNumber(scope.totalNeededKcal)} kcal e {formatNumber(scope.totalNeededCoins)} moedas.
          </p>
        )}

        <Button to="/rewards" variant={plan.canBuy ? 'coin' : 'secondary'}>
          {plan.canBuy ? 'Resgatar' : 'Ver na Loja →'}
        </Button>

        {!isDay && (
          <div className="space-y-0.5 border-t-2 border-line pt-3 text-xs text-ink-faint">
            <p>Semana termina {formatDay(cycle.endDate)} · cofre e moedas zeram na segunda</p>
            {previousCycle && previousCycle.resetKcal > 0 && (
              <p>Semana passada: {formatNumber(previousCycle.resetKcal)} kcal não usadas expiraram.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
