import React from 'react';
import { UserProfile, Quest } from '../../types';
import { AvatarPreview } from '../Shop/AvatarPreview';
import { AttributeCard } from './AttributeCard';
import { AttributeRadarChart } from './RadarChart';
import {
  Flame,
  Zap,
  Shield,
  Droplet,
  Dumbbell,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ScrollText,
  AlertOctagon,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface HunterDashboardProps {
  profile: UserProfile;
  quests: Quest[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onNavigateTab: (tab: 'workout' | 'quests' | 'shop') => void;
}

export const HunterDashboard: React.FC<HunterDashboardProps> = ({
  profile,
  quests,
  onUpdateProfile,
  onNavigateTab,
}) => {
  const pendingQuestsCount = quests.filter((q) => !q.completed).length;
  const completedTodayCount = quests.filter((q) => q.completed).length;

  const handleDrinkWater = (amountMl: number) => {
    const newAmount = Math.min(profile.dailyWaterGoalMl, profile.waterIntakeMl + amountMl);
    soundFx.playCoin();

    onUpdateProfile({
      waterIntakeMl: newAmount,
      currentXp: profile.currentXp + 15,
      attributes: {
        ...profile.attributes,
        vitality: profile.attributes.vitality + 1,
      },
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Solo Leveling System Alert Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950 border border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-xl shadow-cyan-950/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/60 text-cyan-400 animate-pulse mt-0.5">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-cyan-500 text-slate-950 px-2 py-0.5 rounded">
                  DIRETIVA DO SISTEMA
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">STATUS: ATIVO</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-100 mt-1">
                Aviso de Oportunidade do Caçador
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-xl">
                Suas tarefas diárias concedem moedas e pontos de evolução. Você tem{' '}
                <span className="text-amber-400 font-bold">{pendingQuestsCount} missões pendentes</span>{' '}
                para hoje!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onNavigateTab('quests')}
              className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <ScrollText className="w-4 h-4" />
              Ver Missões
            </button>
            <button
              onClick={() => onNavigateTab('workout')}
              className="w-full md:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              Treinar
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Character Status Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card & Avatar */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-mono text-amber-300 font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {profile.streakDays} Dias de Ofensiva
          </div>

          {/* Avatar Preview */}
          <div className="my-3">
            <AvatarPreview
              skinId={profile.equippedSkinId}
              borderId={profile.equippedBorderId}
              title={profile.equippedTitle}
              rank={profile.rank}
              level={profile.level}
              size="lg"
            />
          </div>

          {/* Nickname & Titles */}
          <div className="text-center w-full space-y-1">
            <h2 className="text-lg font-black text-slate-100 tracking-wide flex items-center justify-center gap-2">
              {profile.nickname}
            </h2>
            <p className="text-xs text-cyan-400 font-bold font-mono">
              [ {profile.title} ]
            </p>
          </div>

          {/* Quick Stats Summary */}
          <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">
                Concluídas Hoje
              </span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {completedTodayCount}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">
                Meta de Hidratação
              </span>
              <span className="text-base font-bold font-mono text-blue-400">
                {Math.round((profile.waterIntakeMl / profile.dailyWaterGoalMl) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Attribute Radar & Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-200 text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Status de Atributos do Caçador
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total: {profile.attributes.strength + profile.attributes.intelligence + profile.attributes.vitality + profile.attributes.focus} Pts
            </span>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AttributeCard
              type="strength"
              value={profile.attributes.strength}
              label="Força (Strength)"
              description="Aumentado por musculação e treinos."
              colorTheme="red"
            />
            <AttributeCard
              type="intelligence"
              value={profile.attributes.intelligence}
              label="Inteligência (Intelligence)"
              description="Aumentado por leitura, estudos e foco."
              colorTheme="blue"
            />
            <AttributeCard
              type="vitality"
              value={profile.attributes.vitality}
              label="Vitalidade (Vitality)"
              description="Aumentado por consumo de água e sono."
              colorTheme="green"
            />
            <AttributeCard
              type="focus"
              value={profile.attributes.focus}
              label="Foco (Focus)"
              description="Aumentado por trabalho e disciplina."
              colorTheme="purple"
            />
          </div>
        </div>
      </div>

      {/* 3. Lower Row: Attribute Radar + Hydration Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <AttributeRadarChart attributes={profile.attributes} />

        {/* Interactive Vitality / Water Tracker */}
        <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-900/60 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-950 rounded-xl border border-blue-800 text-blue-400">
                  <Droplet className="w-5 h-5 fill-blue-500/20" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Sintonizador de Vitalidade (Água)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Meta Diária: {profile.dailyWaterGoalMl}ml
                  </p>
                </div>
              </div>
              <span className="font-mono text-xl font-extrabold text-blue-400">
                {profile.waterIntakeMl} ml
              </span>
            </div>

            {/* Hydration Bar */}
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-blue-950 my-2 relative">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((profile.waterIntakeMl / profile.dailyWaterGoalMl) * 100)
                  )}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-right">
              {Math.max(0, profile.dailyWaterGoalMl - profile.waterIntakeMl)}ml restantes para atingir bônus máximo.
            </p>
          </div>

          {/* Quick Intake Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              onClick={() => handleDrinkWater(250)}
              className="flex-1 py-2 px-3 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-700/50 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Droplet className="w-3.5 h-3.5 text-blue-400" />
              +250ml (+10 XP)
            </button>
            <button
              onClick={() => handleDrinkWater(500)}
              className="flex-1 py-2 px-3 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-200 border border-cyan-700/50 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Droplet className="w-3.5 h-3.5 text-cyan-400" />
              +500ml (+20 XP)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
