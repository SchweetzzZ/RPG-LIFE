import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CalendarPlus, Info, ShoppingBag } from 'lucide-react';
import { CoinHud, PageHeader } from '../components/layout/PageHeader';
import { celebrate } from '../lib/celebrate';
import { Button } from '../components/ui/Button';
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
import type { FreeMealPlan, FreeMealTemplate, NextFreeMeals, RedeemFreeMealResult } from '../types/free-meal';

export const Route = createFileRoute('/rewards')({
  component: RewardsRouteComponent,
});

interface PlanListProps {
  title: string;
  plans: FreeMealPlan[];
  totals: NextFreeMeals['totals']['week'];
  coinBalance: number;
  day: DayState | null;
  /** Catálogo: para calcular os macros das refeições agendadas a partir do template. */
  templates: FreeMealTemplate[];
  cancellingId: string | null;
  onRedeem: (plan: FreeMealPlan) => void;
  onCancel: (plan: FreeMealPlan) => void;
}

function PlanList({ title, plans, totals, coinBalance, day, templates, cancellingId, onRedeem, onCancel }: PlanListProps) {
  if (plans.length === 0) return null;

  return (
    <section className="space-y-3 pt-2">
      <div className="px-1">
        <h2 className="font-pixel text-[13px] uppercase text-ink-dim">{title}</h2>
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
            templates={templates}
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

/** Resgate como um ticket de verdade: bordas picotadas, carimbo e o que saiu do cofre e da carteira. */
function RedeemTicket({ result, onClose }: { result: RedeemFreeMealResult; onClose: () => void }) {
  useEffect(() => {
    if (!result.alreadyRedeemed) celebrate(true);
  }, [result]);

  // Recortes em meia-lua nas laterais (picote do ticket), feitos com máscara.
  // O de dentro é um pouco maior que o de fora: sobra um contorno dourado em volta do recorte.
  const notch = (r: number) => {
    const m = `radial-gradient(circle ${r}px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle ${r}px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat`;
    return { WebkitMask: m, mask: m };
  };

  return (
    <section className="relative overflow-hidden rounded-lg bg-coin p-[2px] shadow-[0_4px_0_0_#0c0a08]" style={notch(10)}>
      <div className="relative space-y-3 rounded-[6px] bg-surface p-4" style={notch(12)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-pixel text-xs uppercase text-coin">{result.alreadyRedeemed ? 'Já estava resgatada' : 'Ticket de refeição livre'}</p>
            <h2 className="text-xl font-bold leading-tight text-ink">{result.meal.title}</h2>
          </div>
          {!result.alreadyRedeemed && (
            <span className="shrink-0 -rotate-12 rounded-md border-2 border-action px-2 py-1 font-pixel text-sm uppercase leading-none text-action">
              Liberada
            </span>
          )}
        </div>

        {/* Linha de picote entre o canhoto e o corpo do ticket */}
        <div className="border-t-2 border-dashed border-line" aria-hidden />

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border-2 border-line bg-raised px-3 py-2">
            <p className="text-xs text-ink-faint">moedas</p>
            <p className="font-num text-2xl leading-tight text-coin">-{formatNumber(result.coinsDebited)}</p>
          </div>
          <div className="rounded-lg border-2 border-line bg-raised px-3 py-2">
            <p className="text-xs text-ink-faint">do cofre</p>
            {result.vaultDebitKcal > 0 ? (
              <p className="font-num text-2xl leading-tight text-kcal">-{formatNumber(result.vaultDebitKcal)} kcal</p>
            ) : (
              <p className="pt-1 text-sm leading-tight text-ink-dim">intacto</p>
            )}
          </div>
        </div>

        <p className="text-xs text-ink-faint">
          Cofre agora: {formatNumber(result.vaultBalanceKcal)} kcal • moedas: {formatNumber(result.coinBalance)}
        </p>
        {result.exceededKcal > 0 && (
          <p className="text-sm text-ink-dim">
            {formatNumber(result.exceededKcal)} kcal acima do estimado. Só registramos, sem perder moeda, XP nem sequência.
          </p>
        )}
        {result.notice && <p className="text-sm text-ink-dim">{result.notice}</p>}
        <Button variant="secondary" onClick={onClose}>
          Bom apetite!
        </Button>
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
    <main className="min-h-screen px-3 pb-28 pt-3 text-ink sm:p-4 sm:pb-28">
      <div className="mx-auto w-full max-w-md space-y-3">
        <PageHeader
          title="Loja"
          icon={ShoppingBag}
          aside={data ? <CoinHud value={formatNumber(data.next.coinBalance)} /> : undefined}
        />
        {loading && !data && <LoadingBlock label="Carregando suas refeições livres..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}

        {data && (
          <>
            {redeemResult && <RedeemTicket result={redeemResult} onClose={() => setRedeemResult(null)} />}

            <VaultBalanceSummary next={data.next} />

            <div className="flex items-center justify-between">
              <h2 className="px-1 font-pixel text-[13px] uppercase text-ink-dim">Agendadas</h2>
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
              templates={data.templates}
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
              templates={data.templates}
              cancellingId={cancellingId}
              onRedeem={setRedeemTarget}
              onCancel={handleCancel}
            />

            <FreeMealGallery meals={data.gallery} templates={data.templates} />
          </>
        )}
      </div>

      {data && builderOpen && (
        <MealBuilderModal
          templates={data.templates}
          next={data.next}
          day={data.day}
          onClose={() => setBuilderOpen(false)}
          onCreated={reload}
        />
      )}

      {redeemTarget && (
        <RedeemModal
          plan={redeemTarget}
          templates={data?.templates ?? []}
          onClose={() => setRedeemTarget(null)}
          onRedeemed={handleRedeemed}
          onFailed={reload}
        />
      )}
    </main>
  );
}
