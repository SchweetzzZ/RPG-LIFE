import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CycleStatus } from '../schema/cycle.schema';
import { VaultEntryType } from '../schema/vault-entry.schema';

export const VaultEntryResponseSchema = z.object({
    id: z.string(),
    date: z.string(),
    kcal: z.number(),
    type: z.nativeEnum(VaultEntryType),
    createdAt: z.string(),
});

export const CycleResponseSchema = z.object({
    id: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.nativeEnum(CycleStatus),
    hasFreeMeal: z.boolean(),
});

export const VaultResponseSchema = z.object({
    today: z.string(),
    cycle: CycleResponseSchema.extend({
        daysLeft: z.number(),
    }),
    balanceKcal: z.number(),
    entries: z.array(VaultEntryResponseSchema),
    // Ultimo ciclo fechado e quanto foi zerado nele (o que se perdeu)
    previousCycle: CycleResponseSchema.extend({
        resetKcal: z.number(),
    }).nullable(),
});

export type VaultEntryResponse = z.infer<typeof VaultEntryResponseSchema>;
export type CycleResponse = z.infer<typeof CycleResponseSchema>;

export class VaultResponseDto extends createZodDto(VaultResponseSchema) { }
