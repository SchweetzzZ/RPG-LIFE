import { Trophy } from 'lucide-react';
import type { FreeMeal } from '@/src/types/free-meal';
import { formatNumber } from '@/src/lib/format';

interface FreeMealGalleryProps {
  meals: FreeMeal[];
}

export function FreeMealGallery({ meals }: FreeMealGalleryProps) {
  return (
    <section className="space-y-3 pt-2">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-dim">
        <Trophy className="h-3.5 w-3.5 text-coin" />
        Galeria de conquistas
      </h2>

      {meals.length === 0 ? (
        <p className="rounded-lg border-2 border-dashed border-line p-4 text-center text-sm text-ink-faint">
          Suas refeições livres resgatadas aparecem aqui.
        </p>
      ) : (
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
                {meal.redeemedAt ? new Date(meal.redeemedAt).toLocaleDateString('pt-BR') : meal.scheduledFor} •{' '}
                ~{formatNumber(meal.actualKcal ?? meal.estimatedKcal)} kcal
                {meal.exceededKcal && meal.exceededKcal > 0 ? ` • ${formatNumber(meal.exceededKcal)} kcal acima do estimado` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
