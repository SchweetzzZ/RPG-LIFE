import { CalendarPlus, Coins, Info, ShieldCheck } from 'lucide-react';
import type { NextFreeMeals } from '@/src/types/free-meal';
import type { Vault } from '@/src/types/vault';
import { formatDay, formatNumber } from '@/src/lib/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SegmentedBar } from '../ui/SegmentedBar';

interface QuestCardProps {
  next: NextFreeMeals;
  vault: Vault;
}

/** A primeira refeição da semana (ou, sem ela, a do dia) vira a missão do Hub. */
export function QuestCard({ next, vault }: QuestCardProps) {
  const plan = next.week[0] ?? next.day[0];
  const { cycle, previousCycle } = vault;

  if (!plan) {
    return (
      <Card label="Missão">
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-100">Nenhuma refeição livre agendada</h3>
            <p className="text-sm text-zinc-400">
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

  const { meal } = plan;
  const isDay = meal.scope === 'day';
  const scope = isDay ? next.totals.day : next.totals.week;
  const totalPlans = isDay ? next.day.length : next.week.length;

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
    <Card label="Missão" aside={isDay ? 'hoje' : formatDay(meal.scheduledFor)}>
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold leading-tight text-zinc-100">
            {meal.title} <span className="text-sm font-normal text-zinc-500">~{formatNumber(meal.estimatedKcal)} kcal</span>
          </h3>
          <p className="text-sm text-zinc-300">{status}</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
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
            <div className="flex items-center justify-between text-xs text-zinc-400">
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
          <p className="flex items-start gap-2 text-xs text-zinc-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {plan.postponeReason}
          </p>
        )}

        {totalPlans > 1 && (
          <p className="text-xs text-zinc-500">
            Todas as {totalPlans} agendadas: faltam {formatNumber(scope.totalNeededKcal)} kcal e {formatNumber(scope.totalNeededCoins)} moedas.
          </p>
        )}

        <Button to="/rewards" variant={plan.canBuy ? 'coin' : 'secondary'}>
          {plan.canBuy ? 'Resgatar' : 'Ver na Loja →'}
        </Button>

        <div className="space-y-0.5 border-t-2 border-line pt-3 text-xs text-zinc-500">
          <p>Semana termina {formatDay(cycle.endDate)} · cofre e moedas zeram na segunda</p>
          {previousCycle && previousCycle.resetKcal > 0 && (
            <p>Semana passada: {formatNumber(previousCycle.resetKcal)} kcal não usadas expiraram.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
