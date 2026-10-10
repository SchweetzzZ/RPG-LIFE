import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD');

// ── Entrada ──────────────────────────────────────────────────────────────────

export const CloseDaySchema = z.object({
    // Sem data = hoje. So aceita hoje ou ontem (no fuso do usuario).
    date: dateSchema.optional(),
});

export const DayParamSchema = z.object({
    date: dateSchema,
});

export class CloseDayDto extends createZodDto(CloseDaySchema) { }
export class DayParamDto extends createZodDto(DayParamSchema) { }

// ── Resposta ─────────────────────────────────────────────────────────────────

export const DayStatusSchema = z.enum(['open', 'closed']);

export const DayStateResponseSchema = z.object({
    date: z.string(),
    today: z.string(),
    status: DayStatusSchema,
    canClose: z.boolean(),
    // Por que nao da para fechar (null quando da)
    closeBlockedReason: z.string().nullable(),

    bmr: z.number(),
    baseKcal: z.number(),
    workoutKcal: z.number(),
    stepsKcal: z.number(),
    steps: z.number(),
    activeKcal: z.number(),
    targetKcal: z.number(),
    consumedKcal: z.number(),
    // Meta - Consumido (negativo = passou da meta)
    remainingKcal: z.number(),
    foodLogsCount: z.number(),
    macros: z.object({
        proteinGrams: z.number(),
        carbGrams: z.number(),
        fatGrams: z.number(),
    }),

    // Dia fechado: o que de fato aconteceu. Dia aberto: previsao "se fechar agora".
    savedKcal: z.number(),
    overflowKcal: z.number(),
    vaultDebitKcal: z.number(),
    closedAt: z.string().nullable(),
});

export const DayCloseResponseSchema = z.object({
    day: DayStateResponseSchema,
    // true = o dia ja estava fechado; nada foi pago de novo
    alreadyClosed: z.boolean(),
    rewards: z.object({
        coins: z.number(),
        xp: z.number(),
        leveledUp: z.boolean(),
    }),
    streak: z.object({
        current: z.number(),
        best: z.number(),
    }),
    // Saldo do cofre do ciclo atual depois do fechamento
    vaultBalanceKcal: z.number(),
    // Alerta neutro quando o dia passou da meta (null se nao passou)
    alert: z.string().nullable(),
    // Aviso quando o dia era de um ciclo ja encerrado (null no caso normal)
    notice: z.string().nullable(),
});

export type DayStateResponse = z.infer<typeof DayStateResponseSchema>;
export type DayCloseResponse = z.infer<typeof DayCloseResponseSchema>;

export class DayStateResponseDto extends createZodDto(DayStateResponseSchema) { }
export class DayCloseResponseDto extends createZodDto(DayCloseResponseSchema) { }
