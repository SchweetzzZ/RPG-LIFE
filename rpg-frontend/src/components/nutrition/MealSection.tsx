import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Utensils } from 'lucide-react';

export interface FoodItem {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealCategory {
  id: string;
  title: string;
  timeSlot?: string;
  items: FoodItem[];
}

interface MealSectionProps {
  meal: MealCategory;
  onAddItem: (mealId: string) => void;
  onDeleteItem: (mealId: string, itemId: string) => void;
}

export function MealSection({ meal, onAddItem, onDeleteItem }: MealSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const totalCalories = meal.items.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProtein = meal.items.reduce((acc, curr) => acc + curr.protein, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0e12] shadow-xl">
      {/* Cabeçalho da Refeição */}
      <div className="flex items-center justify-between p-4 bg-white/[0.02] border-b border-white/[0.06]">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300">
            <Utensils className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">{meal.title}</h3>
            <p className="font-mono text-[11px] text-zinc-500">
              <span className="text-zinc-300 font-semibold">{totalCalories} kcal</span> • {totalProtein}g prot
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddItem(meal.id)}
            className="inline-flex items-center gap-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 font-mono text-xs font-semibold text-zinc-200 hover:bg-white/[0.1] active:scale-95 transition-all min-h-[36px]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Adicionar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-zinc-500 hover:text-zinc-300"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Lista de Alimentos Adicionados */}
      {isOpen && (
        <div className="p-3 space-y-2">
          {meal.items.length === 0 ? (
            <p className="py-3 text-center font-mono text-xs text-zinc-600">
              Nenhum alimento registrado ainda.
            </p>
          ) : (
            meal.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] p-2.5 hover:border-white/[0.08] transition-all"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-200">
                    {item.name}
                  </h4>
                  <p className="font-mono text-[10px] text-zinc-500">
                    {item.serving} • P: {item.protein}g | C: {item.carbs}g | G: {item.fat}g
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-zinc-300 tabular-nums">
                    {item.calories} kcal
                  </span>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(meal.id, item.id)}
                    className="p-1 text-zinc-600 hover:text-rose-400 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
