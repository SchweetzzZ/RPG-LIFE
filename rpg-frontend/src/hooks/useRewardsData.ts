import { useResource, type Resource } from './useResource';
import { freeMealService } from '../services/free-meal.service';
import type { FreeMeal, FreeMealTemplate, NextFreeMeals } from '../types/free-meal';

export interface RewardsData {
  next: NextFreeMeals;
  templates: FreeMealTemplate[];
  gallery: FreeMeal[];
}

async function loadRewards(): Promise<RewardsData> {
  const [next, templates, gallery] = await Promise.all([
    freeMealService.getNext(),
    freeMealService.listTemplates(),
    freeMealService.listGallery(),
  ]);
  return { next, templates, gallery };
}

export function useRewardsData(): Resource<RewardsData> {
  return useResource(loadRewards);
}
