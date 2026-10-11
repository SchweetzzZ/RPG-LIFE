import { useState } from 'react';
import { CalendarPlus, Loader2, X } from 'lucide-react';
import { freeMealService } from '@/src/services/free-meal.service';
import { errorMessage } from '@/src/services/http';
import { ExtraItemsEditor } from './ExtraItemsEditor';
import { QuantityStepper } from './QuantityStepper';
import { draftToInput, stepFor, sumKcal, type ExtraDraft } from '@/src/lib/meal-draft';
import { formatNumber } from '@/src/lib/format';
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

export function MealBuilderModal({ templates, next, onClose, onCreated }: MealBuilderModalProps) {
  const [scope, setScope] = useState<FreeMealScope>('week');
  const [date, setDate] = useState(next.cycle.endDate);
  const [template, setTemplate] = useState<FreeMealTemplate | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [title, setTitle] = useState('');
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templateKcal = template
    ? sumKcal(template.items.map((item) => ({ kcalPerUnit: item.kcalPerUnit, qty: quantities[item.key] ?? 0 })))
    : 0;
  const totalKcal = templateKcal + sumKcal(extras);

  const availableKcal = scope === 'week' ? next.vaultBalanceKcal : null;
  const missingTitle = !template && title.trim() === '';
  const canSubmit = totalKcal > 0 && !missingTitle && (scope === 'day' || date !== '') && !saving;

  function pickTemplate(value: FreeMealTemplate | null) {
    setTemplate(value);
    setQuantities(value ? defaultQuantities(value) : {});
  }

  function applyPreset(name: FreeMealPresetName) {
    if (!template) return;
    const preset = template.presets[name].quantities;
    setQuantities(Object.fromEntries(template.items.map((item) => [item.key, preset[item.key] ?? 0])));
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

  const sectionTitle = 'font-mono text-[11px] uppercase tracking-wider text-zinc-400';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92vh] w-full flex-col rounded-t-3xl border border-white/[0.1] bg-[#0c0e12] shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-base font-bold text-zinc-100">Agendar refeição livre</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 pb-3">
          {/* Escopo e data */}
          <div className="space-y-2">
            <p className={sectionTitle}>Quando</p>
            <div className="grid grid-cols-2 rounded-xl border border-white/[0.08] bg-[#08090a] p-1 text-xs font-semibold">
              {(['week', 'day'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScope(value)}
                  className={`min-h-[38px] rounded-lg ${scope === value ? 'bg-[#14171d] text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#08090a] px-3 text-sm text-zinc-100 focus:border-amber-400/60 focus:outline-none"
              />
            ) : (
              <p className="text-xs text-zinc-500">Paga só com a sobra da meta de hoje e não usa o cofre da semana.</p>
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
                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center ${
                    template?.slug === t.slug
                      ? 'border-amber-400/60 bg-amber-400/10 text-amber-200'
                      : 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-[11px] font-semibold leading-tight">{t.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => pickTemplate(null)}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center ${
                  template === null
                    ? 'border-amber-400/60 bg-amber-400/10 text-amber-200'
                    : 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-xl">✍️</span>
                <span className="text-[11px] font-semibold leading-tight">Personalizada</span>
              </button>
            </div>
          </div>

          {/* Montador do template */}
          {template && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className={sectionTitle}>Quantidades</p>
                <div className="flex gap-1">
                  {PRESET_NAMES.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => applyPreset(name)}
                      className="rounded-lg border border-white/[0.1] px-2 py-1 font-mono text-[11px] text-zinc-300 hover:bg-white/[0.06]"
                    >
                      {PRESET_LABELS[name]} ~{formatNumber(template.presets[name].kcal)}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="space-y-2">
                {template.items.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-zinc-200">{item.name}</p>
                      <p className="font-mono text-[10px] text-zinc-500">
                        {item.unit} • {formatNumber(item.kcalPerUnit)} kcal cada
                      </p>
                    </div>
                    <QuantityStepper
                      label={item.name}
                      value={quantities[item.key] ?? 0}
                      step={stepFor(item.unit)}
                      onChange={(qty) => setQuantities((prev) => ({ ...prev, [item.key]: qty }))}
                    />
                  </li>
                ))}
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
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#08090a] px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:outline-none"
            />
          </div>

          {/* Itens avulsos */}
          <div className="space-y-2">
            <p className={sectionTitle}>Itens avulsos</p>
            <ExtraItemsEditor items={extras} onChange={setExtras} />
          </div>
        </div>

        {/* Prévia do impacto + ação */}
        <div className="space-y-3 border-t border-white/[0.06] p-5 pt-3">
          <div className="space-y-0.5 font-mono text-[11px] text-zinc-400">
            <p>Total estimado: <span className="font-bold text-zinc-100">~{formatNumber(totalKcal)} kcal</span></p>
            {availableKcal !== null && totalKcal > 0 && (
              <p>
                Cofre hoje: {formatNumber(availableKcal)} kcal •{' '}
                {availableKcal >= totalKcal
                  ? `cobre a refeição (sobram ${formatNumber(availableKcal - totalKcal)})`
                  : `faltam ${formatNumber(totalKcal - availableKcal)} kcal (depois de agendar, a lista mostra quanto guardar por dia)`}
              </p>
            )}
            <p>Agendar só planeja: nada é cobrado até o resgate.</p>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-amber-400 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Agendar
          </button>
        </div>
      </form>
    </div>
  );
}
