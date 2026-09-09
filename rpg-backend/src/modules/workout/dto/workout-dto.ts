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
    primaryAttribute: z.enum(['strength', 'intelligence', 'vitality', 'focus']).default('strength'),
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