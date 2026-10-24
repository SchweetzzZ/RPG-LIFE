// Regras puras de "alimentos recentes" e de copia de registros (sem acesso a banco)
import { FoodSource } from "./schema/food-nutrients";
import { normalizeSearch } from "./search-key";

export interface Nutrients100g {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface LogLike {
    foodName: string;
    amountGrams: number;
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
    source?: FoodSource;
    sourceId?: string;
    brand?: string;
    nutrientsPer100g?: Nutrients100g;
}

export interface RecentFood {
    id: string;
    name: string;
    source: FoodSource;
    brand?: string;
    servingSizeGrams: number;
    nutrientsPer100g: Nutrients100g;
    lastAmountGrams: number;
    timesLogged: number;
    lastDate: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Identidade do alimento: origem + id quando existe; senao o nome normalizado (registro antigo). */
export function foodIdentity(log: Pick<LogLike, 'source' | 'sourceId' | 'foodName'>): { source: FoodSource; id: string } {
    if (log.source && log.sourceId) return { source: log.source, id: log.sourceId };
    return { source: FoodSource.DIARY, id: normalizeSearch(log.foodName) };
}

/** Valores por 100 g: os gravados no registro ou, em registro antigo, deduzidos dos totais. */
export function per100g(log: LogLike): Nutrients100g {
    if (log.nutrientsPer100g) return log.nutrientsPer100g;
    const f = log.amountGrams > 0 ? 100 / log.amountGrams : 0;
    return {
        calories: round1(log.calories * f),
        protein: round1(log.proteinGrams * f),
        carbs: round1(log.carbGrams * f),
        fat: round1(log.fatGrams * f),
    };
}

/**
 * Agrupa os registros (do mais recente para o mais antigo) por alimento.
 * Ordem: mais vezes registrado primeiro; empate, o usado mais recentemente.
 */
export function buildRecentFoods(logsNewestFirst: (LogLike & { date: string })[], limit: number): RecentFood[] {
    const byKey = new Map<string, RecentFood>();
    for (const log of logsNewestFirst) {
        const { source, id } = foodIdentity(log);
        const key = `${source}:${id}`;
        const entry = byKey.get(key);
        if (entry) {
            entry.timesLogged += 1;
            continue;
        }
        byKey.set(key, {
            id,
            name: log.foodName,
            source,
            ...(log.brand ? { brand: log.brand } : {}),
            servingSizeGrams: log.amountGrams,
            nutrientsPer100g: per100g(log),
            lastAmountGrams: log.amountGrams,
            timesLogged: 1,
            lastDate: log.date,
        });
    }
    return [...byKey.values()]
        .sort((a, b) => b.timesLogged - a.timesLogged || b.lastDate.localeCompare(a.lastDate))
        .slice(0, limit);
}

/** Campos copiados de um registro para outro dia/refeicao (sem id, usuario, data nem refeicao). */
export function copyableFields(log: LogLike) {
    return {
        foodName: log.foodName,
        amountGrams: log.amountGrams,
        calories: log.calories,
        proteinGrams: log.proteinGrams,
        carbGrams: log.carbGrams,
        fatGrams: log.fatGrams,
        ...(log.source ? { source: log.source } : {}),
        ...(log.sourceId ? { sourceId: log.sourceId } : {}),
        ...(log.brand ? { brand: log.brand } : {}),
        ...(log.nutrientsPer100g ? { nutrientsPer100g: log.nutrientsPer100g } : {}),
    };
}
