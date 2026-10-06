import React, { useState } from 'react';
import { Save, LogOut, Check } from 'lucide-react';

interface BiometricsData {
  weightKg: number;
  heightCm: number;
  age: number;
  biologicalSex: 'M' | 'F';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
}

interface BiometricsFormProps {
  initialData?: BiometricsData;
  onSave: (data: BiometricsData) => void;
  onLogout: () => void;
}

export function BiometricsForm({
  initialData = {
    weightKg: 80,
    heightCm: 175,
    age: 28,
    biologicalSex: 'M',
    activityLevel: 'moderate',
  },
  onSave,
  onLogout,
}: BiometricsFormProps) {
  const [formData, setFormData] = useState<BiometricsData>(initialData);
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
          Dados Biométricos do Motor de Cálculo
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

        {/* Sexo Biológico */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Sexo Biológico
          </label>
          <select
            value={formData.biologicalSex}
            onChange={(e) =>
              setFormData({ ...formData, biologicalSex: e.target.value as 'M' | 'F' })
            }
            className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 font-mono text-xs font-semibold text-zinc-100 focus:border-amber-400/60 focus:outline-none"
          >
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </div>
      </div>

      {/* Nível de Atividade Física */}
      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
          Nível de Atividade Física Semanal
        </label>
        <select
          value={formData.activityLevel}
          onChange={(e) =>
            setFormData({
              ...formData,
              activityLevel: e.target.value as BiometricsData['activityLevel'],
            })
          }
          className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 text-xs text-zinc-100 focus:border-amber-400/60 focus:outline-none"
        >
          <option value="sedentary">Sedentário (Pouco ou nenhum exercício)</option>
          <option value="light">Leve (Exercício leve 1 a 3 dias na semana)</option>
          <option value="moderate">Moderado (Treino moderado 3 a 5 dias na semana)</option>
          <option value="very_active">Intenso (Treino pesado 6 a 7 dias na semana)</option>
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
