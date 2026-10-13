// Regras de calculo do treino (puras, sem acesso a banco)

export interface MathSet {
    weightKg: number;
    reps: number;
    technique?: string;
}

/** Aquecimento nao conta para volume, recorde nem 1RM. */
export const isWorkingSet = (s: MathSet): boolean => s.technique !== 'warmup';

/** 1RM estimado pela formula de Epley: peso x (1 + reps/30). Com 1 rep o 1RM e o proprio peso. */
export function estimate1Rm(weightKg: number, reps: number): number {
    if (weightKg <= 0 || reps <= 0) return 0;
    if (reps === 1) return weightKg;
    return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export function best1Rm(sets: MathSet[]): number {
    return sets.filter(isWorkingSet).reduce((best, s) => Math.max(best, estimate1Rm(s.weightKg, s.reps)), 0);
}

export function maxWeight(sets: MathSet[]): number {
    return sets.filter(isWorkingSet).reduce((best, s) => Math.max(best, s.weightKg || 0), 0);
}

export function volumeKg(sets: MathSet[]): number {
    return sets.filter(isWorkingSet).reduce((sum, s) => sum + (s.weightKg || 0) * (s.reps || 0), 0);
}

/** Sem cronometro: ~3 min por serie (execucao + descanso), no minimo 10 e no maximo 120. */
export function estimateDurationMinutes(totalSets: number): number {
    return Math.min(120, Math.max(10, totalSets * 3));
}

/** Chave para comparar nomes de exercicio: sem acento, minuscula e sem espacos nas pontas. */
export function exerciseKey(name: string): string {
    return name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}
