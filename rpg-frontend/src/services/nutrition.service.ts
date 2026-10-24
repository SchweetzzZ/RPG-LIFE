import { client } from "./api";
import { toApiError } from "./http";
import type { FoodResult } from "../types/free-meal";
import type {
    CopiedLogs,
    CreateFavoriteInput,
    CreateFoodLogInput,
    DailySummary,
    FavoriteFood,
    FoodLog,
    MealType,
    RecentFood,
    SavedMeal,
} from "../types/nutrition";

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

    // Copia uma refeição de outro dia para hoje (POST /nutrition/log/copy)
    async copyMeal(fromDate: string, mealType: MealType, toMealType?: MealType): Promise<CopiedLogs> {
        const { data, error, response } = await client.POST('/nutrition/log/copy', {
            body: { fromDate, mealType, ...(toMealType ? { toMealType } : {}) },
        })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível copiar a refeição')
        }
        return data
    },

    // Alimentos mais usados nos últimos 30 dias (GET /nutrition/recent)
    async recent(): Promise<RecentFood[]> {
        const { data, error, response } = await client.GET('/nutrition/recent')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar os recentes')
        }
        return data
    },

    async favorites(): Promise<FavoriteFood[]> {
        const { data, error, response } = await client.GET('/nutrition/favorites')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar os favoritos')
        }
        return data
    },

    async addFavorite(body: CreateFavoriteInput): Promise<FavoriteFood> {
        const { data, error, response } = await client.POST('/nutrition/favorites', { body })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível favoritar')
        }
        return data
    },

    async removeFavorite(favoriteId: string): Promise<void> {
        const { data, error, response } = await client.DELETE('/nutrition/favorites/{id}', { params: { path: { id: favoriteId } } })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível remover o favorito')
        }
    },

    // Refeições prontas
    async savedMeals(): Promise<SavedMeal[]> {
        const { data, error, response } = await client.GET('/nutrition/saved-meals')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar as refeições prontas')
        }
        return data
    },

    async saveMeal(name: string, fromDate: string, mealType: MealType): Promise<SavedMeal> {
        const { data, error, response } = await client.POST('/nutrition/saved-meals', { body: { name, fromDate, mealType } })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível salvar a refeição')
        }
        return data
    },

    async deleteSavedMeal(id: string): Promise<void> {
        const { data, error, response } = await client.DELETE('/nutrition/saved-meals/{id}', { params: { path: { id } } })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível remover a refeição pronta')
        }
    },

    async logSavedMeal(id: string, mealType: MealType): Promise<CopiedLogs> {
        const { data, error, response } = await client.POST('/nutrition/saved-meals/{id}/log', {
            params: { path: { id } },
            body: { mealType },
        })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível registrar a refeição pronta')
        }
        return data
    },
}
