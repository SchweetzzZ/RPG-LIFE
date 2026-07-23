import { createZodDto } from "nestjs-zod"
import { z } from "zod"
import { ActivityLevel, PrimaryGoal } from "../schema/profile.schema"

export const SetupProfileSchema = z.object({
    weightKg: z.number().min(30).max(300),
    heightCm: z.number().min(100).max(250),
    age: z.number().min(13).max(100),
    biologicalSex: z.enum(['male', 'female', 'other']),
    activityLevel: z.nativeEnum(ActivityLevel),
    primaryGoal: z.nativeEnum(PrimaryGoal),
    stressLevel: z.number().min(0).max(10).optional().default(5),
    trainsRegularly: z.boolean().optional().default(false),
    livesInHotClimate: z.boolean().optional().default(false),
})

export const UpdateProfileSchema = SetupProfileSchema.partial()

export class SetupProfileDto extends createZodDto(SetupProfileSchema) { }
export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) { }
