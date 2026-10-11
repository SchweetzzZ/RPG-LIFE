import { Trophy } from 'lucide-react';
import type { FreeMeal } from '@/src/types/free-meal';
import { formatNumber } from '@/src/lib/format';

interface FreeMealGalleryProps {
  meals: FreeMeal[];
}

export function FreeMealGallery({ meals }: FreeMealGalleryProps) {
  return (
    <section className="space-y-3 pt-2">
      <h2 className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <Trophy className="h-3.5 w-3.5 text-amber-400" />
        Galeria de conquistas
      </h2>

      {meals.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/[0.08] p-4 text-center text-xs text-zinc-500">
          Suas refeições livres resgatadas aparecem aqui.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {meals.map((meal) => (
            <li key={meal.id} className="rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-4 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-bold text-zinc-100">{meal.title}</h3>
                <span className="shrink-0 rounded border border-white/[0.1] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                  {meal.scope === 'day' ? 'Refeição livre do dia' : 'Refeição livre'}
                </span>
              </div>
              <p className="font-mono text-[11px] text-zinc-500">
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
