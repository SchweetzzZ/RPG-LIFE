import { useResource, type Resource } from './useResource';
import { dashboardService } from '../services/dashboard.service';
import { dayService } from '../services/day.service';
import { freeMealService } from '../services/free-meal.service';
import { vaultService } from '../services/vault.service';
import { weightService } from '../services/weight.service';
import { summaryService } from '../services/summary.service';
import { missingProfileFields } from '../lib/profileCompleteness';
import type { UserMeResponse } from '../types/dashboard';
import type { DayState } from '../types/day';
import type { NextFreeMeals } from '../types/free-meal';
import type { Vault } from '../types/vault';
import type { WeightSummary } from '../types/weight';
import type { WeekSummaryStatus } from '../types/summary';

export interface HubData {
  me: UserMeResponse;
  next: NextFreeMeals;
  vault: Vault;
  /** null quando o perfil físico está incompleto (o /day não é chamado). */
  day: DayState | null;
  /** Nomes, em português, dos campos do perfil que faltam. */
  missingProfile: string[];
  /** Último peso, se já pesou hoje e a variação da semana. */
  weight: WeightSummary;
  /** Se o resumo da semana passada deve abrir sozinho. */
  weekStatus: WeekSummaryStatus;
}

async function loadHub(): Promise<HubData> {
  const [me, next, vault, weekStatus] = await Promise.all([
    dashboardService.getHunterProfile(),
    freeMealService.getNext(),
    vaultService.getVault(),
    summaryService.getStatus(),
  ]);
  // "Hoje" vem do servidor (fuso do usuário), nunca do relógio do navegador.
  // Só o resumo do peso interessa aqui: pede as pesagens a partir de hoje (no máximo 1).
  const weightPromise = weightService.getWeight(next.today).then((w) => w.summary);

  // Sem perfil físico completo o GET /day/:date devolve 400: nem chama, o Hub pede para completar o perfil.
  const missingProfile = missingProfileFields(me.profile);
  if (missingProfile.length > 0) {
    return { me, next, vault, day: null, missingProfile, weight: await weightPromise, weekStatus };
  }
  const [day, weight] = await Promise.all([dayService.getDay(next.today), weightPromise]);
  return { me, next, vault, day, missingProfile, weight, weekStatus };
}

export function useHubData(): Resource<HubData> {
  return useResource(loadHub);
}
