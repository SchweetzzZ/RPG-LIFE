import type { FoodResult, FreeMealItemInput } from '../types/free-meal';

/** Texto fixo do aviso do diário (decisão do usuário, plano 7.6). */
export const DIARY_NOTICE =
  'Esta refeição não conta no seu diário do dia. Se você deixar de comer outra refeição por causa dela, o fechamento do dia vai guardar essa sobra no cofre.';

export const MAX_ITEM_QTY = 100;

/** Item avulso em edição (ao agendar ou ao registrar o que foi comido de fato). */
export interface ExtraDraft {
  id: string;
  name: string;
  unit: string;
  kcalPerUnit: number;
  qty: number;
  source: FreeMealItemInput['source'];
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
    source: isTaco
      ? { kind: 'taco', refId: food.id }
      : { kind: 'open_food_facts', refId: food.barcode ?? food.id },
  };
}
