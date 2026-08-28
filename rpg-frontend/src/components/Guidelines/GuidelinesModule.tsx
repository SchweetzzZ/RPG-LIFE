import React, { useState } from 'react';
import { UserProfile, BiometricProfile, Quest, AttributeType } from '../../types';
import { client } from '../../services/api';
import { BiometricModal } from './BiometricModal';
import {
  User,
  Activity,
  Flame,
  Droplet,
  Moon,
  Brain,
  Shield,
  Sparkles,
  CheckCircle2,
  Zap,
  RefreshCw,
  Scale,
  Ruler,
  TrendingUp,
  HeartPulse,
  Award,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface GuidelinesModuleProps {
  profile: UserProfile;
  quests: Quest[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onCreateQuest: (quest: Quest) => void;
}

export const GuidelinesModule: React.FC<GuidelinesModuleProps> = ({
  profile,
  quests,
  onUpdateProfile,
  onCreateQuest,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Default biometrics fallback if not set
  const biometrics: BiometricProfile = profile.biometrics || {
    weightKg: 75,
    heightCm: 178,
    age: 28,
    gender: 'male',
    activityLevel: 'moderate',
    primaryGoal: 'gain_muscle',
    stressLevel: 5,
    trainsRegularly: false,
    livesInHotClimate: false,
  };

  // Mifflin-St Jeor BMR Calculation
  const calculateBmr = (bio: BiometricProfile): number => {
    const { weightKg, heightCm, age, gender } = bio;
    if (gender === 'male') {
      return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
    } else {
      return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
    }
  };

  // Activity Multipliers
  const activityMultipliers: Record<BiometricProfile['activityLevel'], number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    intense: 1.725,
    very_intense: 1.9,
  };

  // Goal Adjustment
  const goalAdjustments: Record<BiometricProfile['primaryGoal'], number> = {
    lose_weight: -500,
    maintain: 0,
    gain_muscle: 300,
    extreme_definition: -400,
  };

  const bmr = calculateBmr(biometrics);
  const tdee = Math.round(bmr * (activityMultipliers[biometrics.activityLevel] || 1.55));
  const targetCalories = Math.round(tdee + (goalAdjustments[biometrics.primaryGoal] || 0));

  // Calculated Targets for Recommendations
  const calculatedWaterMl = Math.round((biometrics.weightKg * 35) / 100) * 100;
  const calculatedProteinGrams = Math.round(biometrics.weightKg * 2.0);

  // Activity Label Translation
  const activityLabels: Record<BiometricProfile['activityLevel'], string> = {
    sedentary: 'Sedentário (Pouco ou nenhum exercício)',
    light: 'Levemente Ativo (1-3d/sem)',
    moderate: 'Moderadamente Ativo (3-5d/sem)',
    intense: 'Muito Ativo (6-7d/sem)',
    very_intense: 'Atleta de Elite (Treinos Duplos)',
  };

  // Goal Label Translation
  const goalLabels: Record<BiometricProfile['primaryGoal'], string> = {
    lose_weight: 'Perder Peso / Queima de Gordura',
    maintain: 'Manter Peso e Recomposição',
    gain_muscle: 'Ganhar Massa Muscular (Hipertrofia)',
    extreme_definition: 'Definição Extrema',
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveBiometrics = async (updatedBio: BiometricProfile) => {
    onUpdateProfile({ biometrics: updatedBio });
    setIsModalOpen(false);
    showToast('⚡ SISTEMA: Atributos corporais e metabólicos reanalisados com sucesso!');

    try {
      const { error } = await client.PATCH('/profile', {
        body: {
          weightKg: updatedBio.weightKg,
          heightCm: updatedBio.heightCm,
          age: updatedBio.age,
          biologicalSex: updatedBio.gender === 'male' || updatedBio.gender === 'female' ? updatedBio.gender : 'other',
          activityLevel: updatedBio.activityLevel,
          primaryGoal: updatedBio.primaryGoal === 'extreme_definition' ? 'lose_weight' : updatedBio.primaryGoal,
          stressLevel: updatedBio.stressLevel,
          trainsRegularly: updatedBio.trainsRegularly,
          livesInHotClimate: updatedBio.livesInHotClimate,
        },
      });
    } catch (err: any) {
      console.warn('Backend profile update warning:', err.message);
    }
  };

  // 4 Recommendations definitions
  const recommendations = [
    {
      id: 'rec_hydration',
      questTitle: `Consumo Diário de Água (${calculatedWaterMl} ml)`,
      title: 'Meta de Hidratação',
      icon: Droplet,
      iconColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      glowColor: 'shadow-cyan-950/40',
      accentBg: 'bg-cyan-950/60',
      targetText: `${calculatedWaterMl} ml / dia`,
      reasoning: `Baseado no seu peso de ${biometrics.weightKg}kg + treinos regulares de Caçador.`,
      rewardXp: 40,
      rewardCoin: 20,
      attribute: 'vitality' as AttributeType,
      attributeLabel: 'Vitalidade',
      attributeBadgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
    },
    {
      id: 'rec_sleep',
      questTitle: 'Otimização de Sono (7h30 por noite)',
      title: 'Otimização de Sono',
      icon: Moon,
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      glowColor: 'shadow-emerald-950/40',
      accentBg: 'bg-emerald-950/60',
      targetText: '450 min (7h30 por noite)',
      reasoning: 'Adultos de 26 a 64 anos têm meta recomendada de 7h30 por noite para regeneração celular.',
      rewardXp: 35,
      rewardCoin: 15,
      attribute: 'vitality' as AttributeType,
      attributeLabel: 'Vitalidade',
      attributeBadgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
    },
    {
      id: 'rec_focus',
      questTitle: 'Sintonizador de Foco / Meditação (15 min)',
      title: 'Sintonizador de Foco / Meditação',
      icon: Brain,
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      glowColor: 'shadow-purple-950/40',
      accentBg: 'bg-purple-950/60',
      targetText: '15 min / dia',
      reasoning: `Com nível de estresse ${biometrics.stressLevel}/10, recomendamos 15 minutos diários de sintonização.`,
      rewardXp: 30,
      rewardCoin: 15,
      attribute: 'focus' as AttributeType,
      attributeLabel: 'Foco',
      attributeBadgeClass: 'bg-purple-950/80 text-purple-400 border-purple-500/40',
    },
    {
      id: 'rec_nutrition',
      questTitle: `Meta Proteica Diária (${calculatedProteinGrams}g)`,
      title: 'Meta Nutricional (Proteína)',
      icon: Flame,
      iconColor: 'text-rose-400',
      borderColor: 'border-rose-500/40',
      glowColor: 'shadow-rose-950/40',
      accentBg: 'bg-rose-950/60',
      targetText: `${calculatedProteinGrams}g Proteína (${targetCalories} kcal totais)`,
      reasoning: `Meta para ganho de massa muscular com base no seu TDEE de ${tdee} kcal.`,
      rewardXp: 50,
      rewardCoin: 25,
      attribute: 'strength' as AttributeType,
      attributeLabel: 'Força',
      attributeBadgeClass: 'bg-rose-950/80 text-rose-400 border-rose-500/40',
    },
  ];

  // Accept & Create Habit / Quest Handler
  const handleAcceptRecommendation = (rec: typeof recommendations[0]) => {
    // Check if quest with same title or id exists
    const existing = quests.find(
      (q) => q.title.toLowerCase().includes(rec.title.toLowerCase()) || q.id === rec.id
    );

    if (existing) {
      showToast('⚠️ SISTEMA: Esta diretriz já está registrada entre suas Missões Ativas!');
      return;
    }

    const newQuest: Quest = {
      id: `quest_${rec.id}_${Date.now()}`,
      title: rec.questTitle,
      description: `${rec.reasoning} (Diretriz Automática do Sistema)`,
      category: 'daily',
      attributeReward: rec.attribute,
      xpReward: rec.rewardXp,
      coinReward: rec.rewardCoin,
      difficulty: 'Média',
      completed: false,
      streak: 0,
      frequency: 'daily',
    };

    onCreateQuest(newQuest);
    soundFx.playQuestComplete();
    showToast(`✨ SISTEMA: Diretriz "${rec.title}" convertida em Hábito / Missão Ativa!`);
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border-2 border-cyan-400 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl shadow-cyan-500/30 font-bold text-xs flex items-center gap-3 animate-bounce">
          <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Module Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-2xl text-cyan-400 shadow-lg shadow-cyan-950">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/80">
                  DIRETRIZES & RECOMENDAÇÕES
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  SISTEMA DE ANÁLISE BIOMÉTRICA
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Análise do Caçador & Diretrizes do Sistema
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-cyan-600/30 transition flex items-center justify-center gap-2 border border-cyan-400/50"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar Atributos Corporais
          </button>
        </div>
      </div>

      {/* 1. HUNTER BIOMETRIC PROFILE CARD */}
      <div className="bg-slate-900/90 border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/20 relative overflow-hidden space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
              Perfil Biométrico Atual do Caçador
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2.5 py-0.5 rounded-full font-bold">
            NestJS UserProfile API
          </span>
        </div>

        {/* Biometric Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <Scale className="w-3 h-3 text-cyan-400" /> Peso Corporal
            </span>
            <p className="text-lg font-black font-mono text-slate-100">
              {biometrics.weightKg}{' '}
              <span className="text-xs text-slate-400 font-sans font-semibold">kg</span>
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <Ruler className="w-3 h-3 text-cyan-400" /> Altura
            </span>
            <p className="text-lg font-black font-mono text-slate-100">
              {biometrics.heightCm}{' '}
              <span className="text-xs text-slate-400 font-sans font-semibold">cm</span>
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Idade / Gênero</span>
            <p className="text-sm font-black text-slate-100 truncate">
              {biometrics.age} anos ({biometrics.gender === 'male' ? 'M' : 'F'})
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" /> Atividade
            </span>
            <p className="text-xs font-bold text-slate-200 truncate">
              {activityLabels[biometrics.activityLevel]}
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" /> Objetivo
            </span>
            <p className="text-xs font-bold text-rose-300 truncate">
              {goalLabels[biometrics.primaryGoal]}
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-400" /> Estresse
            </span>
            <p className="text-sm font-black font-mono text-purple-300">
              {biometrics.stressLevel} / 10
            </p>
          </div>
        </div>

        {/* Dynamic Metabolic Calculations Bar (Mifflin-St Jeor Formula) */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-slate-950 to-purple-950/60 border border-cyan-500/30 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                Cálculos Metabólicos Dinâmicos (Fórmula Mifflin-St Jeor)
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Recalculado em tempo real
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Taxa Metabólica Basal (BMR)
                </p>
                <p className="text-xl font-black font-mono text-cyan-300">{bmr} kcal</p>
              </div>
              <HeartPulse className="w-6 h-6 text-cyan-500/40" />
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Gasto Energético Total (TDEE)
                </p>
                <p className="text-xl font-black font-mono text-purple-300">{tdee} kcal</p>
              </div>
              <Activity className="w-6 h-6 text-purple-500/40" />
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Target Calórico Diário
                </p>
                <p className="text-xl font-black font-mono text-emerald-300">
                  {targetCalories} kcal
                </p>
              </div>
              <Flame className="w-6 h-6 text-emerald-500/40" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SYSTEM GUIDELINES SECTION */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-wider">
              DIRETRIZES DO SISTEMA DE EVOLUÇÃO
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Missões e Metas Sugeridas com base na sua Análise Biométrica (HabitService Backend)
          </p>
        </div>

        {/* 4 Visual Recommendation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => {
            const IconComponent = rec.icon;
            const isAlreadyActive = quests.some(
              (q) => q.title.toLowerCase().includes(rec.title.toLowerCase())
            );

            return (
              <div
                key={rec.id}
                className={`bg-slate-900/90 border-2 ${rec.borderColor} rounded-3xl p-5 shadow-2xl ${rec.glowColor} space-y-4 relative overflow-hidden group hover:border-cyan-400/80 transition duration-300`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${rec.accentBg} border ${rec.borderColor} rounded-2xl`}>
                      <IconComponent className={`w-6 h-6 ${rec.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-100 group-hover:text-cyan-300 transition">
                        {rec.title}
                      </h4>
                      <p className="text-xs font-mono font-bold text-slate-300 mt-0.5">
                        Alvo: <span className="text-cyan-400 font-extrabold">{rec.targetText}</span>
                      </p>
                    </div>
                  </div>

                  {/* Attribute Badge */}
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-sm ${rec.attributeBadgeClass}`}
                  >
                    +{rec.rewardXp} XP | {rec.attributeLabel}
                  </span>
                </div>

                {/* Reasoning Description */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-400">Justificativa do Sistema:</span>{' '}
                  {rec.reasoning}
                </p>

                {/* Action Button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recompensa: +{rec.rewardCoin} Moedas</span>
                  </div>

                  <button
                    onClick={() => handleAcceptRecommendation(rec)}
                    disabled={isAlreadyActive}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md ${isAlreadyActive
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 uppercase tracking-wider shadow-cyan-500/20'
                      }`}
                  >
                    {isAlreadyActive ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Missão Ativa no Sistema
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Aceitar e Criar Missão
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Biometric Edit Modal */}
      {isModalOpen && (
        <BiometricModal
          initialBiometrics={biometrics}
          onSave={handleSaveBiometrics}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
