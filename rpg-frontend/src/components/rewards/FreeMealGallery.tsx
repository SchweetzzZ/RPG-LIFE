import { Trophy } from 'lucide-react';
import type { FreeMeal, FreeMealTemplate } from '@/src/types/free-meal';
import { formatNumber } from '@/src/lib/format';
import { mealMacros } from '@/src/lib/meal-macros';
import { macrosLabel } from '@/src/lib/meal-draft';

interface FreeMealGalleryProps {
  meals: FreeMeal[];
  /** Catálogo: macros calculados na hora a partir do template. */
  templates: FreeMealTemplate[];
}

/** "P 45 · C 120 · G 40 g" do que foi comido (ou planejado); vazio se nenhum item tem macros. */
function macrosLine(meal: FreeMeal, templates: FreeMealTemplate[]): string | null {
  const items = meal.actualItems ?? meal.plannedItems;
  const macros = mealMacros(meal, templates, items);
  if (macros.counted === 0) return null;
  const parts = `${macrosLabel(macros)} g`;
  return macros.missing > 0 ? `${parts} (${macros.missing} sem macros)` : parts;
}

function GalleryMacros({ meal, templates }: { meal: FreeMeal; templates: FreeMealTemplate[] }) {
  const line = macrosLine(meal, templates);
  return line ? <p className="font-num text-sm text-ink-dim">{line}</p> : null;
}

export function FreeMealGallery({ meals, templates }: FreeMealGalleryProps) {
  // Galeria vazia nao aparece
  if (meals.length === 0) return null;

  return (
    <section className="space-y-3 pt-2">
      <h2 className="flex items-center gap-1.5 font-pixel text-[13px] uppercase text-ink-dim">
        <Trophy className="h-3.5 w-3.5 text-coin" />
        Galeria de conquistas
      </h2>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {meals.map((meal) => (
          <li key={meal.id} className="rounded-lg border-2 border-line bg-surface p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-ink">{meal.title}</h3>
              <span className="shrink-0 rounded border-2 border-line px-1.5 py-0.5 text-xs text-ink-dim">
                {meal.scope === 'day' ? 'Refeição livre do dia' : 'Refeição livre'}
              </span>
            </div>
            <p className="text-xs text-ink-faint">
              {meal.redeemedAt ? new Date(meal.redeemedAt).toLocaleDateString('pt-BR') : meal.scheduledFor} • ~
              {formatNumber(meal.actualKcal ?? meal.estimatedKcal)} kcal
              {meal.exceededKcal && meal.exceededKcal > 0
                ? ` • ${formatNumber(meal.exceededKcal)} kcal acima do estimado`
                : ''}
            </p>
            <GalleryMacros meal={meal} templates={templates} />
          </li>
        ))}
      </ul>
    </section>
  );
}
