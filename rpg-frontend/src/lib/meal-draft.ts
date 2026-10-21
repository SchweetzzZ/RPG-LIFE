import type { FoodResult, FreeMealItemInput, FreeMealTemplateItem } from '../types/free-meal';
import { formatNumber } from './format';

/** Texto fixo do aviso do diário (decisão do usuário, plano 7.6). */
export const DIARY_NOTICE = 'Não registre esta refeição no diário: ela já está paga.';

export const MAX_ITEM_QTY = 100;

/** Item avulso em edição (ao agendar ou ao registrar o que foi comido de fato). */
export interface ExtraDraft {
  id: string;
  name: string;
  unit: string;
  kcalPerUnit: number;
  qty: number;
  source: FreeMealItemInput['source'];
  /** Macros por unidade (só para mostrar; não vão para a API). Item digitado à mão fica sem. */
  macrosPerUnit?: Macros;
}

/** Proteína, carboidrato e gordura em gramas. */
export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

/** Soma de macros + quantos itens (com quantidade) entraram na soma e quantos ficaram de fora por não ter macros. */
export interface MacroTotals extends Macros {
  counted: number;
  missing: number;
}

/** Uma linha para somar macros: macros por unidade (null = sem dado) x quantidade. */
export interface MacroLine {
  qty: number;
  macros: Macros | null;
}

let draftCounter = 0;
export function newDraftId(): string {
  draftCounter += 1;
  return `extra-${draftCounter}`;
}

/** Itens em "100 g" aceitam meia porção; os demais andam de 1 em 1. */
export function stepFor(unit: string): number {
  return unit.startsWith('100 g') ? 0.5 : 1;
}

export function roundQty(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sumKcal(items: { kcalPerUnit: number; qty: number }[]): number {
  return Math.round(items.reduce((total, item) => total + item.kcalPerUnit * item.qty, 0));
}

export function sumMacros(lines: MacroLine[]): MacroTotals {
  const totals: MacroTotals = { protein: 0, carbs: 0, fat: 0, counted: 0, missing: 0 };
  for (const line of lines) {
    if (line.qty <= 0) continue;
    if (!line.macros) {
      totals.missing += 1;
      continue;
    }
    totals.counted += 1;
    totals.protein += line.macros.protein * line.qty;
    totals.carbs += line.macros.carbs * line.qty;
    totals.fat += line.macros.fat * line.qty;
  }
  return totals;
}

/** Macros multiplicados pela quantidade (subtotal de uma linha). */
export function scaleMacros(macros: Macros, qty: number): Macros {
  return { protein: macros.protein * qty, carbs: macros.carbs * qty, fat: macros.fat * qty };
}

/**
 * Macros de um item do catálogo. Tudo zerado com kcal > 0 = template gravado antes dos macros
 * (falta rodar o seed de novo): conta como "sem macros" em vez de mostrar 0 g.
 */
export function templateItemMacros(item: FreeMealTemplateItem): Macros | null {
  const { proteinPerUnit: protein, carbPerUnit: carbs, fatPerUnit: fat } = item;
  // Backend antigo (sem os campos) manda undefined: sem isso a conta vira NaN.
  if (!isGrams(protein) || !isGrams(carbs) || !isGrams(fat)) return null;
  if (protein + carbs + fat === 0 && item.kcalPerUnit > 0) return null;
  return { protein, carbs, fat };
}

function foodMacros(food: FoodResult): Macros | undefined {
  const { protein, carbs, fat } = food.nutrientsPer100g;
  return isGrams(protein) && isGrams(carbs) && isGrams(fat) ? { protein, carbs, fat } : undefined;
}

/** Número de gramas válido (finito e >= 0). */
function isGrams(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Macros em texto curto: "P 18 · C 70 · G 40" (gramas, inteiros). */
export function macrosLabel(macros: Macros): string {
  return `P ${formatNumber(macros.protein)} · C ${formatNumber(macros.carbs)} · G ${formatNumber(macros.fat)}`;
}

/** Itens em "100 g": quantidade em gramas (ou ml, para líquidos). Ex.: 2.5 -> "250 g". Outros: null. */
export function gramsLabel(unit: string, qty: number, liquid = false): string | null {
  if (!unit.startsWith('100 g')) return null;
  return `${formatNumber(qty * 100)} ${liquid ? 'ml' : 'g'}`;
}

/** A nota do item fala em ml (ex.: caldo de cana "100 g equivalem a cerca de 100 ml"): mostra em ml. */
export function isLiquidNote(note: string | null | undefined): boolean {
  return note != null && /\bml\b/.test(note);
}

export function draftToInput(draft: ExtraDraft): FreeMealItemInput {
  return {
    name: draft.name,
    unit: draft.unit,
    kcalPerUnit: draft.kcalPerUnit,
    qty: draft.qty,
    source: draft.source,
  };
}

/** Resultado da busca TACO / Open Food Facts -> item de 100 g (kcal por 100 g, quantidade em porções de 100 g). */
export function draftFromFood(food: FoodResult): ExtraDraft | null {
  const kcalPerUnit = Math.round(food.nutrientsPer100g.calories);
  if (kcalPerUnit <= 0) return null;
  const isTaco = food.source === 'TACO';
  return {
    id: newDraftId(),
    name: food.brand ? `${food.name} (${food.brand})` : food.name,
    unit: '100 g',
    kcalPerUnit,
    qty: 1,
    // Open Food Facts às vezes vem sem algum macro: aí o item fica "sem macros" em vez de virar NaN.
    macrosPerUnit: foodMacros(food),
    source: isTaco
      ? { kind: 'taco', refId: food.id }
      : { kind: 'open_food_facts', refId: food.barcode ?? food.id },
  };
}
