import { useResource, type Resource } from './useResource';
import { dashboardService } from '../services/dashboard.service';
import { dayService } from '../services/day.service';
import { freeMealService } from '../services/free-meal.service';
import { vaultService } from '../services/vault.service';
import { missingProfileFields } from '../lib/profileCompleteness';
import type { UserMeResponse } from '../types/dashboard';
import type { DayState } from '../types/day';
import type { NextFreeMeals } from '../types/free-meal';
import type { Vault } from '../types/vault';

export interface HubData {
  me: UserMeResponse;
  next: NextFreeMeals;
  vault: Vault;
  /** null quando o perfil físico está incompleto (o /day não é chamado). */
  day: DayState | null;
  /** Nomes, em português, dos campos do perfil que faltam. */
  missingProfile: string[];
}

async function loadHub(): Promise<HubData> {
  const [me, next, vault] = await Promise.all([
    dashboardService.getHunterProfile(),
    freeMealService.getNext(),
    vaultService.getVault(),
  ]);
  // Sem perfil físico completo o GET /day/:date devolve 400: nem chama, o Hub pede para completar o perfil.
  const missingProfile = missingProfileFields(me.profile);
  if (missingProfile.length > 0) {
    return { me, next, vault, day: null, missingProfile };
  }
  // "Hoje" vem do servidor (fuso do usuário), nunca do relógio do navegador.
  const day = await dayService.getDay(next.today);
  return { me, next, vault, day, missingProfile };
}

export function useHubData(): Resource<HubData> {
  return useResource(loadHub);
}
