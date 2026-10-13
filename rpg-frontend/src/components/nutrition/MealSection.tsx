import { Plus, Trash2 } from 'lucide-react';
import type { FoodLog, MealType } from '@/src/types/nutrition';
import { formatNumber } from '@/src/lib/format';
import { Card } from '../ui/Card';

export interface MealBlock {
  type: MealType;
  title: string;
}

interface MealSectionProps {
  meal: MealBlock;
  logs: FoodLog[];
  busyId: string | null;
  onAdd: (type: MealType) => void;
  onDelete: (log: FoodLog) => void;
}

export function MealSection({ meal, logs, busyId, onAdd, onDelete }: MealSectionProps) {
  const kcal = logs.reduce((acc, log) => acc + log.calories, 0);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink">{meal.title}</h3>
          <p className="text-xs text-ink-faint">{formatNumber(kcal)} kcal</p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(meal.type)}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border-2 border-line bg-raised px-3 text-sm font-semibold text-ink hover:border-ink-faint active:translate-y-[1px]"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="pt-3 text-sm text-ink-faint">Nada registrado.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-3 rounded-lg border-2 border-line bg-raised p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{log.foodName}</p>
                <p className="text-xs text-ink-faint">
                  {formatNumber(log.amountGrams)} g · P {formatNumber(log.proteinGrams)} · C {formatNumber(log.carbGrams)} · G{' '}
                  {formatNumber(log.fatGrams)}
                </p>
              </div>
              <span className="font-pixel text-base font-bold tabular-nums text-kcal">{formatNumber(log.calories)}</span>
              <button
                type="button"
                disabled={busyId === log.id}
                onClick={() => onDelete(log)}
                aria-label={`Remover ${log.foodName}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:text-danger disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
