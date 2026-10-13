/** Texto sem acento, minusculo e sem espacos nas pontas: "Feijão" e "feijao" viram a mesma chave. */
export function normalizeSearch(text: string): string {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

export function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
