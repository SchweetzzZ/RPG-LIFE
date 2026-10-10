import { createZodDto } from "nestjs-zod"
import { z } from "zod"
import { ActivityLevel, BiologicalSex, PrimaryGoal } from "../schema/profile.schema"
import { isValidTimezone } from "../../common/utils/user-date"

export const SetupProfileSchema = z.object({
    weightKg: z.number().min(30).max(300),
    heightCm: z.number().min(100).max(250),
    age: z.number().min(13).max(100),
    // Sexo usado no calculo (formula de gasto calorico), nao identidade de genero
    biologicalSex: z.nativeEnum(BiologicalSex),
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
    biologicalSex: z.nativeEnum(BiologicalSex),
    activityLevel: z.nativeEnum(ActivityLevel),
    primaryGoal: z.nativeEnum(PrimaryGoal),
})

export const calculateNutritionUpdate = calculateNutrition.partial()

export type CalculateNutritionInput = z.infer<typeof calculateNutrition>
export type CalculateNutritionUpdate = z.infer<typeof calculateNutritionUpdate>

// ── Response DTOs ────────────────────────────────────────────────────────────
// Campos do perfil fisico ficam null ate o usuario preencher o perfil

export const ProfileResponseSchema = z.object({
    id: z.string(),
    weightKg: z.number().nullable(),
    heightCm: z.number().nullable(),
    age: z.number().nullable(),
    biologicalSex: z.nativeEnum(BiologicalSex).nullable(),
    activityLevel: z.nativeEnum(ActivityLevel).nullable(),
    primaryGoal: z.nativeEnum(PrimaryGoal).nullable(),
    timezone: z.string(),
    targetCalories: z.number().nullable(),
    targetProteinGrams: z.number().nullable(),
    targetCarbGrams: z.number().nullable(),
    targetFatGrams: z.number().nullable(),
})

export const NutritionTargetsResponseSchema = z.object({
    bmr: z.number(),
    tdee: z.number(),
    targetCalories: z.number(),
    proteinGrams: z.number(),
    carbGrams: z.number(),
    fatGrams: z.number(),
})

export const UpdateNutritionResponseSchema = z.object({
    profile: ProfileResponseSchema,
    targets: NutritionTargetsResponseSchema,
})

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>

export class ProfileResponseDto extends createZodDto(ProfileResponseSchema) { }
export class UpdateNutritionResponseDto extends createZodDto(UpdateNutritionResponseSchema) { }
