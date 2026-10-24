import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PrimaryGoal } from '../../profile/schema/profile.schema';
import { FreeMealScope } from '../../free-meal/schema/free-meal.schema';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD');

// ── Entrada ──────────────────────────────────────────────────────────────────

export const WeekSummaryQuerySchema = z.object({
    // Segunda-feira da semana. Sem `start` = a semana passada (a ultima que terminou).
    start: dateSchema.optional(),
});

export const MarkWeekSeenSchema = z.object({
    start: dateSchema,
});

export class WeekSummaryQueryDto extends createZodDto(WeekSummaryQuerySchema) { }
export class MarkWeekSeenDto extends createZodDto(MarkWeekSeenSchema) { }

// ── Resposta ─────────────────────────────────────────────────────────────────

export const WeekSummaryResponseSchema = z.object({
    start: z.string(), // segunda
    end: z.string(),   // domingo
    today: z.string(),
    // true = a semana ainda nao acabou (resumo parcial)
    inProgress: z.boolean(),
    days: z.object({
        closed: z.number(),
        // Dias fechados com ao menos uma refeicao (os que contam para a sequencia)
        withMeals: z.number(),
        // Dias da semana ja vividos (7 numa semana encerrada)
        total: z.number(),
    }),
    vault: z.object({
        savedKcal: z.number(),      // guardado nos dias fechados
        overflowKcal: z.number(),   // saiu do cofre por excesso
        redeemedKcal: z.number(),   // usado na refeicao livre da semana
        expiredKcal: z.number(),    // sobrou e zerou na segunda
    }),
    freeMeals: z.array(z.object({
        id: z.string(),
        title: z.string(),
        scope: z.nativeEnum(FreeMealScope),
        date: z.string(),
        kcal: z.number(),
    })),
    workouts: z.object({
        count: z.number(),
        records: z.array(z.object({
            exerciseName: z.string(),
            previousBestKg: z.number(),
            bestKg: z.number(),
        })),
    }),
    rewards: z.object({
        coins: z.number(),
        xp: z.number(),
    }),
    streak: z.object({
        current: z.number(),
        best: z.number(),
    }),
    weight: z.object({
        // Pesagens dentro da semana
        entries: z.number(),
        // Variacao na semana (null sem pesagem suficiente)
        changeKg: z.number().nullable(),
        // Ultimo peso da semana
        endKg: z.number().nullable(),
        primaryGoal: z.nativeEnum(PrimaryGoal).nullable(),
        targetWeightKg: z.number().nullable(),
        // Distancia do ultimo peso da semana ate a meta (null sem meta ou sem pesagem na semana)
        remainingKg: z.number().nullable(),
        // O ultimo peso da semana alcanca a meta (inicio = primeira pesagem de todas)
        reachedTarget: z.boolean(),
    }),
});

export const WeekSummaryStatusResponseSchema = z.object({
    // true = mostrar o resumo da semana passada agora (ainda nao visto e houve atividade)
    pending: z.boolean(),
    // Segunda da semana passada
    start: z.string(),
    // false = a semana passada nao teve nada (o link "Ver semana passada" pode ficar escondido)
    hasActivity: z.boolean(),
});

export const MarkWeekSeenResponseSchema = z.object({
    lastWeeklySummarySeen: z.string(),
});

export type WeekSummaryResponse = z.infer<typeof WeekSummaryResponseSchema>;

export class WeekSummaryResponseDto extends createZodDto(WeekSummaryResponseSchema) { }
export class WeekSummaryStatusResponseDto extends createZodDto(WeekSummaryStatusResponseSchema) { }
export class MarkWeekSeenResponseDto extends createZodDto(MarkWeekSeenResponseSchema) { }
