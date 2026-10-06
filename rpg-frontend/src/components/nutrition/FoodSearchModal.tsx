import React, { useState } from 'react';
import { Search, Barcode, X, Plus, Sparkles } from 'lucide-react';
import type { FoodItem } from './MealSection';

interface FoodSearchModalProps {
  mealTitle: string;
  onSelectFood: (food: FoodItem) => void;
  onClose: () => void;
}

const mockCommonFoods: FoodItem[] = [
  { id: 'f1', name: 'Peito de Frango Grelhado', serving: '150g', calories: 240, protein: 46, carbs: 0, fat: 5 },
  { id: 'f2', name: 'Arroz Branco Cozido', serving: '150g', calories: 195, protein: 4, carbs: 42, fat: 0.5 },
  { id: 'f3', name: 'Ovo Inteiro Cozido (2 un)', serving: '100g', calories: 155, protein: 13, carbs: 1, fat: 11 },
  { id: 'f4', name: 'Whey Protein Isolado', serving: '30g', calories: 120, protein: 25, carbs: 2, fat: 1 },
  { id: 'f5', name: 'Banana Prata', serving: '100g', calories: 89, protein: 1, carbs: 23, fat: 0.3 },
  { id: 'f6', name: 'Azeite de Oliva Extra Virgem', serving: '10ml', calories: 88, protein: 0, carbs: 0, fat: 10 },
];

export function FoodSearchModal({ mealTitle, onSelectFood, onClose }: FoodSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const filteredFoods = mockCommonFoods.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      {/* Container Bottom Sheet no Mobile */}
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-white/[0.1] bg-[#0c0e12] p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Barra de Arraste Mobile */}
        <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-700 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              Registrar Alimento
            </span>
            <h3 className="text-base font-bold text-zinc-100">Adicionar a {mealTitle}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input de Busca com Botão de Código de Barras */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar alimento (ex: Frango, Arroz)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsScanning(!isScanning)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all active:scale-95 ${
              isScanning
                ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
                : 'border-white/[0.1] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08]'
            }`}
            title="Escanear Código de Barras (EAN)"
          >
            <Barcode className="h-5 w-5" />
          </button>
        </div>

        {/* Notificação se Scanner simulado estiver ativo */}
        {isScanning && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs font-mono text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Scanner de Câmera Ativo (Aponte para o código)
            </span>
            <button
              type="button"
              onClick={() => setIsScanning(false)}
              className="text-[10px] text-zinc-400 underline"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Lista de Resultados */}
        <div className="overflow-y-auto space-y-2 flex-1 pr-1">
          {filteredFoods.length === 0 ? (
            <p className="py-6 text-center font-mono text-xs text-zinc-500">
              Nenhum alimento encontrado para "{searchTerm}".
            </p>
          ) : (
            filteredFoods.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => onSelectFood(food)}
                className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all group"
              >
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-300 transition-colors">
                    {food.name}
                  </h4>
                  <p className="font-mono text-[11px] text-zinc-500">
                    {food.serving} • P: {food.protein}g | C: {food.carbs}g | G: {food.fat}g
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-zinc-100 tabular-nums">
                    {food.calories} kcal
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 group-hover:border-emerald-400/40 group-hover:text-emerald-300">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
