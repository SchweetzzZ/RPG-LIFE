// Regras do resumo da semana (F10), funcoes puras.

import { CoinReason } from '../economy/schema/coin-entry.schema';
import { REWARDS, RewardAction } from '../economy/rewards';
import { exerciseKey, maxWeight, MathSet } from '../workout/workout-math';

export interface SummaryWorkoutLog {
    date: string;
    exercises?: { exerciseName?: string; maxWeightKg?: number; sets?: MathSet[] }[];
}

export interface WeekRecord {
    exerciseName: string;
    previousBestKg: number;
    bestKg: number;
}

const bestOf = (ex: { maxWeightKg?: number; sets?: MathSet[] }) =>
    ex.sets && ex.sets.length > 0 ? maxWeight(ex.sets) : ex.maxWeightKg ?? 0;

/**
 * Recordes da semana: exercicio cuja carga maxima na semana passou do melhor valor das semanas
 * anteriores. Exercicio feito pela primeira vez nesta semana nao conta como recorde (nao ha com o que comparar).
 */
export function weekRecords(logs: SummaryWorkoutLog[], start: string, end: string): WeekRecord[] {
    const before = new Map<string, number>();
    const week = new Map<string, { name: string; best: number }>();

    for (const log of logs) {
        if (log.date > end) continue;
        for (const ex of log.exercises ?? []) {
            if (!ex.exerciseName) continue;
            const key = exerciseKey(ex.exerciseName);
            const best = bestOf(ex);
            if (log.date < start) {
                before.set(key, Math.max(before.get(key) ?? 0, best));
            } else {
                const current = week.get(key);
                if (!current || best > current.best) week.set(key, { name: ex.exerciseName, best });
            }
        }
    }

    const records: WeekRecord[] = [];
    for (const [key, { name, best }] of week) {
        const previous = before.get(key);
        if (previous !== undefined && previous > 0 && best > previous) {
            records.push({ exerciseName: name, previousBestKg: previous, bestKg: best });
        }
    }
    return records.sort((a, b) => (b.bestKg - b.previousBestKg) - (a.bestKg - a.previousBestKg));
}

export const REWARD_REASONS = Object.keys(REWARDS) as RewardAction[];

export function isRewardReason(reason: CoinReason): reason is RewardAction {
    return (REWARD_REASONS as CoinReason[]).includes(reason);
}

/** Moedas e XP ganhos nas entradas de recompensa (fechar, treino, passos, bonus de 7 dias). */
export function sumRewards(entries: { amount: number; reason: CoinReason }[]): { coins: number; xp: number } {
    let coins = 0;
    let xp = 0;
    for (const e of entries) {
        if (!isRewardReason(e.reason) || e.amount <= 0) continue;
        coins += e.amount;
        xp += REWARDS[e.reason].xp;
    }
    return { coins, xp };
}
