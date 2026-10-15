import { useEffect, useState } from 'react';
import { Barcode, Loader2, Search, X } from 'lucide-react';
import type { FoodResult } from '@/src/types/free-meal';
import { foodSearchService } from '@/src/services/free-meal.service';
import { nutritionService } from '@/src/services/nutrition.service';
import { errorMessage } from '@/src/services/http';
import { formatNumber } from '@/src/lib/format';
import { Button } from '../ui/Button';

interface FoodSearchModalProps {
  mealTitle: string;
  saving: boolean;
  onConfirm: (food: FoodResult, grams: number) => void;
  onClose: () => void;
}

const BARCODE = /^\d{8,14}$/;

export function FoodSearchModal({ mealTitle, saving, onConfirm, onClose }: FoodSearchModalProps) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<FoodResult | null>(null);
  const [grams, setGrams] = useState('100');

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
          setError(errorMessage(err instanceof Error ? err : null, 'Falha ao buscar alimentos'));
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

  function pick(food: FoodResult) {
    setPicked(food);
    setGrams(String(food.servingSizeGrams));
  }

  const amount = Number(grams);
  const valid = Number.isFinite(amount) && amount > 0;

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
            <div>
              <p className="text-base font-semibold text-ink">{picked.name}</p>
              {picked.brand && <p className="text-xs text-ink-faint">{picked.brand}</p>}
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
              {searching && (
                <p className="flex items-center gap-2 py-3 text-sm text-ink-dim">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                </p>
              )}
              {error && (
                <p role="alert" className="py-3 text-sm text-danger">
                  {error}
                </p>
              )}
              {!searching && !error && term.trim().length < 2 && (
                <p className="flex items-center gap-2 py-3 text-sm text-ink-faint">
                  <Barcode className="h-4 w-4" /> Digite pelo menos 2 letras ou um código de barras.
                </p>
              )}
              {!searching && !error && term.trim().length >= 2 && results.length === 0 && (
                <p className="py-3 text-sm text-ink-faint">Nenhum alimento encontrado.</p>
              )}
              {results.map((food) => (
                <button
                  key={`${food.source}-${food.id}`}
                  type="button"
                  onClick={() => pick(food)}
                  className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border-2 border-line bg-raised p-3 text-left hover:border-ink-faint"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{food.name}</span>
                    <span className="block text-xs text-ink-faint">
                      {food.brand ? `${food.brand} · ` : ''}por 100 g · P {formatNumber(food.nutrientsPer100g.protein)} · C{' '}
                      {formatNumber(food.nutrientsPer100g.carbs)} · G {formatNumber(food.nutrientsPer100g.fat)}
                    </span>
                  </span>
                  <span className="shrink-0 font-num text-base tabular-nums text-kcal">
                    {formatNumber(food.nutrientsPer100g.calories)}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
