import { useState, type FormEvent } from 'react';
import { Save, LogOut, Check, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChoiceChips } from '../ui/ChoiceChips';
import { formatNumber } from '../../lib/format';
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

  const handleSubmit = async (e: FormEvent) => {
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

  const input =
    'h-11 w-full rounded-lg border-2 border-line bg-raised px-3 text-base text-ink focus:border-action focus:outline-none';
  const label = 'text-sm text-ink-dim';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Card label="Perfil físico" aside="Fórmula Mifflin-St Jeor">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <label className="block space-y-1">
              <span className={label}>Peso (kg)</span>
              <input type="number" inputMode="decimal" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className={input} />
            </label>
            <label className="block space-y-1">
              <span className={label}>Altura (cm)</span>
              <input type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} className={input} />
            </label>
            <label className="block space-y-1">
              <span className={label}>Idade</span>
              <input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} className={input} />
            </label>
          </div>

          <div className="space-y-1">
            <span id="sex-label" className={label}>Sexo usado no cálculo</span>
            <ChoiceChips
              layout="fill"
              aria-labelledby="sex-label"
              value={biologicalSex}
              options={SEX_OPTIONS}
              onChange={setBiologicalSex}
            />
            <span className="flex items-start gap-1.5 text-xs text-ink-faint">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              A fórmula de gasto calórico tem uma versão para cada sexo. Escolha a que mais se aproxima do seu corpo.
            </span>
          </div>

          <div className="space-y-1">
            <span id="activity-label" className={label}>Como é sua rotina fora da academia? (não conte o treino)</span>
            <ChoiceChips
              layout="stack"
              aria-labelledby="activity-label"
              value={activityLevel}
              options={ACTIVITY_OPTIONS}
              onChange={setActivityLevel}
            />
          </div>
        </div>
      </Card>

      {error && (
        <p role="alert" className="rounded-lg border-2 border-danger/60 bg-surface p-3 text-sm text-danger">
          {error}
        </p>
      )}
      {saved && (
        <div role="status" className="space-y-1 rounded-lg border-2 border-action/60 bg-surface p-3 text-sm text-ink">
          <p>
            Perfil salvo. Sua meta base ficou em{' '}
            <span className="font-num text-lg text-kcal">{formatNumber(Math.round(saved.targets.targetCalories))}</span> kcal por dia.
          </p>
          <Button to="/" variant="link" className="!min-h-[44px] !px-0">Ir para o painel</Button>
        </div>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? (
          'Salvando...'
        ) : saved ? (
          <>
            <Check className="h-4 w-4" />
            Metas recalculadas
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Salvar e recalcular dieta
          </>
        )}
      </Button>
      <Button variant="secondary" onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        Encerrar sessão
      </Button>
    </form>
  );
}
