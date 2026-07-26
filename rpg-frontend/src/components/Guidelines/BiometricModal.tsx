import React, { useState } from 'react';
import { BiometricProfile } from '../../types';
import { X, User, Activity, Flame, ShieldAlert, Save, HeartPulse, Scale, Ruler } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface BiometricModalProps {
  initialBiometrics: BiometricProfile;
  onSave: (biometrics: BiometricProfile) => void;
  onClose: () => void;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  initialBiometrics,
  onSave,
  onClose,
}) => {
  const [weightKg, setWeightKg] = useState<number>(initialBiometrics.weightKg);
  const [heightCm, setHeightCm] = useState<number>(initialBiometrics.heightCm);
  const [age, setAge] = useState<number>(initialBiometrics.age);
  const [gender, setGender] = useState<'male' | 'female'>(initialBiometrics.gender);
  const [activityLevel, setActivityLevel] = useState<BiometricProfile['activityLevel']>(
    initialBiometrics.activityLevel
  );
  const [primaryGoal, setPrimaryGoal] = useState<BiometricProfile['primaryGoal']>(
    initialBiometrics.primaryGoal
  );
  const [stressLevel, setStressLevel] = useState<number>(initialBiometrics.stressLevel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BiometricProfile = {
      weightKg: Math.max(30, Number(weightKg) || 75),
      heightCm: Math.max(100, Number(heightCm) || 175),
      age: Math.max(10, Number(age) || 25),
      gender,
      activityLevel,
      primaryGoal,
      stressLevel: Math.min(10, Math.max(0, Number(stressLevel) || 5)),
    };
    soundFx.playCoin();
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-3xl p-6 max-w-xl w-full shadow-2xl shadow-cyan-950/60 relative overflow-hidden space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400" />

        {/* Modal Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-2xl text-cyan-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                SISTEMA DE ANÁLISE BIOMÉTRICA
              </span>
              <h3 className="text-lg font-black text-slate-100">Atualizar Atributos Corporais</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-950 rounded-xl border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Physical Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-cyan-400" /> Peso (kg)
              </label>
              <input
                type="number"
                required
                min={30}
                max={250}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-cyan-400" /> Altura (cm)
              </label>
              <input
                type="number"
                required
                min={100}
                max={230}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Idade</label>
              <input
                type="number"
                required
                min={12}
                max={100}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Gênero</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>
          </div>

          {/* Activity Level Select */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> Nível de Atividade Física
            </label>
            <select
              value={activityLevel}
              onChange={(e) =>
                setActivityLevel(e.target.value as BiometricProfile['activityLevel'])
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="sedentary">Sedentário (Pouco ou nenhum exercício)</option>
              <option value="light">Levemente Ativo (Exercícios 1-3 dias/semana)</option>
              <option value="moderate">Moderadamente Ativo (Treinos 3-5 dias/semana)</option>
              <option value="heavy">Muito Ativo (Treinos intensos 6-7 dias/semana)</option>
              <option value="athlete">Extremamente Ativo (Atleta de Elite / Treinos Duplos)</option>
            </select>
          </div>

          {/* Primary Goal Select */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" /> Objetivo Principal de Caçador
            </label>
            <select
              value={primaryGoal}
              onChange={(e) =>
                setPrimaryGoal(e.target.value as BiometricProfile['primaryGoal'])
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="lose_weight">Perder Peso / Queima de Gordura</option>
              <option value="maintain">Manter Peso e Recomposição Corporal</option>
              <option value="gain_muscle">Ganhar Massa Muscular (Hipertrofia)</option>
              <option value="extreme_definition">Definição Extrema & Performance</option>
            </select>
          </div>

          {/* Stress Level Range Slider */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-purple-400" /> Nível de Estresse Diário
              </label>
              <span className="text-xs font-mono font-black text-purple-300 bg-purple-950/80 border border-purple-800 px-2.5 py-0.5 rounded-lg">
                {stressLevel} / 10
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={stressLevel}
              onChange={(e) => setStressLevel(Number(e.target.value))}
              className="w-full accent-purple-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 (Zen)</span>
              <span>5 (Moderado)</span>
              <span>10 (Crítico)</span>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-600/30 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Recalcular e Salvar Biometria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
