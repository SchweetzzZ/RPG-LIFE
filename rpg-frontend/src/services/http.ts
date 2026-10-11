import type { components } from "../api/schema"

type ErrorBody = components["schemas"]["ErrorResponseDto"]

/** Erro de uma chamada à API, com a mensagem do backend e o status HTTP. */
export class ApiError extends Error {
    readonly status: number

    constructor(message: string, status: number) {
        super(message)
        this.name = "ApiError"
        this.status = status
    }
}

/**
 * Monta o erro a partir de uma resposta não-2xx. O `openapi-fetch` já leu o corpo da resposta
 * (vem em `error`), então ele NÃO pode ser lido de novo com `response.json()`. Os endpoints do 3b
 * não declaram respostas de erro no OpenAPI, por isso o tipo é o `ErrorResponseDto` parcial.
 */
export function toApiError(response: Response, error: Partial<ErrorBody> | undefined, fallback: string): ApiError {
    const message = Array.isArray(error?.message) ? error.message.join(", ") : error?.message
    return new ApiError(message || fallback, response.status)
}

export function errorMessage(err: Error | string | null, fallback: string): string {
    if (err instanceof Error) return err.message
    return err ?? fallback
}
