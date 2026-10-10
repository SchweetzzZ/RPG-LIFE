// Regras da refeicao livre (funcoes puras, sem banco). PLANO_PROXIMOS_LOTES.md, secoes 7.2 e 7.5.
//
//   ready (semana) = saldo do cofre >= kcal estimadas
//   ready (dia)    = sobra de hoje (Meta do dia - Consumido ate agora) >= kcal estimadas
//   canBuy         = ready E saldo de moedas >= ticket
//   Resgate        = cofre debita min(comido, estimado); comer MAIS so registra exceededKcal (nada extra e cobrado)
//
// Sem limite de vagas: agendar so PLANEJA (nada e cobrado nem reservado ate o resgate). Cada refeicao ativa
// e avaliada individualmente contra o saldo ATUAL; o que falta para realizar TODAS e o ACUMULADO (ver abaixo).

import { addDays, daysBetween } from '../common/utils/user-date';

/** Limites de validacao (usados tambem pelos DTOs). */
export const FREE_MEAL_LIMITS = {
    MAX_ITEMS: 40,
    MAX_ITEM_KCAL_PER_UNIT: 5000,
    MAX_ITEM_QTY: 100,
    MAX_MEAL_KCAL: 20000,
} as const;

/** Limite de sanidade: refeicoes ativas (planned/ready) por escopo e por usuario. */
export const MAX_ACTIVE_FREE_MEALS_PER_SCOPE = 10;

/** Abaixo desta fracao do estimado, a previsao recomenda adiar a refeicao. */
export const POSTPONE_PROJECTION_RATIO = 0.5;

export type FreeMealPreset = 'light' | 'medium' | 'heavy';

export interface KcalItem {
    kcalPerUnit: number;
    qty: number;
}

/** Kcal de um item (arredondado). */
export function itemKcal(item: KcalItem): number {
    return Math.round(item.kcalPerUnit * item.qty);
}

/** Kcal total de uma lista de itens (soma sem arredondar cada item, arredonda no fim). */
export function itemsKcal(items: KcalItem[]): number {
    return Math.round(items.reduce((acc, i) => acc + i.kcalPerUnit * i.qty, 0));
}

export interface TemplateItemLike {
    key: string;
    kcalPerUnit: number;
    defaultQty: number;
}

/** Kcal de um conjunto de quantidades por `key` sobre os itens do template. */
export function quantitiesKcal(items: TemplateItemLike[], quantities: Record<string, number>): number {
    return itemsKcal(items.map((i) => ({ kcalPerUnit: i.kcalPerUnit, qty: quantities[i.key] ?? 0 })));
}

/**
 * Quantidades finais ao montar a partir de um template:
 * ponto de partida = preset escolhido (ou `defaultQty` de cada item), depois as quantidades
 * enviadas pelo usuario sobrescrevem item a item. Chaves que nao existem no template voltam em `unknownKeys`.
 */
export function resolveTemplateQuantities(
    items: TemplateItemLike[],
    presets: Record<FreeMealPreset, Record<string, number>>,
    preset?: FreeMealPreset,
    overrides?: Record<string, number>,
): { quantities: Record<string, number>; unknownKeys: string[] } {
    const keys = new Set(items.map((i) => i.key));
    const quantities: Record<string, number> = {};
    for (const item of items) {
        quantities[item.key] = preset ? (presets[preset][item.key] ?? 0) : item.defaultQty;
    }
    const unknownKeys: string[] = [];
    for (const [key, qty] of Object.entries(overrides ?? {})) {
        if (!keys.has(key)) {
            unknownKeys.push(key);
            continue;
        }
        quantities[key] = qty;
    }
    return { quantities, unknownKeys };
}

export interface BuyCheck {
    ready: boolean;
    canBuy: boolean;
    missingKcal: number;
    missingCoins: number;
}

/** Duas metas: kcal disponiveis (cofre ou sobra do dia) e moedas para o ticket. */
export function checkBuy(input: {
    availableKcal: number;
    estimatedKcal: number;
    coinBalance: number;
    ticketCost: number;
}): BuyCheck {
    const missingKcal = Math.max(0, Math.round(input.estimatedKcal - input.availableKcal));
    const missingCoins = Math.max(0, input.ticketCost - input.coinBalance);
    const ready = missingKcal === 0;
    return { ready, canBuy: ready && missingCoins === 0, missingKcal, missingCoins };
}

/**
 * Valores do resgate.
 * Cofre: debita min(comido, estimado). Comeu menos: a diferenca fica no cofre.
 * Comeu mais: nada extra e debitado; `exceededKcal` so informa quanto passou (decisao do usuario).
 */
export function redeemAmounts(estimatedKcal: number, actualKcal: number | null): {
    vaultDebitKcal: number;
    exceededKcal: number;
} {
    const eaten = actualKcal ?? estimatedKcal;
    return {
        vaultDebitKcal: Math.max(0, Math.min(eaten, estimatedKcal)),
        exceededKcal: Math.max(0, eaten - estimatedKcal),
    };
}

/** Texto neutro quando a refeicao passou do estimado (sem culpa, sem perda). */
export function exceededNotice(exceededKcal: number): string | null {
    if (exceededKcal <= 0) return null;
    return `Você comeu ${exceededKcal} kcal a mais do que o planejado. Fica registrado; nada extra foi descontado.`;
}

/**
 * Dias que ainda podem render kcal antes da refeicao: de hoje ate a vespera.
 * (O dia da refeicao fecha depois dela, entao nao ajuda a paga-la.)
 */
export function savingDaysLeft(today: string, scheduledFor: string): number {
    return Math.max(0, daysBetween(today, scheduledFor));
}

/** Quanto guardar por dia ate a data. null = nao ha mais dias para guardar e ainda falta kcal. */
export function perDayKcal(neededKcal: number, daysLeft: number): number | null {
    if (neededKcal <= 0) return 0;
    if (daysLeft <= 0) return null;
    return Math.ceil(neededKcal / daysLeft);
}

/** Datas do inicio do ciclo ate ontem (dias que ja deveriam estar fechados). */
export function cycleDaysBefore(startDate: string, today: string): string[] {
    const dates: string[] = [];
    for (let d = startDate; d < today; d = addDays(d, 1)) {
        dates.push(d);
    }
    return dates;
}

export interface ClosedDayInfo {
    date: string;
    /** Fechado com pelo menos uma refeicao registrada. */
    counts: boolean;
    /** O que o dia rendeu de fato para o cofre (guardado - excedente debitado). */
    netVaultKcal: number;
}

/** Dias do ciclo (ate ontem) sem fechamento ou fechados sem refeicao registrada. */
export function missingCycleDays(expected: string[], closes: ClosedDayInfo[]): string[] {
    const ok = new Set(closes.filter((c) => c.counts).map((c) => c.date));
    return expected.filter((d) => !ok.has(d));
}

/**
 * Previsao de kcal no cofre no dia da refeicao: saldo atual + media do que cada dia fechado
 * do ciclo rendeu ate aqui x dias que ainda faltam. So existe quando todos os dias do ciclo ate
 * ontem estao fechados e ha pelo menos um dia fechado para tirar a media (na segunda-feira: null).
 */
export function projectVaultKcal(input: {
    balanceKcal: number;
    closes: ClosedDayInfo[];
    missingDays: number;
    daysLeft: number;
}): number | null {
    if (input.missingDays > 0) return null;
    const counted = input.closes.filter((c) => c.counts);
    if (counted.length === 0) return null;
    const avg = counted.reduce((acc, c) => acc + c.netVaultKcal, 0) / counted.length;
    return Math.round(input.balanceKcal + Math.max(0, avg) * input.daysLeft);
}

export type PostponeCode = 'missing_days' | 'low_projection';

/** Sugestao de deixar para a proxima semana (nunca bloqueia nada). */
export function postponeAdvice(input: {
    ready: boolean;
    missingDays: number;
    projectedKcal: number | null;
    estimatedKcal: number;
}): { recommendPostpone: boolean; postponeCode: PostponeCode | null; postponeReason: string | null } {
    const none = { recommendPostpone: false, postponeCode: null, postponeReason: null };
    if (input.ready) return none;
    if (input.missingDays > 0) {
        const dias = input.missingDays === 1 ? '1 dia' : `${input.missingDays} dias`;
        return {
            recommendPostpone: true,
            postponeCode: 'missing_days',
            postponeReason: `Há ${dias} desta semana sem registro ou sem fechamento. Recomendamos deixar essa refeição para a próxima semana.`,
        };
    }
    if (input.projectedKcal !== null && input.projectedKcal < input.estimatedKcal * POSTPONE_PROJECTION_RATIO) {
        return {
            recommendPostpone: true,
            postponeCode: 'low_projection',
            postponeReason: `No ritmo atual, a previsão é de ${input.projectedKcal} kcal no cofre até a data, menos da metade do estimado (${input.estimatedKcal} kcal). Recomendamos deixar essa refeição para a próxima semana.`,
        };
    }
    return none;
}

// ── Varias refeicoes ativas ──────────────────────────────────────────────────

/** Ordem das refeicoes ativas: data agendada e, em empate, ordem de criacao (a 1a domina o Hub). */
export function compareByScheduled<T extends { scheduledFor: string; createdAt: Date }>(a: T, b: T): number {
    if (a.scheduledFor !== b.scheduledFor) return a.scheduledFor < b.scheduledFor ? -1 : 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
}

/**
 * Acumulado em ordem (data, depois criacao): estimado dela + estimados das anteriores.
 * O que falta acumulado = max(0, acumulado - kcal disponiveis). Para a 1a da lista e igual ao individual.
 * Usado por perDayKcal, projectedKcal e recommendPostpone das refeicoes seguintes.
 */
export function accumulatedKcal(estimated: number[], availableKcal: number): { accumulated: number; needed: number }[] {
    let sum = 0;
    return estimated.map((e) => {
        sum += e;
        return { accumulated: sum, needed: Math.max(0, Math.round(sum - availableKcal)) };
    });
}

/** Kcal que as refeicoes do dia JA resgatadas hoje usaram da sobra: min(comido, estimado) de cada uma. */
export function redeemedDayUsage(meals: { estimatedKcal: number; actualKcal: number | null }[]): number {
    return meals.reduce((acc, m) => acc + Math.min(m.actualKcal ?? m.estimatedKcal, m.estimatedKcal), 0);
}

/** Sobra de hoje disponivel = max(0, (Meta - Consumido) - o que as day resgatadas hoje ja usaram). */
export function dayAvailableKcal(rawSurplusKcal: number, usedByRedeemedKcal: number): number {
    return Math.max(0, Math.round(rawSurplusKcal - usedByRedeemedKcal));
}

export interface ScopeTotals {
    count: number;
    totalEstimatedKcal: number;
    totalNeededKcal: number;
    totalNeededCoins: number;
}

/**
 * Totais do escopo para realizar TODAS as ativas:
 *   totalNeededKcal   = max(0, soma dos estimados - kcal disponiveis)
 *   totalNeededCoins  = max(0, soma dos tickets - saldo de moedas)
 * (semana: disponiveis = saldo do cofre; dia: sobra de hoje ja descontada das day resgatadas).
 */
export function scopeTotals(input: {
    estimated: number[];
    tickets: number[];
    availableKcal: number;
    coinBalance: number;
}): ScopeTotals {
    const totalEstimatedKcal = input.estimated.reduce((a, b) => a + b, 0);
    const totalTickets = input.tickets.reduce((a, b) => a + b, 0);
    return {
        count: input.estimated.length,
        totalEstimatedKcal,
        totalNeededKcal: Math.max(0, Math.round(totalEstimatedKcal - input.availableKcal)),
        totalNeededCoins: Math.max(0, totalTickets - input.coinBalance),
    };
}
