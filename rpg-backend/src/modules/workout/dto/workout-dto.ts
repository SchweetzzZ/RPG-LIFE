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
    exercises: z.array(exerciseSchema).default([]),
    completionCount: z.number().int().min(0).default(0),
    lastCompletedDate: z.string().nullable().optional(),
});

// ── Update DTO (all fields optional) ────────────────────────────────────────

export const updateWorkoutSchema = createWorkoutSchema.partial();

// ── Inferred types ───────────────────────────────────────────────────────────

export type ExerciseSetDto = z.infer<typeof exerciseSetSchema>;
export type ExerciseDto = z.infer<typeof exerciseSchema>;
export type CreateWorkoutDto = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutDto = z.infer<typeof updateWorkoutSchema>;

// ── NestJS DTO classes (for validation pipe) ─────────────────────────────────

export class CreateWorkoutDtoClass extends createZodDto(createWorkoutSchema) {}
export class UpdateWorkoutDtoClass extends createZodDto(updateWorkoutSchema) {}