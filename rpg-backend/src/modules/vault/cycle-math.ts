// Regras do ciclo (funcoes puras). Decisao do usuario (10/10/2026):
// o ciclo e a SEMANA FIXA de segunda a domingo, no fuso do usuario.
// Na virada para a segunda-feira, o cofre e as moedas que sobraram zeram.

import { addDays, dayOfWeek, daysBetween } from '../common/utils/user-date';

export const CYCLE_DAYS = 7;

export interface CycleWindow {
    startDate: string; // segunda-feira
    endDate: string;   // domingo
}

/** Semana (segunda a domingo) que contem `date`. */
export function weekWindow(date: string): CycleWindow {
    const daysSinceMonday = (dayOfWeek(date) + 6) % 7; // segunda = 0 ... domingo = 6
    const startDate = addDays(date, -daysSinceMonday);
    return { startDate, endDate: addDays(startDate, CYCLE_DAYS - 1) };
}

/** O ciclo ja terminou? (o domingo inteiro ainda conta como dentro do ciclo) */
export function isCycleExpired(endDate: string, today: string): boolean {
    return today > endDate;
}

export function cycleContains(cycle: CycleWindow, date: string): boolean {
    return date >= cycle.startDate && date <= cycle.endDate;
}

/** Dias restantes contando hoje (no domingo = 1). Nunca negativo. */
export function cycleDaysLeft(endDate: string, today: string): number {
    return Math.max(0, daysBetween(today, endDate) + 1);
}

/**
 * Lancamento que zera um saldo no fim do ciclo (cofre de kcal ou moedas).
 * Devolve o valor NEGATIVO a gravar, ou 0 se nao ha nada a zerar.
 */
export function resetAmount(balance: number): number {
    return balance > 0 ? -balance : 0;
}
