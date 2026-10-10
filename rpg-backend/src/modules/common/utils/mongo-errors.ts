/** true se o erro e de chave duplicada do MongoDB (indice unico violado, codigo 11000). */
export function isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
