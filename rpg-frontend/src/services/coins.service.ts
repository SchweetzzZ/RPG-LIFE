import { client } from "./api";
import { toApiError } from "./http";
import type { Coins } from "../types/vault";

export const coinsService = {
    // Saldo de moedas e extrato recente (GET /coins)
    async getCoins(): Promise<Coins> {
        const { data, error, response } = await client.GET('/coins')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar as moedas')
        }
        return data
    },
}
