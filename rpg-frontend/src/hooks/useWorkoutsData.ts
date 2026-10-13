import { useResource, type Resource } from './useResource';
import { workoutService } from '../services/workout.service';
import type { ExerciseCatalogItem, ExercisePerformance, Routine, WorkoutLog } from '../types/workout';

export interface WorkoutsData {
  routines: Routine[];
  logs: WorkoutLog[];
  /** Última carga de cada exercício, para pré-preencher e mostrar nos cards. */
  performance: ExercisePerformance[];
  /** Exercícios que existem (rotinas + histórico), para o seletor. */
  catalog: ExerciseCatalogItem[];
}

async function loadWorkouts(): Promise<WorkoutsData> {
  const [routines, logs, performance, catalog] = await Promise.all([
    workoutService.listRoutines(),
    workoutService.listLogs(),
    workoutService.lastPerformance(),
    workoutService.listExercises(),
  ]);
  return { routines, logs, performance, catalog };
}

export function useWorkoutsData(): Resource<WorkoutsData> {
  return useResource(loadWorkouts);
}
