import React, { useState } from 'react';
import { Droplet, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

interface WaterTrackerCardProps {
  initialMl?: number;
  targetMl?: number;
}

export function WaterTrackerCard({
  initialMl = 1750,
  targetMl = 2800,
}: WaterTrackerCardProps) {
  const [currentMl, setCurrentMl] = useState(initialMl);

  const addWater = (amount: number) => {
    setCurrentMl((prev) => Math.min(targetMl * 1.5, prev + amount));
  };

  const percent = Math.min(100, Math.round((currentMl / targetMl) * 100));
  const isGoalMet = currentMl >= targetMl;

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/15 via-[#0c0e12] to-[#0c0e12] p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-500/10 text-cyan-400">
            <Droplet className="h-4 w-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Hidratação do Caçador</h3>
            <span className="font-mono text-[10px] text-cyan-400">
              Meta Automática: 35ml/kg
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-300">
          <Sparkles className="h-3 w-3" />
          +Vitalidade
        </span>
      </div>

      {/* Indicador de Progresso em Volume */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-mono text-2xl sm:text-3xl font-black text-cyan-300 tabular-nums">
            {currentMl.toLocaleString()}
          </span>
          <span className="font-mono text-xs text-zinc-400 ml-1.5">
            / {targetMl.toLocaleString()} ml
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs font-bold text-cyan-400">
          {isGoalMet && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          <span>{percent}%</span>
        </div>
      </div>

      {/* Barra de Progresso Líquida */}
      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Botões de Ação Rápida no Alcance do Polegar */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => addWater(250)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/25 bg-cyan-400/10 py-2.5 font-mono text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 active:scale-95 transition-all min-h-[44px]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+250 ml (Copo)</span>
        </button>

        <button
          type="button"
          onClick={() => addWater(500)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/25 bg-cyan-400/10 py-2.5 font-mono text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 active:scale-95 transition-all min-h-[44px]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+500 ml (Garrafa)</span>
        </button>
      </div>
    </div>
  );
}
