import { client } from "./api";
import { toApiError } from "./http";
import type { WeekSummary, WeekSummaryStatus } from "../types/summary";

export const summaryService = {
    // Se o resumo da semana passada deve aparecer agora (GET /summary/week/status)
    async getStatus(): Promise<WeekSummaryStatus> {
        const { data, error, response } = await client.GET('/summary/week/status')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar o resumo da semana')
        }
        return data
    },

    // Resultado da semana (GET /summary/week). Sem `start` = a semana passada.
    async getWeek(start?: string): Promise<WeekSummary> {
        const { data, error, response } = await client.GET('/summary/week', {
            params: { query: start ? { start } : {} },
        })
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar o resumo da semana')
        }
        return data
    },

    // Marca o resumo como visto: não aparece sozinho de novo (POST /summary/week/seen)
    async markSeen(start: string): Promise<void> {
        const { data, error, response } = await client.POST('/summary/week/seen', { body: { start } })
        if (!data) {
            throw toApiError(response, error, 'Falha ao marcar o resumo como visto')
        }
    },
}
