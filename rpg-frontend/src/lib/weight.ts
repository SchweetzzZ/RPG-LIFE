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

/** Abaixo disso (e sem ter chegado), o card mostra "Falta pouco!". */
export const ALMOST_THERE_KG = 1;
/** Com o objetivo Manter, meta a partir desta distância do peso atual gera aviso. */
export const MAINTAIN_CONFLICT_KG = 2;

/**
 * Meta incoerente com o objetivo? Devolve o aviso (discreto, não bloqueia salvar) ou null.
 * Ex.: objetivo Emagrecer com meta acima do peso atual.
 */
export function targetConflict(currentKg: number | null, targetKg: number | null, goal: PrimaryGoal | null): string | null {
  if (currentKg === null || targetKg === null || goal === null) return null;
  if (goal === 'lose_weight' && targetKg > currentKg) {
    return 'Sua meta está acima do peso atual, mas o objetivo é Emagrecer.';
  }
  if (goal === 'gain_muscle' && targetKg < currentKg) {
    return 'Sua meta está abaixo do peso atual, mas o objetivo é Ganhar massa.';
  }
  if (goal === 'maintain' && Math.abs(targetKg - currentKg) >= MAINTAIN_CONFLICT_KG) {
    const suggested = targetKg < currentKg ? 'Emagrecer' : 'Ganhar massa';
    return `Com o objetivo Manter, a dieta não leva até a meta. Para chegar em ${formatKg(targetKg)}, mude o objetivo para ${suggested}.`;
  }
  return null;
}
