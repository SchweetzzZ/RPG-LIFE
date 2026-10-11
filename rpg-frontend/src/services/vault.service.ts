import { client } from "./api";
import { toApiError } from "./http";
import type { Vault } from "../types/vault";

export const vaultService = {
    // Cofre de kcal do ciclo atual (GET /vault): saldo, datas do ciclo e extrato
    async getVault(): Promise<Vault> {
        const { data, error, response } = await client.GET('/vault')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar o cofre')
        }
        return data
    },
}
