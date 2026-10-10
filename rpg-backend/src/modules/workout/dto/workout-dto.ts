import { z } from "zod";
import { createZodDto } from "nestjs-zod";

// ── Sub-schemas (mirror frontend types.ts) ──────────────────────────────────

export const exerciseSetSchema = z.object({
    id: z.string().optional(),
    setNumber: z.number().int().min(1).default(1),
    weightKg: z.number().min(0).default(0),
    reps: z.number().int().min(0).default(0),
    completed: z.boolean().default(false),
    rpe: z.number().min(1).max(10).optional(),
    technique: z.enum(['normal', 'back_off_set', 'cluster_set', 'drop_set']).default('normal'),
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

export const createWorkoutSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().default(""),
    estimatedMinutes: z.number().int().min(1).default(45),
    targetMuscleGroups: z.array(z.string()).default([]),
    scheduledDays: z.array(z.number().int().min(0).max(6)).default([]),
    intensity: z.enum(['moderate', 'intense', 'cycling_running']).default('moderate'),
    exercises: z.array(exerciseSchema).default([]),
    completionCount: z.number().int().min(0).default(0),
    lastCompletedDate: z.string().nullable().optional(),
});

// ── Update DTO (all fields optional) ────────────────────────────────────────

export const updateWorkoutSchema = createWorkoutSchema.partial();

// ── Log Workout DTO ──────────────────────────────────────────────────────────

export const logWorkoutSchema = z.object({
    routineId: z.string().optional(),
    routineName: z.string().min(1, "Routine name is required"),
    durationMinutes: z.number().min(1).default(45),
    intensity: z.enum(['moderate', 'intense', 'cycling_running']).default('moderate'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser YYYY-MM-DD').optional(),
    exercises: z.array(z.object({
        exerciseName: z.string().min(1),
        maxWeightKg: z.number().min(0).optional(),
        completedSetsCount: z.number().int().min(0).optional(),
        sets: z.array(z.object({
            setNumber: z.number().int().min(1),
            weightKg: z.number().min(0),
            reps: z.number().int().min(0),
            technique: z.enum(['normal', 'back_off_set', 'cluster_set', 'drop_set']).default('normal'),
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

const setTechniqueSchema = z.enum(['normal', 'back_off_set', 'cluster_set', 'drop_set']);
const intensitySchema = z.enum(['moderate', 'intense', 'cycling_running']);

export const ExerciseSetResponseSchema = z.object({
    setNumber: z.number(),
    weightKg: z.number(),
    reps: z.number(),
    completed: z.boolean(),
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
    history: z.array(z.object({
        date: z.string(),
        maxWeightKg: z.number(),
        completedSetsCount: z.number(),
        totalVolumeKg: z.number(),
        sets: z.array(PerformedSetResponseSchema),
    })),
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
export class WorkoutDeletedResponseDto extends createZodDto(WorkoutDeletedResponseSchema) {}
