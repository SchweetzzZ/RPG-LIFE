import { client } from "./api";
import { toApiError } from "./http";
import type { UserMeResponse } from "../types/dashboard";

export const dashboardService = {
    // Dados do usuário logado (GET /user/me): perfil, nível/XP/sequência e saldo de moedas
    async getHunterProfile(): Promise<UserMeResponse> {
        const { data, error, response } = await client.GET('/user/me')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar o perfil')
        }
        return data
    },
}
