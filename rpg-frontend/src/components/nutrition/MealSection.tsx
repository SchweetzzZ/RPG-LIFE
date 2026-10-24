import { useState } from 'react';
import { BookmarkPlus, Copy, Loader2, Plus, Trash2 } from 'lucide-react';
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
  /** Mesma refeição ontem: com itens, a refeição vazia mostra "Copiar de ontem". */
  yesterdayLogs: FoodLog[];
  busyId: string | null;
  /** Esta refeição está copiando ou salvando. */
  working: boolean;
  onAdd: (type: MealType) => void;
  onDelete: (log: FoodLog) => void;
  onCopyYesterday: (type: MealType) => void;
  onSave: (type: MealType, name: string) => Promise<boolean>;
}

export function MealSection({
  meal,
  logs,
  yesterdayLogs,
  busyId,
  working,
  onAdd,
  onDelete,
  onCopyYesterday,
  onSave,
}: MealSectionProps) {
  const kcal = logs.reduce((acc, log) => acc + log.calories, 0);
  const yesterdayKcal = yesterdayLogs.reduce((acc, log) => acc + log.calories, 0);
  // null = formulário fechado; string = nome sendo digitado
  const [saveName, setSaveName] = useState<string | null>(null);

  async function submitSave(e: React.FormEvent) {
    e.preventDefault();
    if (saveName === null || saveName.trim() === '') return;
    if (await onSave(meal.type, saveName.trim())) setSaveName(null);
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-pixel text-lg leading-tight text-ink">{meal.title}</h3>
          <p className="text-xs text-ink-faint">
            {logs.length > 0 ? (
              <>
                <span className="font-num text-base text-kcal">{formatNumber(kcal)}</span> kcal · {logs.length}{' '}
                {logs.length === 1 ? 'item' : 'itens'}
              </>
            ) : (
              'vazio'
            )}
          </p>
        </div>
        {logs.length > 0 && (
          <button
            type="button"
            onClick={() => onAdd(meal.type)}
            aria-label={`Adicionar em ${meal.title}`}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border-2 border-line bg-raised px-3 text-sm font-semibold text-ink shadow-[0_3px_0_0_#0c0a08] hover:border-ink-faint active:translate-y-[2px] active:shadow-[0_1px_0_0_#0c0a08]"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <>
          {/* Refeição vazia = espaço de inventário vazio: o próprio espaço é o botão. */}
          <button
            type="button"
            onClick={() => onAdd(meal.type)}
            className="group mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-bg/40 text-sm text-ink-faint transition-colors hover:border-action hover:text-action"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-dashed border-current">
              <Plus className="h-4 w-4" />
            </span>
            Adicionar ao {meal.title.toLowerCase()}
          </button>
          {yesterdayLogs.length > 0 && (
            <button
              type="button"
              disabled={working}
              onClick={() => onCopyYesterday(meal.type)}
              className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border-2 border-line bg-raised px-3 text-sm text-ink-dim hover:border-ink-faint hover:text-ink disabled:opacity-50"
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Copiar de ontem · {yesterdayLogs.length} {yesterdayLogs.length === 1 ? 'item' : 'itens'} ·{' '}
              <span className="font-num text-kcal">{formatNumber(yesterdayKcal)}</span> kcal
            </button>
          )}
        </>
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
              <span className="font-num text-base tabular-nums text-kcal">{formatNumber(log.calories)}</span>
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

      {logs.length > 0 &&
        (saveName === null ? (
          <button
            type="button"
            onClick={() => setSaveName(meal.title)}
            className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 px-1 text-xs text-ink-faint hover:text-ink"
          >
            <BookmarkPlus className="h-4 w-4" />
            Salvar como refeição pronta
          </button>
        ) : (
          <form onSubmit={submitSave} className="mt-3 flex gap-2">
            <input
              type="text"
              autoFocus
              maxLength={60}
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              aria-label="Nome da refeição pronta"
              placeholder="Ex.: Café padrão"
              className="h-11 min-w-0 flex-1 rounded-lg border-2 border-line bg-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:border-action focus:outline-none"
            />
            <button
              type="submit"
              disabled={working || saveName.trim() === ''}
              className="inline-flex h-11 items-center gap-1 rounded-lg border-2 border-[#0c0a08] bg-action px-3 text-sm font-bold text-[#0c0a08] disabled:opacity-50"
            >
              {working && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setSaveName(null)}
              className="h-11 px-2 text-sm text-ink-dim hover:text-ink"
            >
              Cancelar
            </button>
          </form>
        ))}
    </Card>
  );
}
