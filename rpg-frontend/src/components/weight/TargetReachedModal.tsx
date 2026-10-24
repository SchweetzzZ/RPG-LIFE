import { useEffect, useRef, useState } from 'react';
import { Flag, Loader2, Trophy, X } from 'lucide-react';
import type { PrimaryGoal } from '@/src/types/profile';
import { profileService } from '@/src/services/profile.service';
import { errorMessage } from '@/src/services/http';
import { celebrate } from '@/src/lib/celebrate';
import { formatNumber } from '@/src/lib/format';
import { formatKg } from '@/src/lib/weight';
import { Button } from '../ui/Button';

const GOAL_LABEL: Record<PrimaryGoal, string> = {
  lose_weight: 'Emagrecer',
  maintain: 'Manter',
  gain_muscle: 'Ganhar massa',
};

interface TargetReachedModalProps {
  targetKg: number;
  goal: PrimaryGoal | null;
  /** Meta de kcal antes de mudar o objetivo (veio na resposta do registro de peso). */
  previousCalories: number | null;
  /** `goalChanged` = o objetivo virou Manter: quem abriu deve reler os dados da tela. */
  onClose: (goalChanged: boolean) => void;
  /** "Definir nova meta": fecha e leva até o editor do peso-meta. */
  onNewTarget: () => void;
}

type Step =
  | { kind: 'ask' }
  | { kind: 'saving' }
  | { kind: 'changed'; fromKcal: number | null; toKcal: number };

/** Comemoração de meta alcançada (uma vez por meta). Oferece passar o objetivo para Manter. */
export function TargetReachedModal({ targetKg, goal, previousCalories, onClose, onNewTarget }: TargetReachedModalProps) {
  const [step, setStep] = useState<Step>({ kind: 'ask' });
  const [error, setError] = useState<string | null>(null);
  const celebrated = useRef(false);

  useEffect(() => {
    if (celebrated.current) return;
    celebrated.current = true;
    celebrate(true);
  }, []);

  const offerMaintain = goal === 'lose_weight' || goal === 'gain_muscle';
  const changed = step.kind === 'changed';

  const switchToMaintain = async () => {
    setError(null);
    setStep({ kind: 'saving' });
    try {
      const result = await profileService.saveNutritionProfile({ primaryGoal: 'maintain' });
      setStep({ kind: 'changed', fromKcal: previousCalories, toKcal: result.targets.targetCalories });
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível mudar o objetivo'));
      setStep({ kind: 'ask' });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="target-reached-title">
      <div className="w-full rounded-t-xl border-2 border-coin/60 bg-surface sm:max-w-md sm:rounded-lg">
        <div className="flex justify-end p-2 pb-0">
          <button
            type="button"
            onClick={() => onClose(changed)}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-line text-ink-dim hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-4 pb-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-coin/60 bg-raised">
              <Trophy className="h-7 w-7 text-coin" />
            </span>
            <p className="font-pixel text-[10px] uppercase tracking-wider text-coin">Meta alcançada</p>
            <h3 id="target-reached-title" className="text-xl font-bold text-ink">
              Você chegou em <span className="whitespace-nowrap font-num text-2xl text-coin">{formatKg(targetKg)}</span>!
            </h3>
          </div>

          {changed ? (
            <div className="space-y-3">
              <p className="rounded-lg border-2 border-line bg-raised p-3 text-center text-sm text-ink-dim">
                Objetivo agora: <span className="font-semibold text-ink">Manter</span>.{' '}
                {step.fromKcal !== null && step.fromKcal !== step.toKcal ? (
                  <>
                    Sua meta passou de <span className="whitespace-nowrap font-num text-base text-ink">{formatNumber(step.fromKcal)}</span> para{' '}
                    <span className="whitespace-nowrap font-num text-base text-kcal">{formatNumber(step.toKcal)} kcal</span>.
                  </>
                ) : (
                  <>
                    Sua meta agora é <span className="whitespace-nowrap font-num text-base text-kcal">{formatNumber(step.toKcal)} kcal</span>.
                  </>
                )}
              </p>
              <Button onClick={() => onClose(true)}>Fechar</Button>
            </div>
          ) : offerMaintain && goal ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-ink-dim">
                Seu objetivo é <span className="font-semibold text-ink">{GOAL_LABEL[goal]}</span>. Quer mudar o objetivo para Manter?
              </p>
              {error && <p role="alert" className="text-center text-sm text-danger">{error}</p>}
              <div className="space-y-2">
                <Button onClick={() => void switchToMaintain()} disabled={step.kind === 'saving'}>
                  {step.kind === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
                  Mudar para Manter
                </Button>
                <Button variant="secondary" onClick={onNewTarget} disabled={step.kind === 'saving'}>
                  <Flag className="h-4 w-4" />
                  Definir nova meta
                </Button>
                <Button variant="link" className="w-full" onClick={() => onClose(false)} disabled={step.kind === 'saving'}>
                  Continuar como está
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm text-ink-dim">Parabéns pela constância! Continue registrando para acompanhar.</p>
              <Button onClick={() => onClose(false)}>Fechar</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
