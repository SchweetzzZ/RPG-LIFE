import { useState } from 'react';
import { X } from 'lucide-react';
import { ExerciseChart } from './ExerciseChart';
import { ExercisePicker } from './ExercisePicker';
import type { ExerciseCatalogItem } from '../../types/workout';

/** Histórico "por exercício": escolhe um exercício do catálogo e mostra o gráfico dele. */
export function ExerciseHistoryView({ catalog }: { catalog: ExerciseCatalogItem[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (catalog.length === 0) {
    return <p className="text-sm text-ink-dim">Nenhum exercício ainda. Crie uma rotina ou registre um treino.</p>;
  }

  return (
    <div className="space-y-3">
      {selected === null ? (
        <ExercisePicker catalog={catalog} onPick={(picked) => setSelected(picked.name)} placeholder="Buscar exercício..." />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <h3 className="min-w-0 truncate font-pixel text-lg text-ink">{selected}</h3>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-dim hover:text-ink"
            >
              <X className="h-4 w-4" />
              Trocar exercício
            </button>
          </div>
          <ExerciseChart name={selected} />
        </>
      )}
    </div>
  );
}
