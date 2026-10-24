import { client } from "./api";
import { toApiError } from "./http";
import type { WeightData, WeightMutationResult } from "../types/weight";

export const weightService = {
    // Pesagens do período + resumo (GET /weight). Sem `from` = desde a primeira pesagem.
    async getWeight(from?: string): Promise<WeightData> {
        const { data, error, response } = await client.GET('/weight', {
            params: { query: from ? { from } : {} },
        })
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar o diário de peso')
        }
        return data
    },

    // Cria ou substitui o peso do dia (PUT /weight/:date). Se for o mais recente, o perfil e as metas mudam.
    async putWeight(date: string, weightKg: number): Promise<WeightMutationResult> {
        const { data, error, response } = await client.PUT('/weight/{date}', {
            params: { path: { date } },
            body: { weightKg },
        })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível registrar o peso')
        }
        return data
    },

    // Apaga o peso do dia (DELETE /weight/:date). Se era o mais recente, o perfil volta para o anterior.
    async deleteWeight(date: string): Promise<WeightMutationResult> {
        const { data, error, response } = await client.DELETE('/weight/{date}', {
            params: { path: { date } },
        })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível apagar o peso')
        }
        return data
    },
}
