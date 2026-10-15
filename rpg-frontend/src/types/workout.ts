import type { components } from "../api/schema"

type Schemas = components["schemas"]

export type Routine = Schemas["WorkoutResponseDto"]
export type RoutineExercise = Routine["exercises"][number]
export type RoutineSet = RoutineExercise["sets"][number]

export type CreateRoutineInput = Schemas["CreateWorkoutDtoClass"]
export type UpdateRoutineInput = Schemas["UpdateWorkoutDtoClass"]
export type RoutineExerciseInput = NonNullable<UpdateRoutineInput["exercises"]>[number]
export type RoutineSetInput = RoutineExerciseInput["sets"][number]

export type WorkoutLog = Schemas["WorkoutLogResponseDto"]
export type LogSessionInput = Schemas["LogWorkoutDto"]
export type LogSessionResult = Schemas["LogWorkoutSessionResponseDto"]

export type ExercisePerformance = Schemas["ExercisePerformanceResponseDto"]
export type ExerciseCatalogItem = Schemas["ExerciseCatalogItemResponseDto"]
export type Progression = Schemas["ProgressionResponseDto"]

export type SetTechnique = RoutineSet["technique"]
export type Intensity = Routine["intensity"]
export type ExerciseCategory = RoutineExerciseInput["category"]

export const SET_TECHNIQUES: { value: SetTechnique; label: string; short: string }[] = [
  { value: "normal", label: "Normal", short: "N" },
  { value: "warmup", label: "Aquecimento", short: "A" },
  { value: "failure", label: "Até a falha", short: "F" },
  { value: "drop_set", label: "Drop-set", short: "D" },
  { value: "back_off_set", label: "Back-off", short: "B" },
  { value: "cluster_set", label: "Cluster", short: "C" },
]

export const INTENSITIES: { value: Intensity; label: string }[] = [
  { value: "moderate", label: "Moderada" },
  { value: "intense", label: "Intensa" },
  { value: "cycling_running", label: "Corrida / bike" },
]

export const EXERCISE_CATEGORIES: ExerciseCategory[] = ["Peito", "Costas", "Pernas", "Ombros", "Braços", "Abdômen", "Cardio"]

export const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"]

/** A API devolve a categoria como texto livre; só aceita as conhecidas. */
export function toCategory(value: string | undefined): ExerciseCategory {
  return EXERCISE_CATEGORIES.find((c) => c === value) ?? "Peito"
}

// Estado da navegacao: resultado do treino salvo, mostrado na lista ao voltar
declare module "@tanstack/history" {
  interface HistoryState {
    workoutResult?: LogSessionResult
  }
}
