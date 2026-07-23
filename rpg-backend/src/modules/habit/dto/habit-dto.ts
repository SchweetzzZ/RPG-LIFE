import { z } from "zod"
import { ActivityLevel, PrimaryGoal } from "src/modules/profile/schema/profile.schema"

export const calculateNutrition = z.object({
    weightKg: z.number().min(30).max(300),
    heightCm: z.number().min(100).max(250),
    age: z.number().min(13).max(100),
    biologicalSex: z.enum(['male', 'female', 'other']),
    activityLevel: z.nativeEnum(ActivityLevel),
    primaryGoal: z.nativeEnum(PrimaryGoal),
})

export const calculateNutritionUpdate = calculateNutrition.partial()

export type CalculateNutritionInput = z.infer<typeof calculateNutrition>
export type CalculateNutritionUpdate = z.infer<typeof calculateNutritionUpdate>