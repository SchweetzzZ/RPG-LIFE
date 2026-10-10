import React, { useState } from 'react';
import { Save, LogOut, Check } from 'lucide-react';

// Valores iguais aos da API (UpdateProfileDto). No Lote 3 este tipo passa a vir do schema.ts.
type BiologicalSex = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'intense' | 'very_intense';

export interface PhysicalProfileData {
  weightKg: number;
  heightCm: number;
  age: number;
  biologicalSex: BiologicalSex;
  activityLevel: ActivityLevel;
}

const SEX_OPTIONS: { value: BiologicalSex; label: string }[] = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentário (pouco ou nenhum exercício)' },
  { value: 'light', label: 'Leve (exercício leve 1 a 3 dias na semana)' },
  { value: 'moderate', label: 'Moderado (treino moderado 3 a 5 dias na semana)' },
  { value: 'intense', label: 'Intenso (treino pesado 6 a 7 dias na semana)' },
  { value: 'very_intense', label: 'Muito intenso (treino pesado diário ou trabalho físico)' },
];

interface PhysicalProfileFormProps {
  initialData?: PhysicalProfileData;
  onSave: (data: PhysicalProfileData) => void;
  onLogout: () => void;
}

export function PhysicalProfileForm({
  initialData = {
    weightKg: 80,
    heightCm: 175,
    age: 28,
    biologicalSex: 'male',
    activityLevel: 'moderate',
  },
  onSave,
  onLogout,
}: PhysicalProfileFormProps) {
  const [formData, setFormData] = useState<PhysicalProfileData>(initialData);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Perfil físico
        </h3>
        <span className="font-mono text-[10px] text-zinc-500">
          Fórmula Mifflin-St Jeor
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Peso */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Peso Atual (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={formData.weightKg}
            onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
            className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 font-mono text-sm font-bold text-zinc-100 focus:border-amber-400/60 focus:outline-none"
          />
        </div>

        {/* Altura */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Altura (cm)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={formData.heightCm}
            onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
            className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 font-mono text-sm font-bold text-zinc-100 focus:border-amber-400/60 focus:outline-none"
          />
        </div>

        {/* Idade */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Idade
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
            className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 font-mono text-sm font-bold text-zinc-100 focus:border-amber-400/60 focus:outline-none"
          />
        </div>

        {/* Sexo usado no cálculo (não é identidade de gênero) */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Sexo usado no cálculo
          </label>
          <select
            value={formData.biologicalSex}
            onChange={(e) => {
              const option = SEX_OPTIONS.find((o) => o.value === e.target.value);
              if (option) setFormData({ ...formData, biologicalSex: option.value });
            }}
            className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 font-mono text-xs font-semibold text-zinc-100 focus:border-amber-400/60 focus:outline-none"
          >
            {SEX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="text-[10px] leading-snug text-zinc-500">
            A fórmula de gasto calórico tem uma versão para cada sexo. Escolha a que mais se aproxima do seu corpo.
          </p>
        </div>
      </div>

      {/* Nível de Atividade Física */}
      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
          Nível de Atividade Física Semanal
        </label>
        <select
          value={formData.activityLevel}
          onChange={(e) => {
            const option = ACTIVITY_OPTIONS.find((o) => o.value === e.target.value);
            if (option) setFormData({ ...formData, activityLevel: option.value });
          }}
          className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 text-xs text-zinc-100 focus:border-amber-400/60 focus:outline-none"
        >
          {ACTIVITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onLogout}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 font-mono text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all min-h-[44px]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Encerrar Sessão</span>
        </button>

        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition-all min-h-[44px]"
        >
          {savedSuccess ? (
            <>
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>Metas Recalculadas!</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 stroke-[2]" />
              <span>Salvar e Recalcular Dieta</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
