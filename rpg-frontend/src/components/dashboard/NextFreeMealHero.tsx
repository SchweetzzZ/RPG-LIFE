import { ArrowUpRight, CalendarPlus, CheckCircle2, Coins, Flame, Sparkles, Utensils } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { NextFreeMeals } from '@/src/types/free-meal';
import { formatDay, formatNumber, percent, pluralize } from '@/src/lib/format';

interface NextFreeMealHeroProps {
  next: NextFreeMeals;
}

function Bar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
      <div className={`h-full rounded-full transition-all duration-300 ${tone}`} style={{ width: `${value}%` }} />
    </div>
  );
}

/** A primeira refeição da semana (ou, sem ela, a do dia) domina o Hub. */
export function NextFreeMealHero({ next }: NextFreeMealHeroProps) {
  const plan = next.week[0] ?? next.day[0];

  if (!plan) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-500/25 bg-[#0c0e12] p-5 text-center space-y-3">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
          <Utensils className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-zinc-100">Nenhuma refeição livre agendada</h2>
          <p className="text-xs text-zinc-400">
            Escolha o que você quer comer e veja quanto guardar por dia para chegar lá sem culpa.
          </p>
        </div>
        <Link
          to="/rewards"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300"
        >
          <CalendarPlus className="h-4 w-4" />
          Agendar refeição livre
        </Link>
      </div>
    );
  }

  const { meal } = plan;
  const isDay = meal.scope === 'day';
  const kcalProgress = percent(plan.availableKcal, meal.estimatedKcal);
  const coinProgress = percent(next.coinBalance, meal.ticketCost);
  const scope = isDay ? next.totals.day : next.totals.week;
  const totalsPlans = isDay ? next.day.length : next.week.length;

  let guideline: string;
  if (isDay) {
    guideline = 'Refeição do dia: paga com a sobra da meta de hoje.';
  } else if (plan.perDayKcal !== null) {
    guideline = `Guarde ${formatNumber(plan.perDayKcal)} kcal/dia • ${plan.daysLeft > 0 ? `faltam ${pluralize(plan.daysLeft, 'dia', 'dias')}` : 'é hoje'}`;
  } else if (plan.accumulatedNeededKcal <= 0) {
    guideline = 'O cofre já cobre essa refeição.';
  } else {
    guideline = `Sem dias restantes e ainda faltam ${formatNumber(plan.accumulatedNeededKcal)} kcal.`;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-[#0e1117] to-[#0c0e12] p-4 sm:p-5 shadow-xl space-y-4">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-500/5 blur-2xl" />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="h-3 w-3" />
            {isDay ? 'Refeição livre de hoje' : `Refeição livre • ${formatDay(meal.scheduledFor)}`}
          </span>
          <h2 className="text-lg font-bold tracking-tight text-zinc-100">{meal.title}</h2>
          <p className="font-mono text-xs text-amber-200/90">{guideline}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 font-mono text-xs text-zinc-400">
          <Flame className="h-3.5 w-3.5 text-rose-400" />~{formatNumber(meal.estimatedKcal)} kcal
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-[11px] text-zinc-400">
            <span>{isDay ? 'Sobra de hoje' : 'Cofre'}</span>
            <span>{formatNumber(plan.availableKcal)} / {formatNumber(meal.estimatedKcal)} kcal</span>
          </div>
          <Bar value={kcalProgress} tone="bg-cyan-400/70" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-amber-400" />Ticket</span>
            <span>{formatNumber(next.coinBalance)} / {formatNumber(meal.ticketCost)} moedas</span>
          </div>
          <Bar value={coinProgress} tone="bg-amber-400/70" />
        </div>
      </div>

      {plan.recommendPostpone && plan.postponeReason && (
        <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-300">
          {plan.postponeReason}
        </p>
      )}

      {totalsPlans > 1 && (
        <p className="font-mono text-[11px] text-zinc-500">
          Todas as {totalsPlans} agendadas: faltam {formatNumber(scope.totalNeededKcal)} kcal e {formatNumber(scope.totalNeededCoins)} moedas.
        </p>
      )}

      <Link
        to="/rewards"
        className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 font-mono text-xs font-bold transition-all active:scale-[0.98] sm:w-auto ${
          plan.canBuy
            ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300'
            : 'border border-white/[0.1] bg-white/[0.03] text-zinc-300 hover:border-white/20'
        }`}
      >
        {plan.canBuy ? <CheckCircle2 className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        {plan.canBuy
          ? 'Pronta: resgatar'
          : `Faltam ${formatNumber(plan.neededKcal)} kcal e ${formatNumber(plan.neededCoins)} moedas`}
      </Link>
    </div>
  );
}
