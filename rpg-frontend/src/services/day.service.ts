import { client } from "./api";
import { toApiError } from "./http";
import type { DayCloseResult, DayState } from "../types/day";

export const dayService = {
    // Estado do dia (GET /day/:date): meta, consumido, o que seria guardado e se dá para fechar
    async getDay(date: string): Promise<DayState> {
        const { data, error, response } = await client.GET('/day/{date}', { params: { path: { date } } })
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar o dia')
        }
        return data
    },

    // Fecha o dia (POST /day/close). Idempotente: fechar de novo devolve o fechamento existente.
    // Sem `date`, fecha hoje (no fuso do usuário).
    async closeDay(date?: string): Promise<DayCloseResult> {
        const { data, error, response } = await client.POST('/day/close', { body: date ? { date } : {} })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível fechar o dia')
        }
        return data
    },
}
