import type { Progression } from '../../types/workout';

export type ProgressionMetric = 'estimated1Rm' | 'maxWeight' | 'volume';
export type ProgressionPeriod = 30 | 90 | 'all';

export const METRICS: { value: ProgressionMetric; label: string }[] = [
  { value: 'maxWeight', label: 'Carga máxima' },
  { value: 'estimated1Rm', label: '1RM estimado' },
  { value: 'volume', label: 'Volume' },
];

export const PERIODS: { value: ProgressionPeriod; label: string }[] = [
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
  { value: 'all', label: 'Tudo' },
];

export interface SeriesPoint {
  /** Dia da sessão, 'YYYY-MM-DD'. */
  date: string;
  value: number;
  /** Só na carga máxima: repetições da melhor série com essa carga (mostra o progresso de reps). */
  reps?: number;
}

type HistoryEntry = Progression['history'][number];

/** Mais repetições feitas com `weightKg` nas séries válidas (aquecimento não conta). */
function repsAtWeight(entry: HistoryEntry, weightKg: number): number {
  return entry.sets
    .filter((s) => s.technique !== 'warmup' && s.weightKg === weightKg)
    .reduce((best, s) => Math.max(best, s.reps), 0);
}

function metricValue(entry: HistoryEntry, metric: ProgressionMetric): number {
  if (metric === 'estimated1Rm') return entry.estimated1RmKg;
  if (metric === 'maxWeight') return entry.maxWeightKg;
  return entry.totalVolumeKg;
}

/** Dias entre duas datas 'YYYY-MM-DD', sem passar pelo fuso do navegador. */
function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/**
 * Uma série por dia: dois treinos no mesmo dia viram um único ponto, o melhor da métrica.
 * Ordenada por data. O período conta a partir do último treino do exercício (não do relógio do navegador).
 */
export function buildSeries(
  history: Progression['history'],
  metric: ProgressionMetric,
  period: ProgressionPeriod,
): SeriesPoint[] {
  const bestByDay = new Map<string, SeriesPoint>();
  for (const entry of history) {
    const value = metricValue(entry, metric);
    const reps = metric === 'maxWeight' ? repsAtWeight(entry, value) : undefined;
    const current = bestByDay.get(entry.date);
    // Mesma carga no mesmo dia: vale a sessão com mais repetições
    const better =
      current === undefined || value > current.value || (value === current.value && (reps ?? 0) > (current.reps ?? 0));
    if (better) bestByDay.set(entry.date, { date: entry.date, value, reps });
  }
  const all = [...bestByDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (period === 'all' || all.length === 0) return all;
  const latest = all[all.length - 1].date;
  return all.filter((p) => daysBetween(p.date, latest) < period);
}
