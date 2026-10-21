import { useState } from 'react';
import { CalendarPlus, Loader2, X } from 'lucide-react';
import { freeMealService } from '@/src/services/free-meal.service';
import { errorMessage } from '@/src/services/http';
import { ExtraItemsEditor } from './ExtraItemsEditor';
import { QuantityStepper } from './QuantityStepper';
import { ItemSubtotal } from './ItemSubtotal';
import { MealTotalsHud, type HudBudget } from './MealTotalsHud';
import {
  draftToInput,
  gramsLabel,
  isLiquidNote,
  stepFor,
  sumKcal,
  sumMacros,
  templateItemMacros,
  type ExtraDraft,
  type MacroLine,
} from '@/src/lib/meal-draft';
import { Button } from '../ui/Button';
import { formatNumber } from '@/src/lib/format';
import type { DayState } from '@/src/types/day';
import type {
  CreateFreeMealInput,
  FreeMealPresetName,
  FreeMealScope,
  FreeMealTemplate,
  NextFreeMeals,
} from '@/src/types/free-meal';

interface MealBuilderModalProps {
  templates: FreeMealTemplate[];
  next: NextFreeMeals;
  /** Meta e consumido de hoje: dá a sobra do dia para a barra do escopo "dia" (sem ela, só o total). */
  day: DayState | null;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

const PRESET_LABELS: Record<FreeMealPresetName, string> = {
  light: 'Leve',
  medium: 'Média',
  heavy: 'Pesada',
};
const PRESET_NAMES: FreeMealPresetName[] = ['light', 'medium', 'heavy'];

function defaultQuantities(template: FreeMealTemplate): Record<string, number> {
  return Object.fromEntries(template.items.map((item) => [item.key, item.defaultQty]));
}

export function MealBuilderModal({ templates, next, day, onClose, onCreated }: MealBuilderModalProps) {
  const [scope, setScope] = useState<FreeMealScope>('week');
  const [date, setDate] = useState(next.cycle.endDate);
  const [template, setTemplate] = useState<FreeMealTemplate | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // Atalho aplicado: fica marcado até a pessoa mexer em alguma quantidade
  const [activePreset, setActivePreset] = useState<FreeMealPresetName | null>(null);
  const [title, setTitle] = useState('');
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templateKcal = template
    ? sumKcal(template.items.map((item) => ({ kcalPerUnit: item.kcalPerUnit, qty: quantities[item.key] ?? 0 })))
    : 0;
  const totalKcal = templateKcal + sumKcal(extras);

  const macroLines: MacroLine[] = [
    ...(template?.items ?? []).map((item) => ({ qty: quantities[item.key] ?? 0, macros: templateItemMacros(item) })),
    ...extras.map((extra) => ({ qty: extra.qty, macros: extra.macrosPerUnit ?? null })),
  ];
  const macros = sumMacros(macroLines);

  const availableKcal = scope === 'week' ? next.vaultBalanceKcal : null;
  // Sobra de hoje igual à do backend: se já há refeição "de hoje" agendada, o servidor manda o valor exato
  // (meta - consumido - o que as "de hoje" já resgatadas gastaram); senão, meta - consumido.
  const dayLeftKcal =
    next.day.length > 0 ? next.day[0].availableKcal : day ? Math.max(0, day.targetKcal - day.consumedKcal) : null;
  const budget: HudBudget | null =
    scope === 'week'
      ? { label: 'Cofre', kcal: next.vaultBalanceKcal }
      : dayLeftKcal !== null
        ? { label: 'Sobra de hoje', kcal: dayLeftKcal }
        : null;
  const missingTitle = !template && title.trim() === '';
  const canSubmit = totalKcal > 0 && !missingTitle && (scope === 'day' || date !== '') && !saving;

  function pickTemplate(value: FreeMealTemplate | null) {
    setTemplate(value);
    setQuantities(value ? defaultQuantities(value) : {});
    setActivePreset(null);
  }

  function applyPreset(name: FreeMealPresetName) {
    if (!template) return;
    const preset = template.presets[name].quantities;
    setQuantities(Object.fromEntries(template.items.map((item) => [item.key, preset[item.key] ?? 0])));
    setActivePreset(name);
  }

  function changeQty(key: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [key]: qty }));
    setActivePreset(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const input: CreateFreeMealInput = {
      scope,
      ...(scope === 'week' ? { scheduledFor: date } : {}),
      ...(title.trim() ? { title: title.trim() } : {}),
      ...(template ? { templateSlug: template.slug, quantities } : {}),
      ...(extras.length > 0 ? { extraItems: extras.map(draftToInput) } : {}),
    };

    setSaving(true);
    setError(null);
    try {
      await freeMealService.create(input);
      await onCreated();
      onClose();
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível agendar a refeição'));
      setSaving(false);
    }
  }

  const sectionTitle = 'text-xs font-semibold uppercase tracking-wider text-ink-dim';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[85dvh] w-full flex-col rounded-t-xl border-2 border-line bg-surface sm:max-w-lg sm:rounded-lg"
      >
        <div className="flex items-center justify-between p-4 pb-3">
          <h3 className="text-base font-bold text-ink">Agendar refeição livre</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line text-ink-dim hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-4 pb-3">
          {/* Escopo e data */}
          <div className="space-y-2">
            <p className={sectionTitle}>Quando</p>
            <div className="grid grid-cols-2 rounded-lg border-2 border-line bg-raised p-1 text-xs font-semibold">
              {(['week', 'day'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScope(value)}
                  className={`min-h-[44px] rounded-lg ${scope === value ? 'bg-surface text-ink' : 'text-ink-faint hover:text-ink'}`}
                >
                  {value === 'week' ? 'Da semana (cofre)' : 'De hoje (sobra do dia)'}
                </button>
              ))}
            </div>
            {scope === 'week' ? (
              <input
                type="date"
                value={date}
                min={next.today}
                max={next.cycle.endDate}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 w-full rounded-lg border-2 border-line bg-raised px-3 text-base text-ink focus:border-action focus:outline-none"
              />
            ) : (
              <p className="text-xs text-ink-faint">Paga só com a sobra da meta de hoje e não usa o cofre da semana.</p>
            )}
          </div>

          {/* Catálogo */}
          <div className="space-y-2">
            <p className={sectionTitle}>O que você quer comer</p>
            <div className="grid grid-cols-3 gap-2">
              {templates.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => pickTemplate(t)}
                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border-2 px-1 py-2 text-center ${
                    template?.slug === t.slug
                      ? 'border-action bg-raised text-ink'
                      : 'border-line bg-raised text-ink hover:border-ink-faint'
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-xs font-semibold leading-tight">{t.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => pickTemplate(null)}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border-2 px-1 py-2 text-center ${
                  template === null
                    ? 'border-action bg-raised text-ink'
                    : 'border-line bg-raised text-ink hover:border-ink-faint'
                }`}
              >
                <span className="text-xl">✍️</span>
                <span className="text-xs font-semibold leading-tight">Personalizada</span>
              </button>
            </div>
          </div>

          {/* Montador do template */}
          {template && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className={sectionTitle}>Quantidades</p>
                <div className="flex gap-1">
                  {PRESET_NAMES.map((name) => {
                    const active = activePreset === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={active}
                        onClick={() => applyPreset(name)}
                        className={`flex min-h-[44px] flex-col items-center justify-center rounded-lg border-2 px-2 text-xs leading-tight ${
                          active
                            ? 'translate-y-[2px] border-action bg-action/15 text-ink shadow-[0_1px_0_0_#0c0a08]'
                            : 'border-line bg-raised text-ink shadow-[0_3px_0_0_#0c0a08] hover:border-ink-faint'
                        }`}
                      >
                        <span className="font-semibold">{PRESET_LABELS[name]}</span>
                        <span className="font-num text-sm text-ink-dim">~{formatNumber(template.presets[name].kcal)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <ul className="space-y-2">
                {template.items.map((item) => {
                  const qty = quantities[item.key] ?? 0;
                  return (
                    <li key={item.key} className="flex items-center justify-between gap-2 rounded-lg border-2 border-line bg-raised p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                        <p className="text-xs text-ink-faint">
                          {item.unit} • {formatNumber(item.kcalPerUnit)} kcal cada
                        </p>
                        <ItemSubtotal kcalPerUnit={item.kcalPerUnit} qty={qty} macrosPerUnit={templateItemMacros(item)} />
                      </div>
                      <QuantityStepper
                        label={item.name}
                        value={qty}
                        step={stepFor(item.unit)}
                        hint={gramsLabel(item.unit, qty, isLiquidNote(item.source.note))}
                        onChange={(value) => changeQty(item.key, value)}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Título */}
          <div className="space-y-1.5">
            <label className={sectionTitle} htmlFor="meal-title">
              {template ? 'Nome (opcional)' : 'Nome da refeição'}
            </label>
            <input
              id="meal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={template ? template.name : 'Ex: Churrasco na casa da vó'}
              className="h-12 w-full rounded-lg border-2 border-line bg-raised px-3 text-base text-ink placeholder:text-ink-faint focus:border-action focus:outline-none"
            />
          </div>

          {/* Itens avulsos */}
          <div className="space-y-2">
            <p className={sectionTitle}>Itens avulsos</p>
            <ExtraItemsEditor items={extras} onChange={setExtras} />
          </div>
        </div>

        {/* Prévia do impacto + ação */}
        <div className="space-y-3 border-t-2 border-line bg-bg/40 p-4">
          <MealTotalsHud kcal={totalKcal} macros={macros} budget={budget}>
            {availableKcal !== null && totalKcal > availableKcal && (
              <p>Depois de agendar, a lista mostra quanto guardar por dia.</p>
            )}
            <p>Agendar só planeja: nada é cobrado até o resgate.</p>
          </MealTotalsHud>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            type="submit"
            disabled={!canSubmit}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Agendar
          </Button>
        </div>
      </form>
    </div>
  );
}
