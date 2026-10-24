import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PrimaryGoal } from '../../profile/schema/profile.schema';
import { MAX_WEIGHT_KG, MIN_WEIGHT_KG } from '../weight-math';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD');

// ── Entrada ──────────────────────────────────────────────────────────────────

export const WeightQuerySchema = z.object({
    // Sem `from` = desde a primeira pesagem; sem `to` = ate hoje
    from: dateSchema.optional(),
    to: dateSchema.optional(),
});

export const WeightDateParamSchema = z.object({
    date: dateSchema,
});

export const PutWeightSchema = z.object({
    weightKg: z.number()
        .min(MIN_WEIGHT_KG, `O peso deve ficar entre ${MIN_WEIGHT_KG} e ${MAX_WEIGHT_KG} kg`)
        .max(MAX_WEIGHT_KG, `O peso deve ficar entre ${MIN_WEIGHT_KG} e ${MAX_WEIGHT_KG} kg`),
});

export class WeightQueryDto extends createZodDto(WeightQuerySchema) { }
export class WeightDateParamDto extends createZodDto(WeightDateParamSchema) { }
export class PutWeightDto extends createZodDto(PutWeightSchema) { }

// ── Resposta ─────────────────────────────────────────────────────────────────

export const WeightEntrySchema = z.object({
    date: z.string(),
    weightKg: z.number(),
    // Media movel de 7 dias (null com menos de 3 pesagens na janela)
    trendKg: z.number().nullable(),
});

export const WeightSummarySchema = z.object({
    // Hoje no fuso do usuario
    today: z.string(),
    // Total de pesagens (todas as datas, nao so as do periodo)
    count: z.number(),
    startDate: z.string().nullable(),
    startKg: z.number().nullable(),
    currentDate: z.string().nullable(),
    currentKg: z.number().nullable(),
    // atual - inicio (null com menos de 2 pesagens)
    totalChangeKg: z.number().nullable(),
    // Variacao dos ultimos 7 dias (null quando nao da para comparar)
    weekChangeKg: z.number().nullable(),
    // true = ja pesou hoje
    loggedToday: z.boolean(),
    targetWeightKg: z.number().nullable(),
    // Distancia ate a meta, sempre positiva (null sem meta ou sem pesagem)
    remainingKg: z.number().nullable(),
    reachedTarget: z.boolean(),
    // Objetivo do perfil: decide a cor da variacao no front
    primaryGoal: z.nativeEnum(PrimaryGoal).nullable(),
});

export const WeightResponseSchema = z.object({
    // Pesagens do periodo pedido, da mais antiga para a mais nova
    entries: z.array(WeightEntrySchema),
    summary: WeightSummarySchema,
});

export const WeightMutationResponseSchema = z.object({
    date: z.string(),
    // null depois de apagar
    weightKg: z.number().nullable(),
    // Peso que ficou no perfil (sempre o da pesagem mais recente)
    profileWeightKg: z.number().nullable(),
    // true = o peso do perfil mudou e as metas foram recalculadas (se o perfil estava completo)
    profileUpdated: z.boolean(),
    targetCalories: z.number().nullable(),
});

export type WeightResponse = z.infer<typeof WeightResponseSchema>;
export type WeightMutationResponse = z.infer<typeof WeightMutationResponseSchema>;

export class WeightResponseDto extends createZodDto(WeightResponseSchema) { }
export class WeightMutationResponseDto extends createZodDto(WeightMutationResponseSchema) { }
