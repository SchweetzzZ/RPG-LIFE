import { Star } from 'lucide-react';
import type { LoggableFood } from '@/src/types/nutrition';
import { formatNumber } from '@/src/lib/format';

interface FoodRowProps {
  food: LoggableFood;
  /** Texto extra antes dos macros (ex.: "última: 150 g"). */
  hint?: string;
  favorite: boolean;
  starBusy: boolean;
  onPick: () => void;
  onToggleFavorite: () => void;
}

/** Linha de alimento da busca, dos recentes e dos favoritos: toque escolhe, estrela favorita. */
export function FoodRow({ food, hint, favorite, starBusy, onPick, onToggleFavorite }: FoodRowProps) {
  const n = food.nutrientsPer100g;
  return (
    <div className="flex items-stretch gap-1 rounded-lg border-2 border-line bg-raised hover:border-ink-faint">
      <button type="button" onClick={onPick} className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-3 p-3 text-left">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{food.name}</span>
          <span className="block text-xs text-ink-faint">
            {food.brand ? `${food.brand} · ` : ''}
            {hint ? `${hint} · ` : ''}por 100 g · P {formatNumber(n.protein)} · C {formatNumber(n.carbs)} · G {formatNumber(n.fat)}
          </span>
        </span>
        <span className="shrink-0 font-num text-base tabular-nums text-kcal">{formatNumber(n.calories)}</span>
      </button>
      <button
        type="button"
        disabled={starBusy}
        onClick={onToggleFavorite}
        aria-pressed={favorite}
        aria-label={favorite ? `Tirar ${food.name} dos favoritos` : `Favoritar ${food.name}`}
        className="flex w-11 shrink-0 items-center justify-center text-ink-faint hover:text-coin disabled:opacity-50"
      >
        <Star className={`h-4 w-4 ${favorite ? 'fill-coin text-coin' : ''}`} />
      </button>
    </div>
  );
}
