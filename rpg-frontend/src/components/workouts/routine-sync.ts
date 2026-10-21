import { nameKey, type SessionExercise } from './session';
import { type Routine, type UpdateRoutineInput } from '../../types/workout';

// Exercicio sem nome nao vai para a rotina
function namedExercises(exercises: SessionExercise[]): SessionExercise[] {
  return exercises.filter((ex) => ex.name.trim() !== '');
}

/**
 * Mudou a estrutura em relação à rotina carregada? Conta: lista e ordem dos exercícios,
 * e quantidade de séries de cada um. Peso e reps não contam (vêm do histórico).
 * Renomear também não conta: a renomeação já atualiza a rotina no servidor.
 */
export function hasStructureChange(routine: Routine, exercises: SessionExercise[]): boolean {
  const current = namedExercises(exercises);
  if (current.length !== routine.exercises.length) return true;
  return current.some((ex, idx) => {
    const planned = routine.exercises[idx];
    if (nameKey(ex.originalName ?? ex.name) !== nameKey(planned.name)) return true;
    // Rotina sem series prescritas nao tem quantidade para comparar
    return planned.sets.length > 0 && ex.sets.length !== planned.sets.length;
  });
}

/**
 * Corpo do PUT /workout/:id a partir do treino da tela: exercícios e ordem da tela, séries = as de hoje.
 * Só manda `exercises`: o update é parcial, então notes, intensity, description
 * e completionCount ficam como estão no servidor.
 */
export function buildRoutineUpdate(routine: Routine, exercises: SessionExercise[]): UpdateRoutineInput {
  return {
    exercises: namedExercises(exercises).map((ex) => {
      const planned = routine.exercises.find((p) => nameKey(p.name) === nameKey(ex.originalName ?? ex.name));
      return {
        ...(planned?.id ? { id: planned.id } : {}),
        name: ex.name.trim(),
        ...(planned?.notes ? { notes: planned.notes } : {}),
        sets: ex.sets.map((s, idx) => ({
          setNumber: idx + 1,
          weightKg: s.weightKg,
          reps: s.reps,
          technique: s.technique,
          restSeconds: s.restSeconds,
        })),
      };
    }),
  };
}

/** Rotina com um exercício renomeado (espelha o que o servidor fez no PATCH de renomear). */
export function renameInRoutine(routine: Routine, from: string, to: string): Routine {
  const key = nameKey(from);
  return {
    ...routine,
    exercises: routine.exercises.map((ex) => (nameKey(ex.name) === key ? { ...ex, name: to } : ex)),
  };
}

/** Rotina sem um exercício (espelha o DELETE do exercício e histórico). */
export function removeFromRoutine(routine: Routine, name: string): Routine {
  const key = nameKey(name);
  return { ...routine, exercises: routine.exercises.filter((ex) => nameKey(ex.name) !== key) };
}
