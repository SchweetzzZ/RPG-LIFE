import { client } from "./api";
import type { UserMeResponse, EnergyDailySummaryResponse, WeeklyBudgetResponse }
    from "../types/dashboard";

export const dashboardService = {
    // Busca dados do Caçador (GET /user/me)
    async getHunterProfile(): Promise<UserMeResponse> {
        const { data, error } = await client.GET('/user/me')
        if (error || !data) {
            throw new Error('Falha ao buscar perfil do caçador')
        }
        return data
    },

    async getEnergyDaily(): Promise<EnergyDailySummaryResponse> {
        const { error, data } = await client.GET('/energy/daily-summary')
        if (error || !data) {
            throw new Error('Falha ao buscar resumo calórico diário')
        }
        return data
    },

    async getWeeklyBuget(): Promise<WeeklyBudgetResponse> {
        const { error, data } = await client.GET('/energy/weekly-budget')
        if (error || !data) {
            throw new Error('Falha ao buscar cofre calórico')
        }
        return data
    }

}