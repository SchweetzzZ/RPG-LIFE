import React from 'react';
import { HunterAttributes } from '../../types';

interface RadarChartProps {
  attributes: HunterAttributes;
}

export const AttributeRadarChart: React.FC<RadarChartProps> = ({ attributes }) => {
  // Max scale cap for attributes
  const maxVal = 60;

  // Normalized values (0 to 1)
  const str = Math.min(1, attributes.strength / maxVal);
  const int = Math.min(1, attributes.intelligence / maxVal);
  const vit = Math.min(1, attributes.vitality / maxVal);
  const foc = Math.min(1, attributes.focus / maxVal);

  // SVG Diamond Coordinates
  // Center is (100, 100), radius is 70
  // Top: Strength (100, 100 - 70 * str)
  // Right: Focus (100 + 70 * foc, 100)
  // Bottom: Vitality (100, 100 + 70 * vit)
  // Left: Intelligence (100 - 70 * int, 100)

  const topY = 100 - 70 * str;
  const rightX = 100 + 70 * foc;
  const bottomY = 100 + 70 * vit;
  const leftX = 100 - 70 * int;

  const points = `100,${topY} ${rightX},100 100,${bottomY} ${leftX},100`;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative">
      <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        Balanço de Atributos do Caçador
      </h3>

      <div className="relative w-56 h-56 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
          {/* Grid concentric diamonds */}
          <polygon points="100,30 170,100 100,170 30,100" fill="none" stroke="#1E293B" strokeWidth="1.5" />
          <polygon points="100,53 147,100 100,147 53,100" fill="none" stroke="#1E293B" strokeWidth="1" />
          <polygon points="100,76 124,100 100,124 76,100" fill="none" stroke="#1E293B" strokeWidth="1" />

          {/* Cross Axes */}
          <line x1="100" y1="30" x2="100" y2="170" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="30" y1="100" x2="170" y2="100" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

          {/* Player Active Polygon */}
          <polygon
            points={points}
            fill="rgba(6, 182, 212, 0.35)"
            stroke="#06B6D4"
            strokeWidth="2.5"
            className="transition-all duration-700 ease-out"
          />

          {/* Active Points */}
          <circle cx="100" cy={topY} r="4" fill="#F43F5E" className="animate-pulse" />
          <circle cx={rightX} cy="100" r="4" fill="#C084FC" className="animate-pulse" />
          <circle cx="100" cy={bottomY} r="4" fill="#34D399" className="animate-pulse" />
          <circle cx={leftX} cy="100" r="4" fill="#38BDF8" className="animate-pulse" />
        </svg>

        {/* Outer Labels */}
        <div className="absolute top-0 text-[10px] font-black text-rose-400 bg-slate-950/90 px-2 py-0.5 rounded-full border border-rose-900/80">
          FORÇA ({attributes.strength})
        </div>
        <div className="absolute right-0 text-[10px] font-black text-purple-400 bg-slate-950/90 px-2 py-0.5 rounded-full border border-purple-900/80">
          FOCO ({attributes.focus})
        </div>
        <div className="absolute bottom-0 text-[10px] font-black text-emerald-400 bg-slate-950/90 px-2 py-0.5 rounded-full border border-emerald-900/80">
          VITALIDADE ({attributes.vitality})
        </div>
        <div className="absolute left-0 text-[10px] font-black text-cyan-400 bg-slate-950/90 px-2 py-0.5 rounded-full border border-cyan-900/80">
          INTELIGÊNCIA ({attributes.intelligence})
        </div>
      </div>
    </div>
  );
};
