import { createZodDto } from "nestjs-zod"
import { z } from "zod"
import { ActivityLevel, PrimaryGoal } from "../schema/profile.schema"
import { isValidTimezone } from "../../common/utils/user-date"

export const SetupProfileSchema = z.object({
    weightKg: z.number().min(30).max(300),
    heightCm: z.number().min(100).max(250),
    age: z.number().min(13).max(100),
    biologicalSex: z.enum(['male', 'female', 'other']),
    activityLevel: z.nativeEnum(ActivityLevel),
    primaryGoal: z.nativeEnum(PrimaryGoal),
    timezone: z.string().refine(isValidTimezone, { message: 'Fuso horário inválido (use um identificador IANA, ex.: America/Sao_Paulo)' }).optional(),
})

export const UpdateProfileSchema = SetupProfileSchema.partial()

export class SetupProfileDto extends createZodDto(SetupProfileSchema) { }
export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) { }

// Calculo de nutricao
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
