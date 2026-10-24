// Regras do diario de peso (funcoes puras, sem banco).

import { addDays } from '../common/utils/user-date';

export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 400;
/** Janela da media movel (dias de calendario, contando o proprio dia). */
export const TREND_WINDOW_DAYS = 7;
/** Pesagens minimas dentro da janela para a linha de tendencia aparecer. */
export const TREND_MIN_POINTS = 3;

export interface WeightPoint {
    date: string; // YYYY-MM-DD
    weightKg: number;
}

/** Uma casa decimal (evita 92.39999 na tela e no banco). */
export function roundKg(value: number): number {
    return Math.round(value * 10) / 10;
}

/**
 * Media movel de 7 dias de calendario para cada pesagem (`points` em ordem crescente de data).
 * So existe quando ha 3 ou mais pesagens na janela; senao null.
 */
export function withTrend(points: WeightPoint[]): (WeightPoint & { trendKg: number | null })[] {
    return points.map((p) => {
        const from = addDays(p.date, -(TREND_WINDOW_DAYS - 1));
        const window = points.filter((q) => q.date >= from && q.date <= p.date);
        const trendKg = window.length >= TREND_MIN_POINTS
            ? roundKg(window.reduce((sum, q) => sum + q.weightKg, 0) / window.length)
            : null;
        return { ...p, trendKg };
    });
}

/**
 * Variacao dos ultimos 7 dias: pesagem mais recente menos a referencia, onde a referencia e a
 * ultima pesagem ate 7 dias atras (ou, se nao houver, a primeira dentro da janela).
 * null quando nao da para comparar (so 1 pesagem na janela ou nenhuma pesagem recente).
 */
export function weekChangeKg(points: WeightPoint[], today: string): number | null {
    if (points.length === 0) return null;
    const latest = points[points.length - 1];
    const windowStart = addDays(today, -7);
    if (latest.date < windowStart) return null;

    const before = points.filter((p) => p.date <= windowStart);
    const reference = before.length > 0
        ? before[before.length - 1]
        : points.find((p) => p.date >= windowStart);
    if (!reference || reference.date === latest.date) return null;
    return roundKg(latest.weightKg - reference.weightKg);
}

/** Variacao entre duas datas (inclusive): ultima pesagem do periodo menos a ultima antes dele (ou a 1a do periodo). */
export function changeBetween(points: WeightPoint[], startDate: string, endDate: string): number | null {
    const inPeriod = points.filter((p) => p.date >= startDate && p.date <= endDate);
    if (inPeriod.length === 0) return null;
    const last = inPeriod[inPeriod.length - 1];
    const before = points.filter((p) => p.date < startDate);
    const reference = before.length > 0 ? before[before.length - 1] : inPeriod[0];
    if (reference.date === last.date) return null;
    return roundKg(last.weightKg - reference.weightKg);
}

/**
 * Chegou ao peso-meta? Vale para os dois sentidos: quem comecou acima precisa ficar <= meta,
 * quem comecou abaixo precisa ficar >= meta.
 */
export function reachedTarget(startKg: number, currentKg: number, targetKg: number): boolean {
    if (startKg >= targetKg) return currentKg <= targetKg;
    return currentKg >= targetKg;
}

/**
 * Progresso ate o peso-meta, de 0 a 100 (inteiro). O inicio e a primeira pesagem.
 * Indo para o lado contrario = 0; passou da meta = 100; inicio ja na meta = 100.
 */
export function targetProgress(startKg: number, currentKg: number, targetKg: number): number {
    const total = targetKg - startKg;
    if (total === 0) return 100;
    const done = (currentKg - startKg) / total;
    return Math.round(Math.min(1, Math.max(0, done)) * 100);
}
