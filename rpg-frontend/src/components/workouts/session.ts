import type {
  ExercisePerformance,
  LogSessionInput,
  Routine,
  RoutineExercise,
  SetTechnique,
} from '../../types/workout';

/** Série em edição na tela de registro. Todas as séries da lista são registradas ao salvar. */
export interface SessionSet {
  key: string;
  technique: SetTechnique;
  weightKg: number;
  reps: number;
  restSeconds: number;
  /** Só para o visual (cronômetro de descanso); não é enviado nem validado. */
  done: boolean;
}

export interface SessionExercise {
  key: string;
  name: string;
  /** Nome com que o exercício já existe no catálogo; null = criado agora. Se o nome mudar, vira renomeação ao salvar. */
  originalName: string | null;
  sets: SessionSet[];
}

let counter = 0;
export const uid = (): string => `k${Date.now().toString(36)}${(counter++).toString(36)}`;

export const nameKey = (name: string): string =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

export function findPerformance(
  performance: ExercisePerformance[],
  name: string,
): ExercisePerformance | undefined {
  const key = nameKey(name);
  return performance.find((p) => nameKey(p.exerciseName) === key);
}

export function blankSet(previous?: SessionSet): SessionSet {
  return {
    key: uid(),
    technique: 'normal',
    weightKg: previous?.weightKg ?? 0,
    reps: previous?.reps ?? 0,
    restSeconds: previous?.restSeconds ?? 90,
    done: false,
  };
}

/** Pré-preenche com a última vez que o exercício foi feito; sem histórico, usa o prescrito na rotina. */
function buildExercise(ex: RoutineExercise, performance: ExercisePerformance[]): SessionExercise {
  const last = findPerformance(performance, ex.name);
  if (last && last.sets.length > 0) {
    return {
      key: uid(),
      name: ex.name,
      originalName: ex.name,
      sets: last.sets.map((s) => ({
        key: uid(),
        technique: toTechnique(s.technique),
        weightKg: s.weightKg,
        reps: s.reps,
        restSeconds: s.restSeconds ?? 90,
        done: false,
      })),
    };
  }
  const prescribed = ex.sets;
  return {
    key: uid(),
    name: ex.name,
    originalName: ex.name,
    sets: prescribed.length > 0
      ? prescribed.map((s) => ({
          key: uid(),
          technique: s.technique,
          weightKg: s.weightKg,
          reps: s.reps,
          restSeconds: s.restSeconds,
          done: false,
        }))
      : [blankSet()],
  };
}

const TECHNIQUE_VALUES: SetTechnique[] = ['normal', 'warmup', 'failure', 'drop_set', 'back_off_set', 'cluster_set'];

export function toTechnique(value: string | undefined): SetTechnique {
  return TECHNIQUE_VALUES.find((t) => t === value) ?? 'normal';
}

export function buildSessionExercises(routine: Routine | null, performance: ExercisePerformance[]): SessionExercise[] {
  return (routine?.exercises ?? []).map((ex) => buildExercise(ex, performance));
}

/** Monta o corpo do POST /workout/session. Séries zeradas (0 kg e 0 reps) são descartadas. */
export function buildLogInput(args: {
  routine: Routine | null;
  exercises: SessionExercise[];
  durationMinutes?: number;
  date?: string;
}): LogSessionInput {
  const exercises = args.exercises
    .map((ex) => ({
      exerciseName: ex.name.trim(),
      sets: ex.sets
        .filter((s) => s.weightKg > 0 || s.reps > 0)
        .map((s, idx) => ({
          setNumber: idx + 1,
          weightKg: s.weightKg,
          reps: s.reps,
          technique: s.technique,
          restSeconds: s.restSeconds,
        })),
    }))
    .filter((ex) => ex.exerciseName !== '' && ex.sets.length > 0);

  return {
    ...(args.routine ? { routineId: args.routine.id } : {}),
    routineName: args.routine?.title ?? 'Treino avulso',
    intensity: args.routine?.intensity ?? 'moderate',
    ...(args.durationMinutes != null ? { durationMinutes: args.durationMinutes } : {}),
    ...(args.date ? { date: args.date } : {}),
    exercises,
  };
}

export function countRegisteredSets(exercises: SessionExercise[]): number {
  return exercises
    .filter((ex) => ex.name.trim() !== '')
    .reduce((sum, ex) => sum + ex.sets.filter((s) => s.weightKg > 0 || s.reps > 0).length, 0);
}
