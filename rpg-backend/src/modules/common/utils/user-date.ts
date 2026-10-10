// Utilitarios de data "do dia do usuario".
// O servidor roda em UTC, mas o "dia" de quem treina/come/anda e o dia no fuso dele:
// 22h em Sao Paulo ainda e "hoje", mesmo que em UTC ja seja amanha.
// Usa apenas Intl (sem biblioteca extra).

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/** true se `tz` e um identificador IANA aceito pelo runtime (ex.: 'America/Sao_Paulo'). */
export function isValidTimezone(tz: string): boolean {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

/** Devolve `tz` se for um fuso IANA valido; caso contrario, o fuso padrao. */
export function resolveTimezone(tz?: string | null): string {
    if (tz && isValidTimezone(tz)) {
        return tz;
    }
    return DEFAULT_TIMEZONE;
}

/** Data local ('YYYY-MM-DD') de `date` no fuso informado (padrao: agora). */
export function toUserDate(timezone?: string | null, date: Date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: resolveTimezone(timezone),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Converte 'YYYY-MM-DD' em Date UTC ao meio-dia (evita viradas de dia por fuso/horario de verao). */
function parseDateStr(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Aritmetica de calendario pura: soma (ou subtrai, se negativo) dias a 'YYYY-MM-DD'. */
export function addDays(dateStr: string, days: number): string {
    const d = parseDateStr(dateStr);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

/** Diferenca em dias de calendario: daysBetween('2026-10-10', '2026-10-12') === 2. */
export function daysBetween(fromDateStr: string, toDateStr: string): number {
    const ms = parseDateStr(toDateStr).getTime() - parseDateStr(fromDateStr).getTime();
    return Math.round(ms / 86_400_000);
}

/** Dia da semana de 'YYYY-MM-DD' no calendario puro: 0 = Domingo ... 6 = Sabado. */
export function dayOfWeek(dateStr: string): number {
    return parseDateStr(dateStr).getUTCDay();
}
