import React from 'react';

export interface MacroTarget {
  name: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
  bgColor: string;
}

interface MacroRingsProps {
  protein?: { consumed: number; target: number };
  carbs?: { consumed: number; target: number };
  fat?: { consumed: number; target: number };
}

export function MacroRings({
  protein = { consumed: 145, target: 180 },
  carbs = { consumed: 180, target: 220 },
  fat = { consumed: 48, target: 60 },
}: MacroRingsProps) {
  const macros: MacroTarget[] = [
    {
      name: 'Proteína',
      consumed: protein.consumed,
      target: protein.target,
      unit: 'g',
      color: 'bg-cyan-400',
      bgColor: 'text-cyan-400',
    },
    {
      name: 'Carboidratos',
      consumed: carbs.consumed,
      target: carbs.target,
      unit: 'g',
      color: 'bg-emerald-400',
      bgColor: 'text-emerald-400',
    },
    {
      name: 'Gorduras',
      consumed: fat.consumed,
      target: fat.target,
      unit: 'g',
      color: 'bg-amber-400',
      bgColor: 'text-amber-400',
    },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Macronutrientes
        </h3>
        <span className="font-mono text-[10px] text-zinc-500">
          Gramas Consumidas / Meta
        </span>
      </div>

      <div className="space-y-3">
        {macros.map((macro) => {
          const percent = Math.min(100, Math.round((macro.consumed / macro.target) * 100));
          return (
            <div key={macro.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={`font-semibold ${macro.bgColor}`}>{macro.name}</span>
                <span className="text-zinc-400">
                  <span className="font-bold text-zinc-100">{macro.consumed}</span> / {macro.target} {macro.unit} ({percent}%)
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full ${macro.color} rounded-full transition-all duration-300`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
