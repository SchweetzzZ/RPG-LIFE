import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { UtensilsCrossed, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { EnergyHeader } from '../components/nutrition/EnergyHeader';
import { MacroRings } from '../components/nutrition/MacroRings';
import { MealSection, type MealCategory, type FoodItem } from '../components/nutrition/MealSection';
import { FoodSearchModal } from '../components/nutrition/FoodSearchModal';

export const Route = createFileRoute('/nutrition')({
  component: NutritionRouteComponent,
});

const initialMeals: MealCategory[] = [
  {
    id: 'breakfast',
    title: 'Café da Manhã',
    items: [
      { id: 'b1', name: 'Ovos Mexidos (3 un)', serving: '150g', calories: 210, protein: 18, carbs: 2, fat: 15 },
      { id: 'b2', name: 'Pão Integral com Queijo Branco', serving: '80g', calories: 180, protein: 10, carbs: 22, fat: 4 },
      { id: 'b3', name: 'Café Preto sem Açúcar', serving: '200ml', calories: 5, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    id: 'lunch',
    title: 'Almoço',
    items: [
      { id: 'l1', name: 'Peito de Frango Grelhado', serving: '180g', calories: 290, protein: 55, carbs: 0, fat: 6 },
      { id: 'l2', name: 'Arroz Branco Cozido', serving: '150g', calories: 195, protein: 4, carbs: 42, fat: 0.5 },
      { id: 'l3', name: 'Feijão Carioca', serving: '100g', calories: 90, protein: 5, carbs: 14, fat: 0.5 },
      { id: 'l4', name: 'Salada Verde com Azeite', serving: '100g', calories: 80, protein: 1, carbs: 3, fat: 7 },
    ],
  },
  {
    id: 'afternoon_snack',
    title: 'Lanche da Tarde',
    items: [
      { id: 's1', name: 'Iogurte Natural Desnatado', serving: '170g', calories: 95, protein: 10, carbs: 12, fat: 0 },
      { id: 's2', name: 'Whey Protein com Aveia', serving: '40g', calories: 160, protein: 26, carbs: 12, fat: 2 },
    ],
  },
  {
    id: 'dinner',
    title: 'Jantar',
    items: [
      { id: 'd1', name: 'Carne Moída Patinho', serving: '150g', calories: 230, protein: 35, carbs: 0, fat: 9 },
      { id: 'd2', name: 'Batata Inglesa Cozida', serving: '150g', calories: 120, protein: 2, carbs: 28, fat: 0.2 },
    ],
  },
];

function NutritionRouteComponent() {
  const [meals, setMeals] = useState<MealCategory[]>(initialMeals);
  const [activeModalMealId, setActiveModalMealId] = useState<string | null>(null);

  // Calcula totais em tempo real
  const allItems = meals.flatMap((m) => m.items);
  const totalCalories = allItems.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProtein = allItems.reduce((acc, curr) => acc + curr.protein, 0);
  const totalCarbs = allItems.reduce((acc, curr) => acc + curr.carbs, 0);
  const totalFat = allItems.reduce((acc, curr) => acc + curr.fat, 0);

  const handleOpenAdd = (mealId: string) => {
    setActiveModalMealId(mealId);
  };

  const handleSelectFood = (food: FoodItem) => {
    if (!activeModalMealId) return;

    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.id !== activeModalMealId) return meal;
        const newItem: FoodItem = {
          ...food,
          id: `item_${Date.now()}`,
        };
        return {
          ...meal,
          items: [...meal.items, newItem],
        };
      })
    );
    setActiveModalMealId(null);
  };

  const handleDeleteItem = (mealId: string, itemId: string) => {
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.id !== mealId) return meal;
        return {
          ...meal,
          items: meal.items.filter((i) => i.id !== itemId),
        };
      })
    );
  };

  const activeMealTitle = meals.find((m) => m.id === activeModalMealId)?.title || '';

  return (
    <main className="min-h-screen bg-[#08090a] text-zinc-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-5">
        {/* Header Tático com Seletor de Data */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-400">
              <UtensilsCrossed className="h-4 w-4 stroke-[2]" />
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-100">
              Diário Nutricional
            </h1>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-2 py-1">
            <button type="button" className="p-1 text-zinc-400 hover:text-zinc-200">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex items-center gap-1 font-mono text-xs font-semibold text-zinc-300 px-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              Hoje
            </span>
            <button type="button" className="p-1 text-zinc-400 hover:text-zinc-200">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* 1. Balanço Calórico da Meta */}
        <EnergyHeader
          targetCalories={2100}
          consumedCalories={totalCalories}
          burnedCalories={380}
        />

        {/* 2. Anéis de Macronutrientes */}
        <MacroRings
          protein={{ consumed: totalProtein, target: 180 }}
          carbs={{ consumed: totalCarbs, target: 220 }}
          fat={{ consumed: totalFat, target: 60 }}
        />

        {/* 3. Seções de Refeições */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Refeições do Dia
            </h2>
            <span className="font-mono text-[11px] text-zinc-500">
              {meals.length} blocos
            </span>
          </div>

          <div className="space-y-3">
            {meals.map((meal) => (
              <MealSection
                key={meal.id}
                meal={meal}
                onAddItem={handleOpenAdd}
                onDeleteItem={handleDeleteItem}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Modal / Bottom Sheet de Busca de Alimentos */}
      {activeModalMealId && (
        <FoodSearchModal
          mealTitle={activeMealTitle}
          onSelectFood={handleSelectFood}
          onClose={() => setActiveModalMealId(null)}
        />
      )}
    </main>
  );
}
