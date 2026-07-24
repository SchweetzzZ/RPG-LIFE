import { z } from "zod"
import { createZodDto } from "nestjs-zod"
import { targetMuscularGroup } from "../schemas/exercise-schema"

export const workoutExerciseSchema = z.object({
    exerciseId: z.string().min(1, "Exercise ID is required"),
    exerciseName: z.string().min(1, "Exercise name is required"),
    targetSets: z.number().int().min(1, "Target sets must be at least 1"),
    targetReps: z.number().int().min(1, "Target reps must be at least 1"),
});

export const workoutSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    muscleGroup: z.nativeEnum(targetMuscularGroup, { error: "Invalid muscle group" }),
    exercises: z.array(workoutExerciseSchema)
})

export const workoutUpdateSchema = workoutSchema.partial()

export type WorkoutExerciseDto = z.infer<typeof workoutExerciseSchema>;
export type WorkoutDto = z.infer<typeof workoutSchema>;
export type WorkoutUpdateDto = z.infer<typeof workoutUpdateSchema>;

export class CreateWorkoutDto extends createZodDto(workoutSchema) { }
export class UpdateWorkoutDto extends createZodDto(workoutUpdateSchema) { }