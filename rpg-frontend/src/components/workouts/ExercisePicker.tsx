import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { nameKey } from './session';
import type { ExerciseCatalogItem } from '../../types/workout';

/** O que o seletor devolve: um exercício do catálogo (existing) ou um nome novo. */
export interface PickedExercise {
  name: string;
  /** Última carga registrada; vazia para nome novo ou exercício nunca feito. */
  lastSets: ExerciseCatalogItem['lastSets'];
  existing: boolean;
}

interface ExercisePickerProps {
  catalog: ExerciseCatalogItem[];
  onPick: (picked: PickedExercise) => void;
  placeholder?: string;
}

const MAX_RESULTS = 8;

/** Resumo da última carga para a lista: "60kg×10 · 3 séries". */
export function summarizeLastSets(sets: ExerciseCatalogItem['lastSets']): string | null {
  const work = sets.filter((s) => s.technique !== 'warmup');
  const shown = work.length > 0 ? work : sets;
  if (shown.length === 0) return null;
  const top = shown.reduce((best, s) => (s.weightKg > best.weightKg ? s : best), shown[0]);
  return `${top.weightKg}kg×${top.reps} · ${shown.length} ${shown.length === 1 ? 'série' : 'séries'}`;
}

function fromCatalog(item: ExerciseCatalogItem): PickedExercise {
  return {
    name: item.name,
    lastSets: item.lastSets,
    existing: true,
  };
}

/** Busca no catálogo (sem acento/caixa) e cria nome novo. Nome igual a um existente seleciona o existente. */
export function ExercisePicker({
  catalog,
  onPick,
  placeholder = 'Buscar ou criar exercício...',
}: ExercisePickerProps) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);

  const query = nameKey(text);
  const exact = query ? catalog.find((c) => nameKey(c.name) === query) : undefined;
  const results = catalog
    .filter((c) => query === '' || nameKey(c.name).includes(query))
    .sort((a, b) => {
      const aStarts = nameKey(a.name).startsWith(query) ? 0 : 1;
      const bStarts = nameKey(b.name).startsWith(query) ? 0 : 1;
      return aStarts - bStarts || b.timesLogged - a.timesLogged || a.name.localeCompare(b.name, 'pt-BR');
    })
    .slice(0, MAX_RESULTS);

  function pick(picked: PickedExercise) {
    onPick(picked);
    setText('');
    setOpen(false);
  }

  function submit() {
    const name = text.trim();
    if (!name) return;
    if (exact) {
      pick(fromCatalog(exact));
      return;
    }
    pick({ name, lastSets: [], existing: false });
  }

  const rowClass =
    'flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg border-2 border-line bg-raised px-3 py-1.5 text-left hover:border-ink-faint active:translate-y-[1px]';

  return (
    <div
      className="space-y-2"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder}
          aria-label="Buscar ou criar exercício"
          className="h-11 w-full rounded-lg border-2 border-line bg-raised pl-9 pr-3 text-base text-ink placeholder:text-ink-faint focus:border-action focus:outline-none"
        />
      </div>

      {open && (
        <div className="max-h-[40dvh] space-y-1.5 overflow-y-auto" role="listbox" aria-label="Exercícios">
          {results.map((item) => {
            const summary = summarizeLastSets(item.lastSets);
            return (
              <button key={item.name} type="button" className={rowClass} onClick={() => pick(fromCatalog(item))}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
                  <span className="block truncate text-xs text-ink-faint">
                    {[
                      item.routines.length > 0 ? `em ${item.routines.join(', ')}` : null,
                      summary ? `última: ${summary}` : 'nunca registrado',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </button>
            );
          })}
          {text.trim() !== '' && !exact && (
            <button type="button" className={`${rowClass} !justify-start border-dashed text-action`} onClick={submit}>
              <Plus className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate text-sm font-semibold">Criar «{text.trim()}»</span>
            </button>
          )}
          {results.length === 0 && text.trim() === '' && (
            <p className="px-1 text-xs text-ink-faint">Nenhum exercício ainda. Digite um nome para criar.</p>
          )}
        </div>
      )}
    </div>
  );
}
