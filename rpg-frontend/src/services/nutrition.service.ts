import { client } from "./api";
import { toApiError } from "./http";
import type { FoodResult } from "../types/free-meal";
import type { CreateFoodLogInput, DailySummary, FoodLog } from "../types/nutrition";

export const nutritionService = {
    // Diário do dia (GET /nutrition/getDailySummary): totais e registros
    async getSummary(date: string): Promise<DailySummary> {
        const { data, error, response } = await client.GET('/nutrition/getDailySummary', { params: { query: { date } } })
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar o diário')
        }
        return data
    },

    // Registra um alimento (POST /nutrition/log)
    async log(body: CreateFoodLogInput): Promise<FoodLog> {
        const { data, error, response } = await client.POST('/nutrition/log', { body })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível registrar o alimento')
        }
        return data
    },

    // Remove um registro (DELETE /nutrition/log/:id)
    async remove(id: string): Promise<void> {
        const { data, error, response } = await client.DELETE('/nutrition/log/{id}', { params: { path: { id } } })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível remover o alimento')
        }
    },

    // Busca por código de barras (GET /nutrition/barcode/:barcode)
    async barcode(barcode: string): Promise<FoodResult> {
        const { data, error, response } = await client.GET('/nutrition/barcode/{barcode}', { params: { path: { barcode } } })
        if (!data) {
            throw toApiError(response, error, 'Produto não encontrado')
        }
        return data
    },
}
