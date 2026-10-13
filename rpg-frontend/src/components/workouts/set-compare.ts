import type { ExerciseCatalogItem, SetTechnique } from '../../types/workout';

export interface SetDiff {
  weightKg: number;
  reps: number;
}

type LastSet = ExerciseCatalogItem['lastSets'][number];

/** Séries de trabalho da última vez (aquecimento fica de fora da comparação). */
export function lastWorkSets(lastSets: LastSet[]): LastSet[] {
  return lastSets.filter((s) => s.technique !== 'warmup');
}

/**
 * Diferença da série atual contra a série de trabalho de mesma posição na última vez.
 * Aquecimento ou sem série correspondente: null (nada a comparar).
 */
export function compareSet(
  current: { weightKg: number; reps: number; technique: SetTechnique },
  workIndex: number,
  lastSets: LastSet[],
): SetDiff | null {
  if (current.technique === 'warmup') return null;
  const previous = lastWorkSets(lastSets)[workIndex];
  if (!previous) return null;
  return {
    weightKg: Math.round((current.weightKg - previous.weightKg) * 100) / 100,
    reps: current.reps - previous.reps,
  };
}

const fmt = (n: number): string => Math.abs(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

/** "+2,5 kg · −1 rep" ou "igual à última vez". */
export function describeDiff(diff: SetDiff): string {
  const parts: string[] = [];
  if (diff.weightKg !== 0) parts.push(`${diff.weightKg > 0 ? '+' : '−'}${fmt(diff.weightKg)} kg`);
  if (diff.reps !== 0) parts.push(`${diff.reps > 0 ? '+' : '−'}${fmt(diff.reps)} ${Math.abs(diff.reps) === 1 ? 'rep' : 'reps'}`);
  return parts.length > 0 ? parts.join(' · ') : 'igual à última vez';
}
