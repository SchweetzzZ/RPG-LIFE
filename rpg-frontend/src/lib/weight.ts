import type { PrimaryGoal } from '../types/profile';

/** 92.4 -> "92,4 kg" (sempre uma casa decimal, pt-BR). */
export function formatKg(value: number, withUnit = true): string {
  const text = value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return withUnit ? `${text} kg` : text;
}

/** Variação com sinal: -2.6 -> "−2,6 kg", 0.8 -> "+0,8 kg", 0 -> "0,0 kg". */
export function formatDeltaKg(value: number): string {
  if (value === 0) return formatKg(0);
  return `${value > 0 ? '+' : '−'}${formatKg(Math.abs(value))}`;
}

/**
 * Cor da variação conforme o objetivo do perfil: emagrecer -> descer é verde; ganhar massa -> subir
 * é verde; manter (ou sem objetivo) -> neutra. O sentido contrário fica no tom de alerta suave, nunca vermelho.
 */
export function deltaTone(delta: number | null, goal: PrimaryGoal | null): string {
  if (delta === null || delta === 0 || goal === null || goal === 'maintain') return 'text-ink';
  const good = goal === 'lose_weight' ? delta < 0 : delta > 0;
  return good ? 'text-action' : 'text-xp';
}

/** Texto do campo -> número (aceita vírgula). null se vazio ou inválido. */
export function parseKg(text: string): number | null {
  if (text.trim() === '') return null;
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 400;

export function weightError(value: number | null): string | null {
  if (value === null) return 'Informe o peso.';
  if (value < MIN_WEIGHT_KG || value > MAX_WEIGHT_KG) return `O peso deve ficar entre ${MIN_WEIGHT_KG} e ${MAX_WEIGHT_KG} kg.`;
  return null;
}
