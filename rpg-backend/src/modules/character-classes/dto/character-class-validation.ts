import z from "zod"
import { createZodDto } from "nestjs-zod"

export const CreateCharacterClassSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").trim(),
    description: z.string().min(5, "A descrição deve ter pelo menos 5 caracteres").trim(),
    statsBonus: z.object({
        strength: z.number().default(0),
        intelligence: z.number().default(0),
        vitality: z.number().default(0),
        focus: z.number().default(0),
    }).optional().default({
        strength: 0,
        intelligence: 0,
        vitality: 0,
        focus: 0,
    }),
    xpModifiers: z.object({
        workoutXpMultiplier: z.number().min(1.0).default(1.0),
        studyXpMultiplier: z.number().min(1.0).default(1.0),
        healthXpMultiplier: z.number().min(1.0).default(1.0),
        habitXpMultiplier: z.number().min(1.0).default(1.0),
    }).optional().default({
        workoutXpMultiplier: 1.0,
        studyXpMultiplier: 1.0,
        healthXpMultiplier: 1.0,
        habitXpMultiplier: 1.0,
    }),
    price: z.number().min(0).optional().default(0),
    isActive: z.boolean().optional().default(true),
})
export class CreateCharacterClassDto extends createZodDto(CreateCharacterClassSchema) { }