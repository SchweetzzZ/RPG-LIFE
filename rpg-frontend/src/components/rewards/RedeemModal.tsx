import { useState } from 'react';
import { CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { freeMealService } from '@/src/services/free-meal.service';
import { errorMessage } from '@/src/services/http';
import { ExtraItemsEditor } from './ExtraItemsEditor';
import { QuantityStepper } from './QuantityStepper';
import { DIARY_NOTICE, draftToInput, stepFor, sumKcal, type ExtraDraft } from '@/src/lib/meal-draft';
import { formatNumber } from '@/src/lib/format';
import type { FreeMealItemInput, FreeMealPlan, RedeemFreeMealInput, RedeemFreeMealResult } from '@/src/types/free-meal';

interface RedeemModalProps {
  plan: FreeMealPlan;
  onClose: () => void;
  onRedeemed: (result: RedeemFreeMealResult) => Promise<void>;
  /** O resgate falhou (ex.: o saldo mudou): reler do servidor. */
  onFailed: () => Promise<void>;
}

/** Registro do que foi comido de fato. Sem mexer em nada, resgata exatamente o planejado. */
export function RedeemModal({ plan, onClose, onRedeemed, onFailed }: RedeemModalProps) {
  const { meal } = plan;
  const [quantities, setQuantities] = useState<number[]>(meal.plannedItems.map((item) => item.qty));
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plannedAsEaten = meal.plannedItems.map((item, index) => ({ ...item, qty: quantities[index] }));
  const actualKcal = sumKcal(plannedAsEaten) + sumKcal(extras);
  const edited = extras.length > 0 || quantities.some((qty, index) => qty !== meal.plannedItems[index].qty);
  const hasItems = plannedAsEaten.some((item) => item.qty > 0) || extras.length > 0;
  const difference = actualKcal - meal.estimatedKcal;

  async function handleRedeem() {
    const actualItems: FreeMealItemInput[] = [
      ...plannedAsEaten
        .filter((item) => item.qty > 0)
        .map((item) => ({
          ...(item.key ? { key: item.key } : {}),
          name: item.name,
          unit: item.unit,
          kcalPerUnit: item.kcalPerUnit,
          qty: item.qty,
          source: { kind: item.source.kind, ...(item.source.refId ? { refId: item.source.refId } : {}) },
        })),
      ...extras.map(draftToInput),
    ];
    const input: RedeemFreeMealInput = edited ? { actualItems } : {};

    setSaving(true);
    setError(null);
    try {
      const result = await freeMealService.redeem(meal.id, input);
      await onRedeemed(result);
      onClose();
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível resgatar a refeição'));
      setSaving(false);
      await onFailed();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col rounded-t-3xl border border-white/[0.1] bg-[#0c0e12] shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-100">Resgatar: {meal.title}</h3>
            <p className="text-xs text-zinc-500">Ajuste só se comeu algo diferente do planejado.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 pb-3">
          <ul className="space-y-2">
            {meal.plannedItems.map((item, index) => (
              <li key={`${item.key ?? item.name}-${index}`} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-zinc-200">{item.name}</p>
                  <p className="font-mono text-[10px] text-zinc-500">
                    {item.unit} • planejado: {item.qty}
                  </p>
                </div>
                <QuantityStepper
                  label={item.name}
                  value={quantities[index]}
                  step={stepFor(item.unit)}
                  onChange={(qty) => setQuantities((prev) => prev.map((value, i) => (i === index ? qty : value)))}
                />
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">Comeu algo a mais?</p>
            <ExtraItemsEditor items={extras} onChange={setExtras} />
          </div>

          <p className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {DIARY_NOTICE}
          </p>
        </div>

        <div className="space-y-3 border-t border-white/[0.06] p-5 pt-3">
          <div className="space-y-0.5 font-mono text-[11px] text-zinc-400">
            <p>
              Comido: <span className="font-bold text-zinc-100">~{formatNumber(actualKcal)} kcal</span> • estimado: ~{formatNumber(meal.estimatedKcal)} kcal
            </p>
            {difference < 0 && edited && (
              <p>Você comeu {formatNumber(-difference)} kcal a menos: a sobra continua no cofre até o fim da semana.</p>
            )}
            {difference > 0 && (
              <p>{formatNumber(difference)} kcal acima do estimado: só registramos, sem perder moeda, XP nem sequência.</p>
            )}
            <p>Ticket: -{formatNumber(meal.ticketCost)} moedas.</p>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="button"
            onClick={handleRedeem}
            disabled={saving || !hasItems}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-amber-400 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {edited ? 'Resgatar com o que comi' : 'Resgatar como planejado'}
          </button>
        </div>
      </div>
    </div>
  );
}
