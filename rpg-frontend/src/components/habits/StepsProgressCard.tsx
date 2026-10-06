import React, { useState } from 'react';
import { Footprints, Flame, Coins, Plus } from 'lucide-react';

interface StepsProgressCardProps {
  initialSteps?: number;
  targetSteps?: number;
}

export function StepsProgressCard({
  initialSteps = 8450,
  targetSteps = 10000,
}: StepsProgressCardProps) {
  const [steps, setSteps] = useState(initialSteps);

  const percent = Math.min(100, Math.round((steps / targetSteps) * 100));
  // Estimativa: ~0.04 kcal por passo, 1 moeda a cada 1000 passos
  const caloriesBurned = Math.round(steps * 0.04);
  const coinsEarned = Math.floor(steps / 1000);

  const addSteps = (amount: number) => {
    setSteps((prev) => prev + amount);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-500/10 text-amber-400">
            <Footprints className="h-4 w-4 stroke-[2]" />
          </div>
          <h3 className="text-sm font-bold text-zinc-100">Passos & Movimento</h3>
        </div>

        <button
          type="button"
          onClick={() => addSteps(500)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-zinc-300 hover:bg-white/[0.08]"
        >
          <Plus className="h-3 w-3" />
          <span>+500 passos</span>
        </button>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-mono text-2xl sm:text-3xl font-black text-zinc-100 tabular-nums">
            {steps.toLocaleString()}
          </span>
          <span className="font-mono text-xs text-zinc-500 ml-1.5">
            / {targetSteps.toLocaleString()} passos
          </span>
        </div>

        <span className="font-mono text-xs font-bold text-amber-400">
          {percent}%
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Recompensas de Calorias e Moedas */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 font-mono text-xs">
        <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
          <Flame className="h-3.5 w-3.5" />
          +{caloriesBurned} kcal gastas
        </span>

        <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
          <Coins className="h-3.5 w-3.5" />
          +{coinsEarned} moedas geradas
        </span>
      </div>
    </div>
  );
}
