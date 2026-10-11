import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Save, LogOut, Check } from 'lucide-react';
import { errorMessage } from '../../services/http';
import type {
  ActivityLevel,
  BiologicalSex,
  NutritionUpdateResult,
  PrimaryGoal,
  ProfileData,
  UpdateProfileInput,
} from '../../types/profile';

const SEX_OPTIONS: { value: BiologicalSex; label: string }[] = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Trabalho sentado' },
  { value: 'light', label: 'Em pé ou andando parte do dia' },
  { value: 'moderate', label: 'Trabalho físico' },
];

interface PhysicalProfileFormProps {
  /** Perfil vindo do servidor (GET /profile); campos não preenchidos vêm null. */
  initialData: ProfileData;
  /** Objetivo escolhido no seletor da tela. */
  primaryGoal: PrimaryGoal | null;
  /** Salva no servidor; deve lançar erro se falhar. */
  onSave: (data: UpdateProfileInput) => Promise<NutritionUpdateResult>;
  onLogout: () => void;
}

function toText(value: number | null): string {
  return value === null ? '' : String(value);
}

function toNumber(text: string): number | null {
  if (text.trim() === '') return null;
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export function PhysicalProfileForm({ initialData, primaryGoal, onSave, onLogout }: PhysicalProfileFormProps) {
  const [weight, setWeight] = useState(toText(initialData.weightKg));
  const [height, setHeight] = useState(toText(initialData.heightCm));
  const [age, setAge] = useState(toText(initialData.age));
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex | ''>(initialData.biologicalSex ?? '');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>(initialData.activityLevel ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<NutritionUpdateResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(null);

    const weightKg = toNumber(weight);
    const heightCm = toNumber(height);
    const ageYears = toNumber(age);
    if (weightKg === null || weightKg < 30 || weightKg > 300) return setError('Informe um peso entre 30 e 300 kg.');
    if (heightCm === null || heightCm < 100 || heightCm > 250) return setError('Informe uma altura entre 100 e 250 cm.');
    if (ageYears === null || ageYears < 13 || ageYears > 100) return setError('Informe uma idade entre 13 e 100 anos.');
    if (biologicalSex === '') return setError('Escolha o sexo usado no cálculo.');
    if (activityLevel === '') return setError('Escolha como é sua rotina fora da academia.');
    if (primaryGoal === null) return setError('Escolha seu objetivo.');

    setError(null);
    setSaving(true);
    try {
      const result = await onSave({
        weightKg,
        heightCm,
        age: ageYears,
        biologicalSex,
        activityLevel,
        primaryGoal,
      });
      setSaved(result);
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível salvar o perfil'));
    } finally {
      setSaving(false);
    }
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
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
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
            value={height}
            onChange={(e) => setHeight(e.target.value)}
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
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 font-mono text-sm font-bold text-zinc-100 focus:border-amber-400/60 focus:outline-none"
          />
        </div>

        {/* Sexo usado no cálculo (não é identidade de gênero) */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Sexo usado no cálculo
          </label>
          <select
            value={biologicalSex}
            onChange={(e) => {
              const option = SEX_OPTIONS.find((o) => o.value === e.target.value);
              setBiologicalSex(option ? option.value : '');
            }}
            className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 font-mono text-xs font-semibold text-zinc-100 focus:border-amber-400/60 focus:outline-none"
          >
            <option value="">Selecione</option>
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
          Como é sua rotina fora da academia? (não conte o treino)
        </label>
        <select
          value={activityLevel}
          onChange={(e) => {
            const option = ACTIVITY_OPTIONS.find((o) => o.value === e.target.value);
            setActivityLevel(option ? option.value : '');
          }}
          className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 text-xs text-zinc-100 focus:border-amber-400/60 focus:outline-none"
        >
          <option value="">Selecione</option>
          {ACTIVITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      )}
      {saved && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <span>Perfil salvo! Sua meta base ficou em {Math.round(saved.targets.targetCalories)} kcal por dia.</span>
          <Link to="/" className="font-mono font-semibold underline">Ir para o painel</Link>
        </div>
      )}

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
          disabled={saving}
          className="disabled:opacity-60 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition-all min-h-[44px]"
        >
          {saving ? (
            <span>Salvando...</span>
          ) : saved ? (
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
