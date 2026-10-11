import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CalendarPlus, Info, Sparkles } from 'lucide-react';
import { VaultBalanceSummary } from '../components/rewards/VaultBalanceSummary';
import { FreeMealCard } from '../components/rewards/FreeMealCard';
import { FreeMealGallery } from '../components/rewards/FreeMealGallery';
import { MealBuilderModal } from '../components/rewards/MealBuilderModal';
import { RedeemModal } from '../components/rewards/RedeemModal';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlocks';
import { useRewardsData } from '../hooks/useRewardsData';
import { freeMealService } from '../services/free-meal.service';
import { errorMessage } from '../services/http';
import { DIARY_NOTICE } from '../lib/meal-draft';
import { formatNumber } from '../lib/format';
import type { FreeMealPlan, NextFreeMeals, RedeemFreeMealResult } from '../types/free-meal';

export const Route = createFileRoute('/rewards')({
  component: RewardsRouteComponent,
});

interface PlanListProps {
  title: string;
  plans: FreeMealPlan[];
  totals: NextFreeMeals['totals']['week'];
  coinBalance: number;
  cancellingId: string | null;
  onRedeem: (plan: FreeMealPlan) => void;
  onCancel: (plan: FreeMealPlan) => void;
}

function PlanList({ title, plans, totals, coinBalance, cancellingId, onRedeem, onCancel }: PlanListProps) {
  if (plans.length === 0) return null;

  return (
    <section className="space-y-3 pt-2">
      <div>
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
        {totals.count > 1 && (
          <p className="font-mono text-[11px] text-zinc-500">
            Todas as {totals.count} (~{formatNumber(totals.totalEstimatedKcal)} kcal): faltam {formatNumber(totals.totalNeededKcal)} kcal e{' '}
            {formatNumber(totals.totalNeededCoins)} moedas.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3.5">
        {plans.map((plan, index) => (
          <FreeMealCard
            key={plan.meal.id}
            plan={plan}
            coinBalance={coinBalance}
            hasEarlierPlans={index > 0}
            cancelling={cancellingId === plan.meal.id}
            onRedeem={onRedeem}
            onCancel={onCancel}
          />
        ))}
      </div>
    </section>
  );
}

function RewardsRouteComponent() {
  const { data, loading, error, reload } = useRewardsData();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [redeemTarget, setRedeemTarget] = useState<FreeMealPlan | null>(null);
  const [redeemResult, setRedeemResult] = useState<RedeemFreeMealResult | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleCancel(plan: FreeMealPlan) {
    setCancellingId(plan.meal.id);
    setActionError(null);
    try {
      await freeMealService.cancel(plan.meal.id);
    } catch (err) {
      setActionError(errorMessage(err instanceof Error ? err : null, 'Não foi possível cancelar a refeição'));
    } finally {
      setCancellingId(null);
      await reload();
    }
  }

  async function handleRedeemed(result: RedeemFreeMealResult) {
    setRedeemResult(result);
    await reload();
  }

  return (
    <main className="min-h-screen bg-[#08090a] text-zinc-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-5">
        {loading && !data && <LoadingBlock label="Carregando suas refeições livres..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}

        {data && (
          <>
            {redeemResult && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 sm:p-5 shadow-2xl flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    <Sparkles className="h-3 w-3" />
                    {redeemResult.alreadyRedeemed ? 'Já estava resgatada' : 'Refeição livre liberada!'}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-100">{redeemResult.meal.title}</h3>
                  <p className="font-mono text-xs text-zinc-400">
                    -{formatNumber(redeemResult.coinsDebited)} moedas
                    {redeemResult.vaultDebitKcal > 0 ? ` • -${formatNumber(redeemResult.vaultDebitKcal)} kcal do cofre` : ''} • cofre agora:{' '}
                    {formatNumber(redeemResult.vaultBalanceKcal)} kcal • moedas: {formatNumber(redeemResult.coinBalance)}
                  </p>
                  {redeemResult.exceededKcal > 0 && (
                    <p className="text-xs text-zinc-300">
                      {formatNumber(redeemResult.exceededKcal)} kcal acima do estimado. Só registramos, sem perder moeda, XP nem sequência.
                    </p>
                  )}
                  {redeemResult.notice && <p className="text-xs text-zinc-400">{redeemResult.notice}</p>}
                  <p className="flex items-start gap-1.5 text-xs text-zinc-500">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    {DIARY_NOTICE}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRedeemResult(null)}
                  className="shrink-0 rounded-lg border border-white/[0.1] px-3 py-1.5 font-mono text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Fechar
                </button>
              </div>
            )}

            <VaultBalanceSummary next={data.next} />

            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">Agendadas</h2>
              <button
                type="button"
                onClick={() => setBuilderOpen(true)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2 font-mono text-xs font-semibold text-zinc-200 transition-all hover:bg-white/[0.08]"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Agendar refeição
              </button>
            </div>

            {actionError && <ErrorBlock message={actionError} />}

            {data.next.week.length === 0 && data.next.day.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/[0.08] p-5 text-center text-xs text-zinc-500">
                Nada agendado ainda. Escolha uma refeição do catálogo ou monte a sua.
              </p>
            )}

            <PlanList
              title="Da semana"
              plans={data.next.week}
              totals={data.next.totals.week}
              coinBalance={data.next.coinBalance}
              cancellingId={cancellingId}
              onRedeem={setRedeemTarget}
              onCancel={handleCancel}
            />
            <PlanList
              title="De hoje"
              plans={data.next.day}
              totals={data.next.totals.day}
              coinBalance={data.next.coinBalance}
              cancellingId={cancellingId}
              onRedeem={setRedeemTarget}
              onCancel={handleCancel}
            />

            <FreeMealGallery meals={data.gallery} />
          </>
        )}
      </div>

      {data && builderOpen && (
        <MealBuilderModal
          templates={data.templates}
          next={data.next}
          onClose={() => setBuilderOpen(false)}
          onCreated={reload}
        />
      )}

      {redeemTarget && (
        <RedeemModal
          plan={redeemTarget}
          onClose={() => setRedeemTarget(null)}
          onRedeemed={handleRedeemed}
          onFailed={reload}
        />
      )}
    </main>
  );
}
