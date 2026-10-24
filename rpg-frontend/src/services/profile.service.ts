import { client } from "./api";
import { toApiError } from "./http";
import type { NutritionUpdateResult, ProfileData, UpdateProfileInput } from "../types/profile";

export const profileService = {
    // Perfil do usuário (GET /profile): campos do perfil físico ficam null até serem preenchidos
    async getProfile(): Promise<ProfileData> {
        const { data, error, response } = await client.GET('/profile')
        if (!data) {
            throw toApiError(response, error, 'Falha ao buscar o perfil')
        }
        return data
    },

    // Atualiza campos soltos do perfil (PATCH /profile), ex.: o peso-meta. Não recalcula as metas.
    async updateProfile(body: UpdateProfileInput): Promise<ProfileData> {
        const { data, error, response } = await client.PATCH('/profile', { body })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível salvar o perfil')
        }
        return data
    },

    // Salva o perfil físico e recalcula as metas (PATCH /profile/nutrition).
    // É o que destrava o GET /day/:date, que exige os 6 campos do perfil físico.
    async saveNutritionProfile(body: UpdateProfileInput): Promise<NutritionUpdateResult> {
        const { data, error, response } = await client.PATCH('/profile/nutrition', { body })
        if (!data) {
            throw toApiError(response, error, 'Não foi possível salvar o perfil')
        }
        return data
    },
}
