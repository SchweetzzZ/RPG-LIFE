import { useEffect, useState } from 'react';
import { Barcode, Loader2, Search, Star, Trash2, X } from 'lucide-react';
import type { FavoriteFood, LoggableFood, RecentFood, SavedMeal } from '@/src/types/nutrition';
import { foodSearchService } from '@/src/services/free-meal.service';
import { nutritionService } from '@/src/services/nutrition.service';
import { errorMessage } from '@/src/services/http';
import { formatNumber } from '@/src/lib/format';
import { Button } from '../ui/Button';
import { FoodRow } from './FoodRow';

interface FoodSearchModalProps {
  mealTitle: string;
  saving: boolean;
  onConfirm: (food: LoggableFood, grams: number) => void;
  onLogSavedMeal: (meal: SavedMeal) => void;
  onClose: () => void;
}

const BARCODE = /^\d{8,14}$/;

const foodKey = (food: Pick<LoggableFood, 'source' | 'id'>) => `${food.source}:${food.id}`;

const toError = (err: unknown, fallback: string) => errorMessage(err instanceof Error ? err : null, fallback);

export function FoodSearchModal({ mealTitle, saving, onConfirm, onLogSavedMeal, onClose }: FoodSearchModalProps) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<LoggableFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<LoggableFood | null>(null);
  const [grams, setGrams] = useState('100');

  // Atalhos mostrados com a busca vazia
  const [recent, setRecent] = useState<RecentFood[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [shortcutsLoading, setShortcutsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Uma falha num atalho não derruba os outros nem a busca
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([nutritionService.recent(), nutritionService.favorites(), nutritionService.savedMeals()]).then(
      ([r, f, s]) => {
        if (cancelled) return;
        if (r.status === 'fulfilled') setRecent(r.value);
        if (f.status === 'fulfilled') setFavorites(f.value);
        if (s.status === 'fulfilled') setSavedMeals(s.value);
        setShortcutsLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Busca com atraso para não chamar a API a cada tecla. Só dígitos (8–14) = código de barras.
  useEffect(() => {
    const query = term.trim();
    if (query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const found = BARCODE.test(query) ? [await nutritionService.barcode(query)] : await foodSearchService.search(query);
        if (!cancelled) setResults(found);
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(toError(err, 'Falha ao buscar alimentos'));
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  function pick(food: LoggableFood, defaultGrams = food.servingSizeGrams) {
    setPicked(food);
    setGrams(String(defaultGrams));
  }

  const favoriteByKey = new Map(favorites.map((f) => [foodKey(f), f]));

  async function toggleFavorite(food: LoggableFood) {
    const key = foodKey(food);
    const existing = favoriteByKey.get(key);
    setBusyKey(key);
    setError(null);
    try {
      if (existing) {
        await nutritionService.removeFavorite(existing.favoriteId);
        setFavorites((list) => list.filter((f) => f.favoriteId !== existing.favoriteId));
      } else {
        const created = await nutritionService.addFavorite({
          source: food.source,
          id: food.id,
          name: food.name,
          ...(food.brand ? { brand: food.brand } : {}),
          ...(food.barcode ? { barcode: food.barcode } : {}),
          servingSizeGrams: food.servingSizeGrams,
          nutrientsPer100g: {
            calories: food.nutrientsPer100g.calories,
            protein: food.nutrientsPer100g.protein,
            carbs: food.nutrientsPer100g.carbs,
            fat: food.nutrientsPer100g.fat,
          },
        });
        setFavorites((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
      }
    } catch (err) {
      setError(toError(err, 'Não foi possível atualizar o favorito'));
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteSavedMeal(meal: SavedMeal) {
    setBusyKey(`meal:${meal.id}`);
    setError(null);
    try {
      await nutritionService.deleteSavedMeal(meal.id);
      setSavedMeals((list) => list.filter((m) => m.id !== meal.id));
    } catch (err) {
      setError(toError(err, 'Não foi possível remover a refeição pronta'));
    } finally {
      setBusyKey(null);
    }
  }

  function row(food: LoggableFood, opts: { hint?: string; grams?: number } = {}) {
    const key = foodKey(food);
    return (
      <FoodRow
        key={key}
        food={food}
        hint={opts.hint}
        favorite={favoriteByKey.has(key)}
        starBusy={busyKey === key}
        onPick={() => pick(food, opts.grams)}
        onToggleFavorite={() => void toggleFavorite(food)}
      />
    );
  }

  const amount = Number(grams);
  const valid = Number.isFinite(amount) && amount > 0;
  const showShortcuts = term.trim().length < 2;
  const hasShortcuts = recent.length > 0 || favorites.length > 0 || savedMeals.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 sm:items-center sm:p-4">
      <div className="flex max-h-[85dvh] w-full flex-col gap-4 rounded-t-xl border-2 border-line bg-surface p-4 sm:max-w-lg sm:rounded-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Registrar alimento</p>
            <h3 className="text-base font-bold text-ink">Adicionar a {mealTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-line text-ink-dim hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {picked ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-ink">{picked.name}</p>
                {picked.brand && <p className="text-xs text-ink-faint">{picked.brand}</p>}
              </div>
              <button
                type="button"
                disabled={busyKey === foodKey(picked)}
                onClick={() => void toggleFavorite(picked)}
                aria-pressed={favoriteByKey.has(foodKey(picked))}
                aria-label={favoriteByKey.has(foodKey(picked)) ? 'Tirar dos favoritos' : 'Favoritar'}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line text-ink-faint hover:text-coin disabled:opacity-50"
              >
                <Star className={`h-4 w-4 ${favoriteByKey.has(foodKey(picked)) ? 'fill-coin text-coin' : ''}`} />
              </button>
            </div>
            <label className="block space-y-1">
              <span className="text-sm text-ink-dim">Quantidade (g)</span>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                className="h-12 w-full rounded-lg border-2 border-line bg-raised px-3 text-base text-ink focus:border-action focus:outline-none"
              />
            </label>
            {valid && (
              <p className="text-sm text-ink-dim">
                <span className="font-num text-lg text-kcal">
                  {formatNumber((picked.nutrientsPer100g.calories * amount) / 100)}
                </span>{' '}
                kcal · P {formatNumber((picked.nutrientsPer100g.protein * amount) / 100)} · C{' '}
                {formatNumber((picked.nutrientsPer100g.carbs * amount) / 100)} · G{' '}
                {formatNumber((picked.nutrientsPer100g.fat * amount) / 100)}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Button disabled={!valid || saving} onClick={() => onConfirm(picked, amount)}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Registrar
              </Button>
              <Button variant="link" onClick={() => setPicked(null)}>
                Escolher outro
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar alimento ou código de barras"
                className="h-12 w-full rounded-lg border-2 border-line bg-raised pl-9 pr-3 text-base text-ink placeholder:text-ink-faint focus:border-action focus:outline-none"
              />
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {error && (
                <p role="alert" className="py-3 text-sm text-danger">
                  {error}
                </p>
              )}

              {showShortcuts ? (
                <>
                  {shortcutsLoading && (
                    <p className="flex items-center gap-2 py-3 text-sm text-ink-dim">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando seus alimentos...
                    </p>
                  )}
                  {!shortcutsLoading && !hasShortcuts && (
                    <p className="flex items-center gap-2 py-3 text-sm text-ink-faint">
                      <Barcode className="h-4 w-4" /> Digite pelo menos 2 letras ou um código de barras.
                    </p>
                  )}

                  {savedMeals.length > 0 && (
                    <section className="space-y-2">
                      <h4 className="pt-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">Refeições prontas</h4>
                      {savedMeals.map((meal) => (
                        <div key={meal.id} className="flex items-stretch gap-1 rounded-lg border-2 border-line bg-raised hover:border-ink-faint">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => onLogSavedMeal(meal)}
                            className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-3 p-3 text-left disabled:opacity-50"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-ink">{meal.name}</span>
                              <span className="block truncate text-xs text-ink-faint">
                                {meal.items.map((i) => i.foodName).join(', ')}
                              </span>
                            </span>
                            <span className="shrink-0 font-num text-base tabular-nums text-kcal">
                              {formatNumber(meal.totals.calories)}
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === `meal:${meal.id}`}
                            onClick={() => void deleteSavedMeal(meal)}
                            aria-label={`Apagar a refeição pronta ${meal.name}`}
                            className="flex w-11 shrink-0 items-center justify-center text-ink-faint hover:text-danger disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </section>
                  )}

                  {favorites.length > 0 && (
                    <section className="space-y-2">
                      <h4 className="pt-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">Favoritos</h4>
                      {favorites.map((food) => row(food))}
                    </section>
                  )}

                  {recent.length > 0 && (
                    <section className="space-y-2">
                      <h4 className="pt-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">Recentes</h4>
                      {recent.map((food) =>
                        row(food, { hint: `última: ${formatNumber(food.lastAmountGrams)} g`, grams: food.lastAmountGrams }),
                      )}
                    </section>
                  )}
                </>
              ) : (
                <>
                  {searching && (
                    <p className="flex items-center gap-2 py-3 text-sm text-ink-dim">
                      <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                    </p>
                  )}
                  {!searching && !error && results.length === 0 && (
                    <p className="py-3 text-sm text-ink-faint">Nenhum alimento encontrado.</p>
                  )}
                  {results.map((food) => row(food))}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
