import { useState } from 'react';
import { CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { freeMealService } from '@/src/services/free-meal.service';
import { errorMessage } from '@/src/services/http';
import { ExtraItemsEditor } from './ExtraItemsEditor';
import { QuantityStepper } from './QuantityStepper';
import { ItemSubtotal } from './ItemSubtotal';
import { MealTotalsHud } from './MealTotalsHud';
import {
  DIARY_NOTICE,
  draftToInput,
  gramsLabel,
  stepFor,
  sumKcal,
  sumMacros,
  type ExtraDraft,
  type MacroLine,
} from '@/src/lib/meal-draft';
import { savedItemMacros } from '@/src/lib/meal-macros';
import { Button } from '../ui/Button';
import { formatNumber } from '@/src/lib/format';
import type {
  FreeMealItemInput,
  FreeMealPlan,
  FreeMealTemplate,
  RedeemFreeMealInput,
  RedeemFreeMealResult,
} from '@/src/types/free-meal';

interface RedeemModalProps {
  plan: FreeMealPlan;
  /** Catálogo: macros dos itens que vieram de um template (nada de macro é gravado na refeição). */
  templates: FreeMealTemplate[];
  onClose: () => void;
  onRedeemed: (result: RedeemFreeMealResult) => Promise<void>;
  /** O resgate falhou (ex.: o saldo mudou): reler do servidor. */
  onFailed: () => Promise<void>;
}

/** Registro do que foi comido de fato. Sem mexer em nada, resgata exatamente o planejado. */
export function RedeemModal({ plan, templates, onClose, onRedeemed, onFailed }: RedeemModalProps) {
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

  const template = meal.templateSlug ? templates.find((t) => t.slug === meal.templateSlug) : undefined;
  const plannedMacros = meal.plannedItems.map((item) => savedItemMacros(item, template));
  const macroLines: MacroLine[] = [
    ...plannedAsEaten.map((item, index) => ({ qty: item.qty, macros: plannedMacros[index] ?? null })),
    ...extras.map((extra) => ({ qty: extra.qty, macros: extra.macrosPerUnit ?? null })),
  ];
  const macros = sumMacros(macroLines);
  const budgetLabel = meal.scope === 'day' ? 'Sobra de hoje' : 'Cofre';

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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 sm:items-center sm:p-4">
      <div className="flex max-h-[85dvh] w-full flex-col rounded-t-xl border-2 border-line bg-surface sm:max-w-lg sm:rounded-lg">
        <div className="flex items-start justify-between gap-3 p-4 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink">Resgatar: {meal.title}</h3>
            <p className="text-xs text-ink-faint">Ajuste só se comeu algo diferente do planejado.</p>
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

        <div className="space-y-4 overflow-y-auto px-4 pb-3">
          <ul className="space-y-2">
            {meal.plannedItems.map((item, index) => (
              <li key={`${item.key ?? item.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border-2 border-line bg-raised p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-ink-faint">
                    {item.unit} • planejado: {item.qty}
                  </p>
                  <ItemSubtotal kcalPerUnit={item.kcalPerUnit} qty={quantities[index] ?? 0} macrosPerUnit={plannedMacros[index] ?? null} />
                </div>
                <QuantityStepper
                  label={item.name}
                  value={quantities[index]}
                  step={stepFor(item.unit)}
                  hint={gramsLabel(item.unit, quantities[index] ?? 0)}
                  onChange={(qty) => setQuantities((prev) => prev.map((value, i) => (i === index ? qty : value)))}
                />
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-dim">Comeu algo a mais?</p>
            <ExtraItemsEditor items={extras} onChange={setExtras} />
          </div>

          <p className="flex items-start gap-2 rounded-lg border-2 border-line bg-raised p-3 text-xs text-ink-dim">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {DIARY_NOTICE}
          </p>
        </div>

        <div className="space-y-3 border-t-2 border-line bg-bg/40 p-4">
          <MealTotalsHud kcal={actualKcal} macros={macros} budget={{ label: budgetLabel, kcal: plan.availableKcal }}>
            <p>Estimado no agendamento: ~{formatNumber(meal.estimatedKcal)} kcal</p>
            {difference < 0 && edited && (
              <p>Você comeu {formatNumber(-difference)} kcal a menos: a sobra continua no cofre até o fim da semana.</p>
            )}
            {difference > 0 && (
              <p>{formatNumber(difference)} kcal acima do estimado: só registramos, sem perder moeda, XP nem sequência.</p>
            )}
            <p>Ticket: -{formatNumber(meal.ticketCost)} moedas.</p>
          </MealTotalsHud>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            onClick={handleRedeem}
            disabled={saving || !hasItems}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {edited ? 'Resgatar com o que comi' : 'Resgatar como planejado'}
          </Button>
        </div>
      </div>
    </div>
  );
}
