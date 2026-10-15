import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { EnergyHeader } from '../components/nutrition/EnergyHeader';
import { MacroRings } from '../components/nutrition/MacroRings';
import { MealSection, type MealBlock } from '../components/nutrition/MealSection';
import { FoodSearchModal } from '../components/nutrition/FoodSearchModal';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlocks';
import { useNutritionData } from '../hooks/useNutritionData';
import { nutritionService } from '../services/nutrition.service';
import { errorMessage } from '../services/http';
import type { FoodResult } from '../types/free-meal';
import type { FoodLog, MealType } from '../types/nutrition';

export const Route = createFileRoute('/nutrition')({
  component: NutritionRouteComponent,
});

const MEALS: MealBlock[] = [
  { type: 'breakfast', title: 'Café da manhã' },
  { type: 'lunch', title: 'Almoço' },
  { type: 'snack', title: 'Lanche' },
  { type: 'dinner', title: 'Jantar' },
];

const round1 = (value: number) => Math.round(value * 10) / 10;

function NutritionRouteComponent() {
  const { data, loading, error, reload } = useNutritionData();
  const [modalMeal, setModalMeal] = useState<MealType | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleConfirm(food: FoodResult, grams: number) {
    if (!modalMeal || !data) return;
    const factor = grams / 100;
    setSaving(true);
    setActionError(null);
    try {
      await nutritionService.log({
        foodName: food.name,
        mealType: modalMeal,
        amountGrams: grams,
        calories: Math.round(food.nutrientsPer100g.calories * factor),
        proteinGrams: round1(food.nutrientsPer100g.protein * factor),
        carbGrams: round1(food.nutrientsPer100g.carbs * factor),
        fatGrams: round1(food.nutrientsPer100g.fat * factor),
        date: data.summary.date,
      });
      setModalMeal(null);
      await reload();
    } catch (err) {
      setActionError(errorMessage(err instanceof Error ? err : null, 'Não foi possível registrar o alimento'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(log: FoodLog) {
    setBusyId(log.id);
    setActionError(null);
    try {
      await nutritionService.remove(log.id);
      await reload();
    } catch (err) {
      setActionError(errorMessage(err instanceof Error ? err : null, 'Não foi possível remover o alimento'));
    } finally {
      setBusyId(null);
    }
  }

  const modalTitle = MEALS.find((m) => m.type === modalMeal)?.title ?? '';

  return (
    <main className="min-h-screen bg-bg px-3 pb-28 pt-3 text-ink sm:p-4 sm:pb-28">
      <div className="mx-auto w-full max-w-md space-y-3">
        <h1 className="px-1 font-pixel text-2xl text-ink">Diário</h1>

        {loading && !data && <LoadingBlock label="Carregando seu diário..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}
        {actionError && (
          <p role="alert" className="rounded-lg border-2 border-danger/60 bg-surface p-3 text-sm text-danger">
            {actionError}
          </p>
        )}

        {data && (
          <>
            <EnergyHeader consumedKcal={data.summary.totals.calories} day={data.day} />
            <MacroRings
              macros={[
                { name: 'Proteína', consumed: data.summary.totals.proteinGrams, target: data.day?.macros.proteinGrams ?? null, tone: 'kcal' },
                { name: 'Carboidratos', consumed: data.summary.totals.carbGrams, target: data.day?.macros.carbGrams ?? null, tone: 'coin' },
                { name: 'Gorduras', consumed: data.summary.totals.fatGrams, target: data.day?.macros.fatGrams ?? null, tone: 'xp' },
              ]}
            />
            {MEALS.map((meal) => (
              <MealSection
                key={meal.type}
                meal={meal}
                logs={data.summary.logs.filter((log) => log.mealType === meal.type)}
                busyId={busyId}
                onAdd={setModalMeal}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>

      {modalMeal && (
        <FoodSearchModal mealTitle={modalTitle} saving={saving} onConfirm={handleConfirm} onClose={() => setModalMeal(null)} />
      )}
    </main>
  );
}
