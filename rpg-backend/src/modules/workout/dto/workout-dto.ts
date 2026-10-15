import { z } from "zod";
import { createZodDto } from "nestjs-zod";

// Tecnica da serie. 'warmup' (aquecimento) nao entra no volume nem no 1RM
export const SET_TECHNIQUES = ['normal', 'warmup', 'failure', 'drop_set', 'back_off_set', 'cluster_set'] as const;

// ── Sub-schemas (mirror frontend types.ts) ──────────────────────────────────

export const exerciseSetSchema = z.object({
    id: z.string().optional(),
    setNumber: z.number().int().min(1).default(1),
    weightKg: z.number().min(0).default(0),
    reps: z.number().int().min(0).default(0),
    rpe: z.number().min(1).max(10).optional(),
    technique: z.enum(SET_TECHNIQUES).default('normal'),
    restSeconds: z.number().int().min(0).default(60),
});

export const exerciseSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Exercise name is required"),
    category: z.enum(['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Cardio']).default('Peito'),
    sets: z.array(exerciseSetSchema).default([]),
    notes: z.string().optional(),
});

// ── Create DTO ───────────────────────────────────────────────────────────────

// Campos sem default: o update parcial nao pode preencher o que nao veio no corpo
const workoutFields = {
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    estimatedMinutes: z.number().int().min(1),
    targetMuscleGroups: z.array(z.string()),
    scheduledDays: z.array(z.number().int().min(0).max(6)),
    intensity: z.enum(['moderate', 'intense', 'cycling_running']),
    exercises: z.array(exerciseSchema),
    completionCount: z.number().int().min(0),
    lastCompletedDate: z.string().nullable().optional(),
};

export const createWorkoutSchema = z.object({
    ...workoutFields,
    description: workoutFields.description.default(""),
    estimatedMinutes: workoutFields.estimatedMinutes.default(45),
    targetMuscleGroups: workoutFields.targetMuscleGroups.default([]),
    scheduledDays: workoutFields.scheduledDays.default([]),
    intensity: workoutFields.intensity.default('moderate'),
    exercises: workoutFields.exercises.default([]),
    completionCount: workoutFields.completionCount.default(0),
});

// ── Update DTO (all fields optional) ────────────────────────────────────────

// Sem defaults (o .partial() do Zod 4 aplicaria os defaults e zeraria campos nao enviados,
// ex.: completionCount e description ao salvar so os exercicios da rotina)
export const updateWorkoutSchema = z.object(workoutFields).partial();

// ── Log Workout DTO ──────────────────────────────────────────────────────────

// Todo treino pertence a uma rotina; o nome vem da rotina no banco.
// A data e sempre o "hoje" do usuario (campos extras como `date` sao descartados).
export const logWorkoutSchema = z.object({
    routineId: z.string().min(1, "Rotina é obrigatória"),
    // Sem cronometro a duracao e opcional: o servidor estima pelas series
    durationMinutes: z.number().min(1).optional(),
    intensity: z.enum(['moderate', 'intense', 'cycling_running']).default('moderate'),
    exercises: z.array(z.object({
        exerciseName: z.string().min(1),
        maxWeightKg: z.number().min(0).optional(),
        completedSetsCount: z.number().int().min(0).optional(),
        sets: z.array(z.object({
            setNumber: z.number().int().min(1),
            weightKg: z.number().min(0),
            reps: z.number().int().min(0),
            technique: z.enum(SET_TECHNIQUES).default('normal'),
            restSeconds: z.number().int().min(0).default(60),
        })).optional(),
    })).default([]),
});

// ── Inferred types ───────────────────────────────────────────────────────────

export type ExerciseSetDto = z.infer<typeof exerciseSetSchema>;
export type ExerciseDto = z.infer<typeof exerciseSchema>;
export type CreateWorkoutDto = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutDto = z.infer<typeof updateWorkoutSchema>;
export type LogWorkoutInput = z.infer<typeof logWorkoutSchema>;

// ── NestJS DTO classes (for validation pipe) ─────────────────────────────────

export class CreateWorkoutDtoClass extends createZodDto(createWorkoutSchema) {}
export class UpdateWorkoutDtoClass extends createZodDto(updateWorkoutSchema) {}
export class LogWorkoutDto extends createZodDto(logWorkoutSchema) {}

// ── Registro manual de log (POST /workout/logs) ─────────────────────────────

export const createWorkoutLogSchema = z.object({
    routineId: z.string().optional(),
    routineTitle: z.string().optional(),
    durationMinutes: z.number().min(0).default(0),
    totalVolumeKg: z.number().min(0).default(0),
    totalSetsCompleted: z.number().int().min(0).default(0),
    xpEarned: z.number().int().min(0).default(0),
    coinsEarned: z.number().int().min(0).default(0),
    exerciseLogs: z.array(z.object({
        exerciseName: z.string().min(1),
        maxWeightKg: z.number().min(0).default(0),
        completedSetsCount: z.number().int().min(0).default(0),
    })).default([]),
});

export type CreateWorkoutLogInput = z.infer<typeof createWorkoutLogSchema>;
export class CreateWorkoutLogDto extends createZodDto(createWorkoutLogSchema) {}

// ── Response DTOs ────────────────────────────────────────────────────────────

const setTechniqueSchema = z.enum(SET_TECHNIQUES);
const intensitySchema = z.enum(['moderate', 'intense', 'cycling_running']);

export const ExerciseSetResponseSchema = z.object({
    setNumber: z.number(),
    weightKg: z.number(),
    reps: z.number(),
    rpe: z.number().optional(),
    technique: setTechniqueSchema,
    restSeconds: z.number(),
});

export const WorkoutExerciseResponseSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    category: z.string().optional(),
    sets: z.array(ExerciseSetResponseSchema),
    notes: z.string().optional(),
});

export const WorkoutResponseSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    estimatedMinutes: z.number(),
    targetMuscleGroups: z.array(z.string()),
    scheduledDays: z.array(z.number()),
    intensity: intensitySchema,
    exercises: z.array(WorkoutExerciseResponseSchema),
    completionCount: z.number(),
    lastCompletedDate: z.string().nullable(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const PerformedSetResponseSchema = z.object({
    setNumber: z.number(),
    weightKg: z.number(),
    reps: z.number(),
    technique: z.string().optional(),
    restSeconds: z.number().optional(),
});

export const PerformedExerciseResponseSchema = z.object({
    exerciseName: z.string(),
    maxWeightKg: z.number().optional(),
    completedSetsCount: z.number().optional(),
    sets: z.array(PerformedSetResponseSchema).optional(),
});

export const WorkoutLogResponseSchema = z.object({
    id: z.string(),
    routineId: z.string().optional(),
    routineName: z.string(),
    date: z.string(),
    durationMinutes: z.number(),
    intensity: intensitySchema,
    caloriesBurned: z.number(),
    totalVolumeKg: z.number(),
    totalSets: z.number(),
    xpGained: z.number(),
    coinsGained: z.number(),
    exercises: z.array(PerformedExerciseResponseSchema),
    completedAt: z.string(),
});

export const LogWorkoutSessionResponseSchema = z.object({
    workoutLog: WorkoutLogResponseSchema,
    caloriesBurned: z.number(),
    coinsEarned: z.number(),
    xpEarned: z.number(),
    leveledUp: z.boolean(),
});

export const ProgressionResponseSchema = z.object({
    exerciseName: z.string(),
    totalSessions: z.number(),
    /** Maior 1RM estimado (Epley) ja registrado; 0 se nao ha series validas */
    bestEstimated1RmKg: z.number(),
    history: z.array(z.object({
        date: z.string(),
        maxWeightKg: z.number(),
        completedSetsCount: z.number(),
        totalVolumeKg: z.number(),
        estimated1RmKg: z.number(),
        sets: z.array(PerformedSetResponseSchema),
    })),
});

// Ultimo desempenho de cada exercicio, para pre-preencher o proximo treino
export const ExercisePerformanceResponseSchema = z.object({
    exerciseName: z.string(),
    /** Data da ultima vez que o exercicio foi registrado */
    date: z.string(),
    sets: z.array(PerformedSetResponseSchema),
    maxWeightKg: z.number(),
    estimated1RmKg: z.number(),
    /** Maior carga (sem aquecimento) ja registrada nos treinos recentes */
    personalBestKg: z.number(),
});

// Catalogo: exercicios das rotinas e dos registros, sem duplicar pelo nome
export const ExerciseCatalogItemResponseSchema = z.object({
    name: z.string(),
    category: z.string().nullable(),
    timesLogged: z.number(),
    lastDate: z.string().nullable(),
    lastSets: z.array(PerformedSetResponseSchema),
    /** Maior carga (sem aquecimento) ja registrada */
    personalBestKg: z.number(),
});

export const renameExerciseSchema = z.object({
    from: z.string().trim().min(1, 'Nome atual é obrigatório'),
    to: z.string().trim().min(1, 'Novo nome é obrigatório').max(80),
});

export const ExerciseRenamedResponseSchema = z.object({
    name: z.string(),
    routinesUpdated: z.number(),
    logsUpdated: z.number(),
});

export const ExerciseDeletedResponseSchema = z.object({
    message: z.string(),
    routinesUpdated: z.number(),
    logsUpdated: z.number(),
});

export const WorkoutDeletedResponseSchema = z.object({
    message: z.string(),
});

export type WorkoutResponse = z.infer<typeof WorkoutResponseSchema>;
export type WorkoutLogResponse = z.infer<typeof WorkoutLogResponseSchema>;

export class WorkoutResponseDto extends createZodDto(WorkoutResponseSchema) {}
export class WorkoutLogResponseDto extends createZodDto(WorkoutLogResponseSchema) {}
export class LogWorkoutSessionResponseDto extends createZodDto(LogWorkoutSessionResponseSchema) {}
export class ProgressionResponseDto extends createZodDto(ProgressionResponseSchema) {}
export class ExercisePerformanceResponseDto extends createZodDto(ExercisePerformanceResponseSchema) {}
export class WorkoutDeletedResponseDto extends createZodDto(WorkoutDeletedResponseSchema) {}

export class ExerciseCatalogItemResponseDto extends createZodDto(ExerciseCatalogItemResponseSchema) {}
export class RenameExerciseDto extends createZodDto(renameExerciseSchema) {}
export class ExerciseRenamedResponseDto extends createZodDto(ExerciseRenamedResponseSchema) {}
export class ExerciseDeletedResponseDto extends createZodDto(ExerciseDeletedResponseSchema) {}
