import { useResource, type Resource } from './useResource';
import { dashboardService } from '../services/dashboard.service';
import { dayService } from '../services/day.service';
import { freeMealService } from '../services/free-meal.service';
import { nutritionService } from '../services/nutrition.service';
import { missingProfileFields } from '../lib/profileCompleteness';
import type { DayState } from '../types/day';
import type { DailySummary } from '../types/nutrition';

export interface NutritionData {
  summary: DailySummary;
  /** null quando o perfil físico está incompleto (sem meta calculada). */
  day: DayState | null;
}

async function loadNutrition(): Promise<NutritionData> {
  // "Hoje" vem do servidor (fuso do usuário), nunca do relógio do navegador.
  const [me, next] = await Promise.all([dashboardService.getHunterProfile(), freeMealService.getNext()]);
  const complete = missingProfileFields(me.profile).length === 0;
  const [summary, day] = await Promise.all([
    nutritionService.getSummary(next.today),
    complete ? dayService.getDay(next.today) : Promise.resolve(null),
  ]);
  return { summary, day };
}

export function useNutritionData(): Resource<NutritionData> {
  return useResource(loadNutrition);
}
