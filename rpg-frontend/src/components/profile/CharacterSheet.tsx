import React from 'react';
import { ShieldCheck, Heart, Zap, Sparkles, Swords, Eye, Award } from 'lucide-react';

interface CharacterSheetProps {
  nickname?: string;
  classNameTitle?: string;
  level?: number;
  currentXp?: number;
  nextLevelXp?: number;
  hp?: number;
  maxHp?: number;
  stats?: {
    strength: number;
    vitality: number;
    focus: number;
    discipline: number;
  };
}

export function CharacterSheet({
  nickname = 'Guerreiro da Silva',
  classNameTitle = 'Caçador de Elite',
  level = 7,
  currentXp = 450,
  nextLevelXp = 800,
  hp = 92,
  maxHp = 100,
  stats = {
    strength: 18,
    vitality: 15,
    focus: 14,
    discipline: 16,
  },
}: CharacterSheetProps) {
  const xpPercent = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));
  const hpPercent = Math.min(100, Math.round((hp / maxHp) * 100));

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 shadow-xl space-y-4">
      {/* Cabeçalho do Avatar */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-gradient-to-b from-zinc-800 to-zinc-900 font-mono text-xl font-black text-zinc-100 shadow-inner">
          {nickname.charAt(0).toUpperCase()}
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0c0e12]">
            <ShieldCheck className="h-2.5 w-2.5 text-black stroke-[2.5]" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
              {nickname}
            </h2>
            <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
              NVL {level}
            </span>
          </div>
          <span className="font-mono text-xs text-zinc-400">
            {classNameTitle}
          </span>
        </div>
      </div>

      {/* Barras de HP e XP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
        {/* HP */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1 font-bold text-rose-400">
              <Heart className="h-3.5 w-3.5 fill-rose-500/20 stroke-rose-400" />
              HP Vital
            </span>
            <span className="text-zinc-400">
              {hp} / {maxHp}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* XP */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1 font-bold text-amber-300">
              <Zap className="h-3.5 w-3.5 fill-amber-400/20 stroke-amber-400" />
              Experiência (XP)
            </span>
            <span className="text-zinc-400">
              {currentXp} / {nextLevelXp} ({xpPercent}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid de Atributos RPG */}
      <div className="border-t border-white/[0.06] pt-3 space-y-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Atributos de Combate do Caçador
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Força */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-1">
            <span className="flex items-center gap-1 font-mono text-[10px] text-rose-400">
              <Swords className="h-3 w-3" />
              Força
            </span>
            <span className="font-mono text-xl font-bold text-zinc-100 tabular-nums">
              {stats.strength}
            </span>
            <span className="block text-[9px] font-mono text-zinc-500">Via Musculação</span>
          </div>

          {/* Vitalidade */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-1">
            <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
              <Heart className="h-3 w-3" />
              Vitalidade
            </span>
            <span className="font-mono text-xl font-bold text-zinc-100 tabular-nums">
              {stats.vitality}
            </span>
            <span className="block text-[9px] font-mono text-zinc-500">Água & Sono</span>
          </div>

          {/* Foco */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-1">
            <span className="flex items-center gap-1 font-mono text-[10px] text-cyan-400">
              <Eye className="h-3 w-3" />
              Foco
            </span>
            <span className="font-mono text-xl font-bold text-zinc-100 tabular-nums">
              {stats.focus}
            </span>
            <span className="block text-[9px] font-mono text-zinc-500">Estudos & Hábitos</span>
          </div>

          {/* Disciplina */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-1">
            <span className="flex items-center gap-1 font-mono text-[10px] text-amber-400">
              <Award className="h-3 w-3" />
              Disciplina
            </span>
            <span className="font-mono text-xl font-bold text-zinc-100 tabular-nums">
              {stats.discipline}
            </span>
            <span className="block text-[9px] font-mono text-zinc-500">Streaks Semanais</span>
          </div>
        </div>
      </div>
    </div>
  );
}
