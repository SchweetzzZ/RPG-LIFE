import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FreeMealCancelReason, FreeMealScope, FreeMealStatus } from '../schema/free-meal.schema';
import { FreeMealItemSourceKind } from '../schema/free-meal-item.schema';
import { FREE_MEAL_LIMITS } from '../free-meal-math';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD');
const PresetSchema = z.enum(['light', 'medium', 'heavy']);
const qtySchema = z.number().positive('A quantidade deve ser maior que zero').max(FREE_MEAL_LIMITS.MAX_ITEM_QTY);

// ── Entrada ──────────────────────────────────────────────────────────────────

// Item avulso: kcal digitada (custom) ou vindo da busca de alimentos do modulo nutricion
// (taco / open_food_facts, com o id ou codigo de barras em refId). No resgate tambem vale
// 'catalog' (o usuario ajusta as quantidades dos itens do template).
const ItemSourceInputSchema = z
    .object({
        kind: z.nativeEnum(FreeMealItemSourceKind),
        refId: z.string().trim().min(1).max(64).optional(),
    })
    .refine((s) => s.kind === FreeMealItemSourceKind.CUSTOM || s.kind === FreeMealItemSourceKind.CATALOG || !!s.refId, {
        message: 'refId é obrigatório para itens da busca (taco / open_food_facts)',
        path: ['refId'],
    });

export const FreeMealItemInputSchema = z.object({
    key: z.string().trim().min(1).max(64).optional(),
    name: z.string().trim().min(1).max(80),
    unit: z.string().trim().min(1).max(40),
    kcalPerUnit: z
        .number()
        .positive('As kcal por unidade devem ser maiores que zero')
        .max(FREE_MEAL_LIMITS.MAX_ITEM_KCAL_PER_UNIT),
    qty: qtySchema,
    source: ItemSourceInputSchema,
});

export const CreateFreeMealSchema = z
    .object({
        scope: z.nativeEnum(FreeMealScope),
        // Obrigatorio para 'week' (entre hoje e domingo). Para 'day' so pode ser hoje (padrao).
        scheduledFor: dateSchema.optional(),
        // Obrigatorio sem template; com template o padrao e o nome do template
        title: z.string().trim().min(1).max(80).optional(),
        templateSlug: z.string().trim().min(1).max(64).optional(),
        // Atalho leve/media/pesada (so com template). Sem atalho: defaultQty de cada item.
        preset: PresetSchema.optional(),
        // Quantidade por key de item do template (sobrescreve o atalho; 0 tira o item)
        quantities: z.record(z.string(), z.number().min(0).max(FREE_MEAL_LIMITS.MAX_ITEM_QTY)).optional(),
        // Itens avulsos (com ou sem template)
        extraItems: z.array(FreeMealItemInputSchema).max(FREE_MEAL_LIMITS.MAX_ITEMS).optional(),
    })
    .superRefine((v, ctx) => {
        if (v.scope === FreeMealScope.WEEK && !v.scheduledFor) {
            ctx.addIssue({ code: 'custom', path: ['scheduledFor'], message: 'Informe a data da refeição livre da semana' });
        }
        if (!v.templateSlug) {
            if (!v.title) {
                ctx.addIssue({ code: 'custom', path: ['title'], message: 'Informe um título para a refeição personalizada' });
            }
            if (!v.extraItems || v.extraItems.length === 0) {
                ctx.addIssue({ code: 'custom', path: ['extraItems'], message: 'Sem template, informe pelo menos um item' });
            }
            if (v.preset || v.quantities) {
                ctx.addIssue({ code: 'custom', path: ['templateSlug'], message: 'preset e quantities só valem com templateSlug' });
            }
        }
        (v.extraItems ?? []).forEach((item, index) => {
            if (item.source.kind === FreeMealItemSourceKind.CATALOG) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['extraItems', index, 'source', 'kind'],
                    message: 'Itens do catálogo entram pelo templateSlug; avulsos são custom, taco ou open_food_facts',
                });
            }
        });
    });

export const RedeemFreeMealSchema = z.object({
    // O que foi comido de fato. Sem isso, considera o planejado.
    actualItems: z.array(FreeMealItemInputSchema).min(1).max(FREE_MEAL_LIMITS.MAX_ITEMS).optional(),
});

export const FreeMealIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'id inválido'),
});

export class CreateFreeMealDto extends createZodDto(CreateFreeMealSchema) { }
export class RedeemFreeMealDto extends createZodDto(RedeemFreeMealSchema) { }
export class FreeMealIdParamDto extends createZodDto(FreeMealIdParamSchema) { }

export type FreeMealItemInput = z.infer<typeof FreeMealItemInputSchema>;
export type CreateFreeMealInput = z.infer<typeof CreateFreeMealSchema>;

// ── Resposta: catalogo ───────────────────────────────────────────────────────

export const FreeMealTemplateItemResponseSchema = z.object({
    key: z.string(),
    name: z.string(),
    unit: z.string(),
    kcalPerUnit: z.number(),
    defaultQty: z.number(),
    source: z.object({
        name: z.string(),
        url: z.string(),
        accessedAt: z.string(),
        reference: z.string(),
        note: z.string().nullable(),
    }),
});

const PresetResponseSchema = z.object({
    quantities: z.record(z.string(), z.number()),
    kcal: z.number(),
});

export const FreeMealTemplateResponseSchema = z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    category: z.string(),
    icon: z.string(),
    items: z.array(FreeMealTemplateItemResponseSchema),
    presets: z.object({
        light: PresetResponseSchema,
        medium: PresetResponseSchema,
        heavy: PresetResponseSchema,
    }),
    // kcal com as quantidades padrao (defaultQty)
    defaultKcal: z.number(),
});

// ── Resposta: refeicao ───────────────────────────────────────────────────────

export const FreeMealItemResponseSchema = z.object({
    key: z.string().nullable(),
    name: z.string(),
    unit: z.string(),
    kcalPerUnit: z.number(),
    qty: z.number(),
    kcal: z.number(),
    source: z.object({
        kind: z.nativeEnum(FreeMealItemSourceKind),
        refId: z.string().nullable(),
        name: z.string().nullable(),
        url: z.string().nullable(),
        accessedAt: z.string().nullable(),
    }),
});

export const FreeMealResponseSchema = z.object({
    id: z.string(),
    scope: z.nativeEnum(FreeMealScope),
    templateSlug: z.string().nullable(),
    title: z.string(),
    scheduledFor: z.string(),
    plannedItems: z.array(FreeMealItemResponseSchema),
    estimatedKcal: z.number(),
    // null = nao informado no resgate (considerado igual ao planejado)
    actualItems: z.array(FreeMealItemResponseSchema).nullable(),
    actualKcal: z.number().nullable(),
    exceededKcal: z.number().nullable(),
    vaultDebitKcal: z.number().nullable(),
    ticketCost: z.number(),
    cycleId: z.string(),
    status: z.nativeEnum(FreeMealStatus),
    cancelReason: z.nativeEnum(FreeMealCancelReason).nullable(),
    redeemedAt: z.string().nullable(),
    cancelledAt: z.string().nullable(),
    createdAt: z.string(),
});

// Situacao de uma refeicao ativa: o que falta para poder resgatar
export const FreeMealPlanResponseSchema = z.object({
    meal: FreeMealResponseSchema,
    // Semana: saldo do cofre. Dia: sobra de hoje (Meta do dia - Consumido ate agora).
    availableKcal: z.number(),
    // Individual: o que falta para ESTA refeicao, contra o saldo atual
    neededKcal: z.number(),
    neededCoins: z.number(),
    ready: z.boolean(),
    canBuy: z.boolean(),
    // Acumulado na lista (ordem por data e criacao): estimado desta + estimados das anteriores,
    // e o que falta disso contra o saldo (na 1a da lista = individual)
    accumulatedEstimatedKcal: z.number(),
    accumulatedNeededKcal: z.number(),
    // Dias que ainda podem guardar kcal antes da data (de hoje ate a vespera). Dia: 0.
    daysLeft: z.number(),
    // Quanto guardar por dia ate la, sobre o ACUMULADO (null = nao ha mais dias e ainda falta kcal)
    perDayKcal: z.number().nullable(),
    // Previsao do cofre na data (so com todos os dias do ciclo ate ontem fechados); comparada ao ACUMULADO
    projectedKcal: z.number().nullable(),
    recommendPostpone: z.boolean(),
    postponeCode: z.enum(['missing_days', 'low_projection']).nullable(),
    postponeReason: z.string().nullable(),
    // Dias do ciclo ate ontem sem fechamento (ou fechados sem refeicao)
    missingDays: z.array(z.string()),
});

// Para realizar TODAS as ativas do escopo
export const FreeMealTotalsSchema = z.object({
    count: z.number(),
    totalEstimatedKcal: z.number(),
    totalNeededKcal: z.number(),
    totalNeededCoins: z.number(),
});

export const NextFreeMealResponseSchema = z.object({
    today: z.string(),
    cycle: z.object({
        id: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        daysLeft: z.number(),
    }),
    vaultBalanceKcal: z.number(),
    coinBalance: z.number(),
    // Refeicoes da semana ativas (planned/ready), ordenadas por scheduledFor e depois por criacao.
    // A PRIMEIRA da lista domina o Hub.
    week: z.array(FreeMealPlanResponseSchema),
    // Refeicoes do dia ativas para hoje, ordenadas por criacao. A primeira domina o Hub.
    day: z.array(FreeMealPlanResponseSchema),
    totals: z.object({
        week: FreeMealTotalsSchema,
        day: FreeMealTotalsSchema,
    }),
});

export const RedeemFreeMealResponseSchema = z.object({
    meal: FreeMealResponseSchema,
    // true = ja estava resgatada; so completou o que faltava, sem cobrar de novo
    alreadyRedeemed: z.boolean(),
    coinsDebited: z.number(),
    vaultDebitKcal: z.number(),
    exceededKcal: z.number(),
    vaultBalanceKcal: z.number(),
    coinBalance: z.number(),
    // Texto neutro quando comeu mais que o planejado (null se nao)
    notice: z.string().nullable(),
});

export type FreeMealTemplateResponse = z.infer<typeof FreeMealTemplateResponseSchema>;
export type FreeMealItemResponse = z.infer<typeof FreeMealItemResponseSchema>;
export type FreeMealResponse = z.infer<typeof FreeMealResponseSchema>;
export type FreeMealPlanResponse = z.infer<typeof FreeMealPlanResponseSchema>;
export type NextFreeMealResponse = z.infer<typeof NextFreeMealResponseSchema>;
export type RedeemFreeMealResponse = z.infer<typeof RedeemFreeMealResponseSchema>;

export class FreeMealTemplateResponseDto extends createZodDto(FreeMealTemplateResponseSchema) { }
export class FreeMealResponseDto extends createZodDto(FreeMealResponseSchema) { }
export class NextFreeMealResponseDto extends createZodDto(NextFreeMealResponseSchema) { }
export class RedeemFreeMealResponseDto extends createZodDto(RedeemFreeMealResponseSchema) { }
