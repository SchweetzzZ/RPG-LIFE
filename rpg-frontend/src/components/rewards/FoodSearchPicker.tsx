import { useState } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
import { foodSearchService } from '@/src/services/free-meal.service';
import { errorMessage } from '@/src/services/http';
import { draftFromFood, type ExtraDraft } from '@/src/lib/meal-draft';
import type { FoodResult } from '@/src/types/free-meal';

interface FoodSearchPickerProps {
  onPick: (draft: ExtraDraft) => void;
}

/** Busca real do módulo de nutrição (TACO / Open Food Facts) para itens avulsos. */
export function FoodSearchPicker({ onPick }: FoodSearchPickerProps) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<FoodResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await foodSearchService.search(q));
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Falha ao buscar alimentos'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar alimento (ex: brigadeiro)"
          className="h-12 min-w-0 flex-1 rounded-lg border-2 border-line bg-raised px-3 text-base text-ink placeholder:text-ink-faint focus:border-action focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !term.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-line bg-raised text-ink hover:border-ink-faint disabled:opacity-40"
          aria-label="Buscar"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}
      {results && results.length === 0 && <p className="text-xs text-ink-faint">Nada encontrado.</p>}

      {results && results.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {results.map((food) => {
            const draft = draftFromFood(food);
            return (
              <li key={`${food.source}-${food.id}`}>
                <button
                  type="button"
                  disabled={!draft}
                  onClick={() => draft && onPick(draft)}
                  className="flex w-full items-center justify-between gap-3 min-h-[44px] rounded-lg border-2 border-line bg-raised px-3 py-2 text-left hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{food.name}</span>
                    <span className="text-xs text-ink-faint">
                      {food.source === 'TACO' ? 'TACO' : 'Open Food Facts'} • {Math.round(food.nutrientsPer100g.calories)} kcal/100 g
                    </span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-action" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
