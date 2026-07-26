import React from 'react';
import { Dumbbell, Brain, Heart, Target, ChevronUp } from 'lucide-react';
import { AttributeType } from '../../types';

interface AttributeCardProps {
  type: AttributeType;
  value: number;
  label: string;
  description: string;
  colorTheme: 'red' | 'blue' | 'green' | 'purple';
}

export const AttributeCard: React.FC<AttributeCardProps> = ({
  type,
  value,
  label,
  description,
  colorTheme,
}) => {
  const themeStyles = {
    red: {
      bg: 'from-rose-950/40 to-slate-900/90',
      border: 'border-rose-900/50 hover:border-rose-500/70',
      text: 'text-rose-400',
      iconBg: 'bg-rose-950 text-rose-400 border-rose-800/60',
      bar: 'bg-gradient-to-r from-rose-600 to-red-500',
      icon: Dumbbell,
    },
    blue: {
      bg: 'from-cyan-950/40 to-slate-900/90',
      border: 'border-cyan-900/50 hover:border-cyan-500/70',
      text: 'text-cyan-400',
      iconBg: 'bg-cyan-950 text-cyan-400 border-cyan-800/60',
      bar: 'bg-gradient-to-r from-cyan-600 to-blue-500',
      icon: Brain,
    },
    green: {
      bg: 'from-emerald-950/40 to-slate-900/90',
      border: 'border-emerald-900/50 hover:border-emerald-500/70',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-950 text-emerald-400 border-emerald-800/60',
      bar: 'bg-gradient-to-r from-emerald-600 to-teal-500',
      icon: Heart,
    },
    purple: {
      bg: 'from-purple-950/40 to-slate-900/90',
      border: 'border-purple-900/50 hover:border-purple-500/70',
      text: 'text-purple-400',
      iconBg: 'bg-purple-950 text-purple-400 border-purple-800/60',
      bar: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      icon: Target,
    },
  }[colorTheme];

  const Icon = themeStyles.icon;
  // Maximum attribute cap for percentage calculation in bar
  const progressPercent = Math.min(100, Math.round((value / 60) * 100));

  return (
    <div
      className={`bg-gradient-to-br ${themeStyles.bg} border ${themeStyles.border} rounded-2xl p-4 transition-all duration-300 shadow-lg relative overflow-hidden group`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${themeStyles.iconBg} shadow-inner`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm tracking-wide ${themeStyles.text}`}>{label}</h3>
            <p className="text-[11px] text-slate-400">{description}</p>
          </div>
        </div>

        {/* Attribute Score Badge */}
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl font-black text-slate-100">{value}</span>
          <span className="text-[10px] font-bold text-slate-400">PTS</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden border border-slate-800/80 mt-3 relative">
        <div
          className={`h-full ${themeStyles.bar} transition-all duration-500 rounded-full`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
