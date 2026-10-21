import type { FreeMeal, FreeMealItem, FreeMealTemplate } from '../types/free-meal';
import { sumKcal, sumMacros, templateItemMacros, type MacroLine, type MacroTotals, type Macros } from './meal-draft';

export interface MealMacros extends MacroTotals {
  kcal: number;
}

/**
 * Macros de um item gravado na refeição. Nada de macro é gravado na refeição: para item do catálogo,
 * busca o item no template (`templateSlug` + `key`); os demais (TACO, Open Food Facts, digitado) ficam sem.
 */
export function savedItemMacros(
  item: FreeMealItem,
  template: FreeMealTemplate | undefined,
): Macros | null {
  if (item.source.kind !== 'catalog' || !template || !item.key) return null;
  const catalogItem = template.items.find((candidate) => candidate.key === item.key);
  return catalogItem ? templateItemMacros(catalogItem) : null;
}

/** kcal + P/C/G de uma refeição agendada ou resgatada, calculados na hora a partir do catálogo. */
export function mealMacros(
  meal: Pick<FreeMeal, 'templateSlug' | 'plannedItems'>,
  templates: FreeMealTemplate[],
  items: FreeMealItem[] = meal.plannedItems,
): MealMacros {
  const template = meal.templateSlug ? templates.find((t) => t.slug === meal.templateSlug) : undefined;
  const lines: MacroLine[] = items.map((item) => ({ qty: item.qty, macros: savedItemMacros(item, template) }));
  return { kcal: sumKcal(items), ...sumMacros(lines) };
}
