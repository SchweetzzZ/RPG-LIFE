import { client } from "./api";
import type { LoginInput, RegisterInput, LoginResponse, RegisterResponse, LogoutResponse } from "../types/auth";

export const authService = {

    async Login(credentials: LoginInput): Promise<LoginResponse> {
        const { error, data, response } = await client.POST('/user/login', { body: credentials })
        if (error || !data) {
            if (response.status === 401 || response.status === 404) {
                throw new Error("E-mail ou senha incorretos")
            }
            if (error && 'message' in error) {
                const msg = Array.isArray(error.message) ? error.message.join(', ') : error.message
                throw new Error(msg)
            }
            throw new Error('Falha ao conectar com o servidor. Tente novamente.')
        }

        return data
    },

    async Register(credentials: RegisterInput): Promise<RegisterResponse> {
        const { error, data, response } = await client.POST('/user/register', { body: credentials })
        if (error || !data) {
            if (error && 'message' in error) {
                const msg = Array.isArray(error.message) ? error.message.join(', ') : error.message
                throw new Error(msg)
            }
            if (response.status === 409) {
                throw new Error("E-mail ou nome de usuário já cadastrado")
            }
            throw new Error("Falha ao conectar com o servidor. Tente novamente")
        }
        return data
    },

    async logout(): Promise<LogoutResponse | undefined> {
        try {
            const { data } = await client.POST('/user/logout')
            return data
        } finally {
            window.location.href = "/login"
        }
    }
}

