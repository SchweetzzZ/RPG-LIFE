import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CoinReason } from '../schema/coin-entry.schema';

export const CoinEntryResponseSchema = z.object({
    id: z.string(),
    amount: z.number(),
    reason: z.nativeEnum(CoinReason),
    refId: z.string().optional(),
    createdAt: z.string(),
});

export const CoinsResponseSchema = z.object({
    balance: z.number(),
    entries: z.array(CoinEntryResponseSchema),
});

export class CoinsResponseDto extends createZodDto(CoinsResponseSchema) { }
