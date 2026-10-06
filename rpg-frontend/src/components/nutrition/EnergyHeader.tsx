import React from 'react';
import { Flame, Minus, Plus, Equal } from 'lucide-react';

interface EnergyHeaderProps {
  targetCalories: number;
  consumedCalories: number;
  burnedCalories: number;
}

export function EnergyHeader({
  targetCalories = 2100,
  consumedCalories = 1450,
  burnedCalories = 380,
}: EnergyHeaderProps) {
  const remainingCalories = targetCalories - consumedCalories + burnedCalories;
  const isSurplus = remainingCalories < 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
            <Flame className="h-4 w-4 stroke-[2]" />
          </div>
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Balanço Energético Diário
          </h2>
        </div>
        <span className="font-mono text-[11px] text-zinc-500">
          Hoje
        </span>
      </div>

      {/* Fórmula Compacta de Balanço Calórico */}
      <div className="mt-4 grid grid-cols-7 items-center text-center">
        {/* Meta */}
        <div className="col-span-2 space-y-0.5">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Meta
          </span>
          <span className="font-mono text-lg sm:text-2xl font-bold text-zinc-200 tabular-nums">
            {targetCalories.toLocaleString()}
          </span>
        </div>

        {/* Sinal de Menos */}
        <div className="col-span-1 flex justify-center text-zinc-600">
          <Minus className="h-3.5 w-3.5" />
        </div>

        {/* Consumido */}
        <div className="col-span-1 space-y-0.5">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Comida
          </span>
          <span className="font-mono text-base sm:text-xl font-bold text-rose-400/90 tabular-nums">
            {consumedCalories.toLocaleString()}
          </span>
        </div>

        {/* Sinal de Mais */}
        <div className="col-span-1 flex justify-center text-zinc-600">
          <Plus className="h-3.5 w-3.5" />
        </div>

        {/* Exercício */}
        <div className="col-span-1 space-y-0.5">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Treino
          </span>
          <span className="font-mono text-base sm:text-xl font-bold text-amber-400/90 tabular-nums">
            {burnedCalories.toLocaleString()}
          </span>
        </div>

        {/* Sinal de Igual / Restante */}
        <div className="col-span-1 space-y-0.5 pl-2 border-l border-white/[0.08]">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
            {isSurplus ? 'Excesso' : 'Resta'}
          </span>
          <span
            className={`font-mono text-lg sm:text-2xl font-black tabular-nums ${
              isSurplus ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {Math.abs(remainingCalories).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
