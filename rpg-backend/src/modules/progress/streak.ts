// Sequencia de dias fechados (funcoes puras). PLANO_PROXIMOS_LOTES.md, secao 6.6.
// A sequencia e recalculada a partir dos dias fechados, assim fechar "ontem" com atraso
// reconstitui a sequencia mesmo que hoje ja tenha sido fechado.
// Dia fechado SEM refeicao registrada nao conta: quebra a sequencia (como nao fechar).

import { addDays } from '../common/utils/user-date';

export const STREAK_BONUS_EVERY = 7;

export interface ClosedDay {
    date: string;
    /** false = fechado sem refeicao registrada */
    counts: boolean;
}

/**
 * Tamanho da sequencia que termina no dia fechado mais recente.
 * Se o dia fechado mais recente nao conta (vazio), a sequencia e 0.
 * `closedDays` pode vir em qualquer ordem.
 */
export function computeStreak(closedDays: ClosedDay[]): { currentStreak: number; lastClosedDate: string | null } {
    if (closedDays.length === 0) {
        return { currentStreak: 0, lastClosedDate: null };
    }
    const lastClosedDate = closedDays.map((d) => d.date).sort().at(-1) as string;
    const counted = new Set(closedDays.filter((d) => d.counts).map((d) => d.date));

    let currentStreak = 0;
    let day = lastClosedDate;
    while (counted.has(day)) {
        currentStreak += 1;
        day = addDays(day, -1);
    }
    return { currentStreak, lastClosedDate };
}

/** Quantos bonus de 7 dias a sequencia nova "atravessou" em relacao a anterior (0 ou mais). */
export function streakBonusesCrossed(previousStreak: number, newStreak: number): number {
    const before = Math.floor(Math.max(0, previousStreak) / STREAK_BONUS_EVERY);
    const after = Math.floor(Math.max(0, newStreak) / STREAK_BONUS_EVERY);
    return Math.max(0, after - before);
}
