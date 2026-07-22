import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

export const StatTypeEnum = z.enum([
    'strength',
    'intelligence',
    'vitality',
    'focus',
])

const addXpAndCoinSchema = z.object({
    userId: z.string(),
    xpGained: z.number().min(0),
    coinsGained: z.number().min(0),
    statBonus: z.object({ stat: StatTypeEnum, amount: z.number().min(0) }).optional()
})

export class AddXpAndCoinDto extends createZodDto(addXpAndCoinSchema) { }