import { useResource, type Resource } from './useResource';
import { dayService } from '../services/day.service';
import { freeMealService } from '../services/free-meal.service';
import type { DayState } from '../types/day';
import type { FreeMeal, FreeMealTemplate, NextFreeMeals } from '../types/free-meal';

export interface RewardsData {
  next: NextFreeMeals;
  templates: FreeMealTemplate[];
  gallery: FreeMeal[];
  /** Meta e consumido de hoje, para mostrar a refeição do dia dentro do orçamento. null se não der para calcular. */
  day: DayState | null;
}

// Sempre busca o dia: além dos cards de refeição "de hoje", o modal de agendar usa a sobra do dia na barra.
async function loadDay(next: NextFreeMeals): Promise<DayState | null> {
  try {
    return await dayService.getDay(next.today);
  } catch {
    // Perfil incompleto (sem meta): o cartão cai para o texto simples com a sobra.
    return null;
  }
}

async function loadRewards(): Promise<RewardsData> {
  const [next, templates, gallery] = await Promise.all([
    freeMealService.getNext(),
    freeMealService.listTemplates(),
    freeMealService.listGallery(),
  ]);
  const day = await loadDay(next);
  return { next, templates, gallery, day };
}

export function useRewardsData(): Resource<RewardsData> {
  return useResource(loadRewards);
}
