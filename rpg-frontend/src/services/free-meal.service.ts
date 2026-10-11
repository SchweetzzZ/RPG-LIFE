import { client } from "./api";
import { toApiError } from "./http";
import type {
    CreateFreeMealInput,
    FoodResult,
    FreeMeal,
    FreeMealTemplate,
    NextFreeMeals,
    RedeemFreeMealInput,
    RedeemFreeMealResult,
} from "../types/free-meal";

export const freeMealService = {
    // Catálogo do montador (GET /free-meal-templates)
    async listTemplates(): Promise<FreeMealTemplate[]> {
        const { data, error, response } = await client.GET('/free-meal-templates')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar o catálogo de refeições')
        }
        return data
    },

    // Refeições ativas e a situação de cada uma contra o saldo de agora (GET /free-meals/next)
    async getNext(): Promise<NextFreeMeals> {
        const { data, error, response } = await client.GET('/free-meals/next')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar as refeições agendadas')
        }
        return data
    },

    // Galeria de conquistas: refeições já resgatadas (GET /free-meals)
    async listGallery(): Promise<FreeMeal[]> {
        const { data, error, response } = await client.GET('/free-meals')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar a galeria')
        }
        return data
    },

    // Agenda uma refeição (POST /free-meals). Só planeja: nada é cobrado até o resgate.
    async create(input: CreateFreeMealInput): Promise<FreeMeal> {
        const { data, error, response } = await client.POST('/free-meals', { body: input })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível agendar a refeição')
        }
        return data
    },

    // Resgata (POST /free-meals/:id/redeem). Falha com 400 se ainda faltam kcal ou moedas.
    async redeem(id: string, input: RedeemFreeMealInput): Promise<RedeemFreeMealResult> {
        const { data, error, response } = await client.POST('/free-meals/{id}/redeem', {
            params: { path: { id } },
            body: input,
        })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível resgatar a refeição')
        }
        return data
    },

    // Cancela uma refeição agendada (DELETE /free-meals/:id)
    async cancel(id: string): Promise<FreeMeal> {
        const { data, error, response } = await client.DELETE('/free-meals/{id}', { params: { path: { id } } })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível cancelar a refeição')
        }
        return data
    },
}

export const foodSearchService = {
    // Busca de alimentos TACO / Open Food Facts (GET /nutrition/search), usada para itens avulsos
    async search(q: string): Promise<FoodResult[]> {
        const { data, error, response } = await client.GET('/nutrition/search', { params: { query: { q } } })
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar alimentos')
        }
        return data
    },
}
