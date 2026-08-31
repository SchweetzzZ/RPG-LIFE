import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

export const addXpAndCoinSchema = z.object({
    xpGained: z.number().min(0),
    coinsGained: z.number().min(0),
    category: z.enum(['workout', 'study', 'health', 'habit']).optional(),
    statBonus: z.object({
        stat: z.enum(['strength', 'intelligence', 'vitality', 'focus']),
        amount: z.number().min(1).default(1),
    }).optional(),
});

export class AddXpAndCoinDto extends createZodDto(addXpAndCoinSchema) { }