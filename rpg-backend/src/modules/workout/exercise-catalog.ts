// Catalogo de exercicios do usuario (puro, sem acesso a banco).
// A identidade do exercicio e o nome (comparado por exerciseKey): historico e rotinas seguem por ele.

import { PerformedSet } from "./schemas/workout-log";
import { MathSet, exerciseKey, maxWeight } from "./workout-math";

export interface CatalogRoutine {
    createdAt?: Date | string;
    title?: string;
    exercises?: { name: string }[];
}

export interface CatalogLog {
    date: string;
    completedAt?: Date | string;
    exercises?: { exerciseName: string; sets?: PerformedSet[] }[];
}

export interface CatalogEntry {
    name: string;
    /** Treinos em que o exercicio aparece, na ordem em que foram criados */
    routines: string[];
    timesLogged: number;
    lastDate: string | null;
    lastSets: PerformedSet[];
    personalBestKg: number;
}

const time = (value: Date | string | undefined): number => (value ? new Date(value).getTime() : 0);

/**
 * Une exercicios de rotinas e de registros, sem duplicar pela exerciseKey.
 * O nome exibido e o da primeira vez que o exercicio foi cadastrado.
 */
export function buildCatalog(routines: CatalogRoutine[], logs: CatalogLog[]): CatalogEntry[] {
    const entries = new Map<string, CatalogEntry>();

    const ensure = (name: string): CatalogEntry => {
        const key = exerciseKey(name);
        let entry = entries.get(key);
        if (!entry) {
            entry = { name: name.trim(), routines: [], timesLogged: 0, lastDate: null, lastSets: [], personalBestKg: 0 };
            entries.set(key, entry);
        }
        return entry;
    };

    // Do mais antigo para o mais novo: o 1o nome visto e o exibido e a ultima ocorrencia vence a "ultima vez"
    const sortedLogs = [...logs].sort((a, b) => time(a.completedAt) - time(b.completedAt));
    for (const log of sortedLogs) {
        for (const ex of log.exercises ?? []) {
            if (!ex.exerciseName?.trim()) continue;
            const entry = ensure(ex.exerciseName);
            const sets = ex.sets ?? [];
            entry.timesLogged += 1;
            if (sets.length > 0) {
                entry.lastDate = log.date;
                entry.lastSets = sets.map((s) => ({ ...s }));
                entry.personalBestKg = Math.max(entry.personalBestKg, maxWeight(sets as MathSet[]));
            }
        }
    }

    const sortedRoutines = [...routines].sort((a, b) => time(a.createdAt) - time(b.createdAt));
    for (const routine of sortedRoutines) {
        const title = routine.title?.trim();
        for (const ex of routine.exercises ?? []) {
            if (!ex.name?.trim()) continue;
            const entry = ensure(ex.name);
            if (title && !entry.routines.includes(title)) entry.routines.push(title);
        }
    }

    return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/** Troca o nome nos exercicios cuja chave bate com `from`. Devolve null quando nada muda. */
export function renameInList<T>(
    items: T[] | undefined,
    from: string,
    to: string,
    getName: (item: T) => string,
    withName: (item: T, name: string) => T,
): T[] | null {
    const fromKey = exerciseKey(from);
    let changed = false;
    const next = (items ?? []).map((item) => {
        const name = getName(item);
        if (exerciseKey(name ?? '') !== fromKey || name === to) return item;
        changed = true;
        return withName(item, to);
    });
    return changed ? next : null;
}

/** Remove os exercicios cuja chave bate com `name`. Devolve null quando nada muda. */
export function removeFromList<T>(items: T[] | undefined, name: string, getName: (item: T) => string): T[] | null {
    const key = exerciseKey(name);
    const next = (items ?? []).filter((item) => exerciseKey(getName(item) ?? '') !== key);
    return next.length === (items ?? []).length ? null : next;
}
