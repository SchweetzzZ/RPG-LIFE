import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CalendarPlus, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
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
import type { DayState } from '../types/day';
import type { FreeMealPlan, NextFreeMeals, RedeemFreeMealResult } from '../types/free-meal';

export const Route = createFileRoute('/rewards')({
  component: RewardsRouteComponent,
});

interface PlanListProps {
  title: string;
  plans: FreeMealPlan[];
  totals: NextFreeMeals['totals']['week'];
  coinBalance: number;
  day: DayState | null;
  cancellingId: string | null;
  onRedeem: (plan: FreeMealPlan) => void;
  onCancel: (plan: FreeMealPlan) => void;
}

function PlanList({ title, plans, totals, coinBalance, day, cancellingId, onRedeem, onCancel }: PlanListProps) {
  if (plans.length === 0) return null;

  return (
    <section className="space-y-3 pt-2">
      <div className="px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-dim">{title}</h2>
        {totals.count > 1 && (
          <p className="text-xs text-ink-faint">
            Todas as {totals.count} (~{formatNumber(totals.totalEstimatedKcal)} kcal): faltam {formatNumber(totals.totalNeededKcal)} kcal e{' '}
            {formatNumber(totals.totalNeededCoins)} moedas.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {plans.map((plan, index) => (
          <FreeMealCard
            key={plan.meal.id}
            plan={plan}
            coinBalance={coinBalance}
            day={day}
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
    <main className="min-h-screen bg-bg px-3 pb-28 pt-3 text-ink sm:p-4 sm:pb-28">
      <div className="mx-auto w-full max-w-md space-y-3">
        <h1 className="px-1 font-pixel text-2xl text-ink">Loja</h1>
        {loading && !data && <LoadingBlock label="Carregando suas refeições livres..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}

        {data && (
          <>
            {redeemResult && (
              <Card label={redeemResult.alreadyRedeemed ? 'Já estava resgatada' : 'Refeição livre liberada!'} aside={redeemResult.meal.title}>
                <div className="space-y-3">
                  <p className="text-sm text-ink">
                    -<span className="font-num text-lg text-coin">{formatNumber(redeemResult.coinsDebited)}</span> moedas
                    {redeemResult.vaultDebitKcal > 0 ? (
                      <>
                        {' '}e -<span className="font-num text-lg text-kcal">{formatNumber(redeemResult.vaultDebitKcal)}</span> kcal do cofre
                      </>
                    ) : null}
                    .
                  </p>
                  <p className="text-xs text-ink-faint">
                    Cofre agora: {formatNumber(redeemResult.vaultBalanceKcal)} kcal • moedas: {formatNumber(redeemResult.coinBalance)}
                  </p>
                  {redeemResult.exceededKcal > 0 && (
                    <p className="text-sm text-ink-dim">
                      {formatNumber(redeemResult.exceededKcal)} kcal acima do estimado. Só registramos, sem perder moeda, XP nem sequência.
                    </p>
                  )}
                  {redeemResult.notice && <p className="text-sm text-ink-dim">{redeemResult.notice}</p>}
                  <p className="flex items-start gap-2 text-xs text-ink-faint">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {DIARY_NOTICE}
                  </p>
                  <Button variant="secondary" onClick={() => setRedeemResult(null)}>
                    Fechar
                  </Button>
                </div>
              </Card>
            )}

            <VaultBalanceSummary next={data.next} />

            <div className="flex items-center justify-between">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-dim">Agendadas</h2>
              <Button variant="secondary" className="!w-auto" onClick={() => setBuilderOpen(true)}>
                <CalendarPlus className="h-4 w-4" />
                Agendar refeição
              </Button>
            </div>

            {actionError && <ErrorBlock message={actionError} />}

            {data.next.week.length === 0 && data.next.day.length === 0 && (
              <p className="rounded-lg border-2 border-dashed border-line p-5 text-center text-sm text-ink-faint">
                Nada agendado ainda. Escolha uma refeição do catálogo ou monte a sua.
              </p>
            )}

            <PlanList
              title="Da semana"
              plans={data.next.week}
              totals={data.next.totals.week}
              coinBalance={data.next.coinBalance}
              day={data.day}
              cancellingId={cancellingId}
              onRedeem={setRedeemTarget}
              onCancel={handleCancel}
            />
            <PlanList
              title="De hoje"
              plans={data.next.day}
              totals={data.next.totals.day}
              coinBalance={data.next.coinBalance}
              day={data.day}
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
